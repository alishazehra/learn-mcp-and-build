import { env as workerEnv } from "cloudflare:workers";
import { requireMcpAuth } from "@better-auth/mcp";
import { createAuth, MCP_RESOURCE, personalCompanySlug, type AuthEnv } from "./auth";
import { consentPage, signInPage } from "./auth-pages";

type Env = AuthEnv & { NOTES: KVNamespace };
type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};
type NoteMetadata = Pick<Note, "title" | "createdAt" | "updatedAt">;
type NoteIdentity = { userId: string; organizationId: string; role: "member" | "admin" };
type JsonRpcId = string | number;
type JsonRpcRequest = { jsonrpc: "2.0"; id?: JsonRpcId; method: string; params?: unknown };
type ToolResult = {
  content: Array<{ type: "text"; text: string }>;
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
  resourceChanged?: boolean;
};

const PROTOCOL_VERSION = "2025-03-26";
const notePrefix = (identity: NoteIdentity) =>
  `org:${identity.organizationId}:user:${identity.userId}:note:`;
const noteKey = (identity: NoteIdentity, id: string) => `${notePrefix(identity)}${id}`;
const notesBinding = () => (workerEnv as unknown as Env).NOTES;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function rpcResult(id: JsonRpcId, result: unknown): Response {
  return Response.json({ jsonrpc: "2.0", id, result }, {
    headers: { "MCP-Protocol-Version": PROTOCOL_VERSION, "Cache-Control": "no-store" },
  });
}

function rpcError(id: JsonRpcId | null, code: number, message: string): Response {
  return Response.json({ jsonrpc: "2.0", id, error: { code, message } }, {
    headers: { "MCP-Protocol-Version": PROTOCOL_VERSION, "Cache-Control": "no-store" },
  });
}

function textResult(text: string, structuredContent?: Record<string, unknown>, isError = false): ToolResult {
  return {
    content: [{ type: "text", text }],
    ...(structuredContent ? { structuredContent } : {}),
    ...(isError ? { isError: true } : {}),
  };
}

function asIdentity(extra: unknown): NoteIdentity {
  if (!isRecord(extra)) throw new Error("Authenticated MCP identity is missing.");
  const { userId, organizationId, role } = extra;
  if (typeof userId !== "string" || typeof organizationId !== "string" ||
      (role !== "member" && role !== "admin")) {
    throw new Error("Authenticated MCP identity is invalid.");
  }
  return { userId, organizationId, role };
}

async function listNotes(identity: NoteIdentity, limit: number, cursor?: string) {
  const notesKv = notesBinding();
  const page = await notesKv.list<NoteMetadata>({
    prefix: notePrefix(identity),
    limit,
    cursor,
  });
  const notes = await Promise.all(page.keys.map(async (entry) => {
    const metadata = entry.metadata ?? await notesKv.get<Note>(entry.name, "json");
    if (!metadata) return null;
    return {
      id: entry.name.slice(notePrefix(identity).length),
      title: metadata.title,
      created_at: metadata.createdAt,
    };
  }));
  return {
    notes: notes.filter((note) => note !== null),
    nextCursor: page.list_complete ? undefined : page.cursor,
  };
}

async function listResources(identity: NoteIdentity) {
  const resources: Array<{ uri: string; name: string; description: string; mimeType: string }> = [];
  let cursor: string | undefined;
  do {
    const page = await notesBinding().list<NoteMetadata>({
      prefix: notePrefix(identity),
      limit: 1000,
      cursor,
    });
    const listed = await Promise.all(page.keys.map(async (entry) => {
      const metadata = entry.metadata ?? await notesBinding().get<Note>(entry.name, "json");
      if (!metadata) return null;
      const id = entry.name.slice(notePrefix(identity).length);
      return {
        uri: `notes://${id}`,
        name: metadata.title,
        description: `Note created ${metadata.createdAt}.`,
        mimeType: "text/markdown",
      };
    }));
    resources.push(...listed.filter((resource) => resource !== null));
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return resources;
}

async function callTool(name: string, args: unknown, identity: NoteIdentity): Promise<ToolResult> {
  if (!isRecord(args)) return textResult("Tool arguments must be a JSON object.", undefined, true);

  if (name === "list_notes") {
    const limit = args.limit === undefined ? 20 : args.limit;
    if (typeof limit !== "number" || !Number.isInteger(limit) || limit < 1 || limit > 50) {
      return textResult("limit must be a whole number from 1 to 50.", undefined, true);
    }
    if (args.cursor !== undefined && (typeof args.cursor !== "string" || args.cursor.length < 1 || args.cursor.length > 2048)) {
      return textResult("cursor must be a non-empty cursor returned by list_notes, no longer than 2048 characters.", undefined, true);
    }
    const result = await listNotes(identity, limit, args.cursor as string | undefined);
    return textResult(JSON.stringify(result, null, 2), result);
  }

  if (name === "get_note") {
    if (!isUuid(args.id)) return textResult("id must be a valid note UUID.", undefined, true);
    const note = await notesBinding().get<Note>(noteKey(identity, args.id), "json");
    if (!note) return textResult(`Note ${args.id} was not found. Call list_notes to find an existing UUID.`, undefined, true);
    const result = { id: note.id, title: note.title, content: note.content };
    return textResult(JSON.stringify(result, null, 2), result);
  }

  if (name === "create_note") {
    if (typeof args.title !== "string" || args.title.trim().length < 1 || args.title.trim().length > 120) {
      return textResult("title must be 1 to 120 characters after trimming.", undefined, true);
    }
    if (typeof args.content !== "string" || args.content.length < 1 || args.content.length > 5000) {
      return textResult("content must be 1 to 5,000 characters.", undefined, true);
    }
    const now = new Date().toISOString();
    const note: Note = {
      id: crypto.randomUUID(),
      title: args.title.trim(),
      content: args.content,
      createdAt: now,
      updatedAt: now,
    };
    const metadata: NoteMetadata = { title: note.title, createdAt: note.createdAt, updatedAt: note.updatedAt };
    await notesBinding().put(noteKey(identity, note.id), JSON.stringify(note), { metadata });
    return { ...textResult(`Created note “${note.title}” with ID ${note.id}.`, note), resourceChanged: true };
  }

  if (name === "delete_note") {
    if (!isUuid(args.id)) return textResult("id must be a valid note UUID.", undefined, true);
    const key = noteKey(identity, args.id);
    const note = await notesBinding().get(key, "text");
    if (note === null) return textResult(`Note ${args.id} was not found. Call list_notes to find an existing UUID.`, undefined, true);
    await notesBinding().delete(key);
    return { ...textResult(`Deleted note ${args.id}.`, { id: args.id, deleted: true }), resourceChanged: true };
  }

  if (name === "list_company_members") {
    if (identity.role !== "admin") {
      return textResult("Forbidden: list_company_members requires the company admin role.", undefined, true);
    }
    const result = await (workerEnv as unknown as Env).AUTH_DB
      .prepare(
        `SELECT member.user_id AS userId, user.name, user.email, member.role, member.created_at AS createdAt
         FROM member
         JOIN user ON user.id = member.user_id
         WHERE member.organization_id = ?1
         ORDER BY user.name
         LIMIT 100`,
      )
      .bind(identity.organizationId)
      .all<{ userId: string; name: string; email: string; role: string; createdAt: number }>();
    const output = { members: result.results.map((member) => ({ ...member })) };
    return textResult(JSON.stringify(output, null, 2), output);
  }

  return textResult(`Unknown tool: ${name}`, undefined, true);
}

function toolDefinitions() {
  return [
    {
      name: "list_notes",
      title: "List notes",
      description: "List note IDs, titles, and timestamps without note contents. Use this to find a note ID before calling get_note; pass the returned cursor to continue a longer list.",
      inputSchema: { type: "object", properties: {
        limit: { type: "integer", minimum: 1, maximum: 50, default: 20, description: "Maximum notes to return; defaults to 20." },
        cursor: { type: "string", minLength: 1, maxLength: 2048, description: "Pagination cursor from the previous list_notes result." },
      } },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
    },
    {
      name: "get_note",
      title: "Get a note",
      description: "Read the full title and content of one note by UUID. Use list_notes to find the UUID when it is not already known.",
      inputSchema: { type: "object", properties: { id: { type: "string", format: "uuid" } }, required: ["id"] },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
    },
    {
      name: "create_note",
      title: "Create a note",
      description: "Save a new note with a title and content. The result includes the generated UUID for later retrieval or deletion.",
      inputSchema: { type: "object", properties: {
        title: { type: "string", minLength: 1, maxLength: 120, description: "Note title, 1–120 characters after trimming." },
        content: { type: "string", minLength: 1, maxLength: 5000, description: "Note body, 1–5,000 characters." },
      }, required: ["title", "content"] },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    },
    {
      name: "delete_note",
      title: "Delete a note",
      description: "Permanently remove one note by UUID. Use list_notes first if its UUID is unknown.",
      inputSchema: { type: "object", properties: { id: { type: "string", format: "uuid" } }, required: ["id"] },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true },
    },
    {
      name: "list_company_members",
      title: "List company members",
      description: "List people in the authenticated user's company. Available to company admins only; company identity comes from the verified access token.",
      inputSchema: { type: "object", properties: {} },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
    },
  ];
}

function promptDefinitions() {
  return [
    { name: "summarize_notes", description: "Summarize saved notes, optionally focusing on a tag or topic.", arguments: [{ name: "tag", description: "Optional tag or topic to focus the summary on.", required: false }] },
    { name: "draft_note_from_meeting", description: "Turn meeting notes or a transcript into a proposed saved note.", arguments: [{ name: "meeting_text", description: "Meeting notes or transcript to turn into a note draft.", required: true }] },
  ];
}

function getPrompt(name: string, args: unknown) {
  const values = isRecord(args) ? args : {};
  if (name === "summarize_notes") {
    if (values.tag !== undefined && (typeof values.tag !== "string" || values.tag.length > 80)) {
      throw new Error("tag must be text no longer than 80 characters.");
    }
    const tag = values.tag as string | undefined;
    const text = [
      "Summarize the user's saved notes. Start with list_notes, follow every returned cursor, then read relevant notes with get_note or their notes://{id} resources before writing the summary.",
      tag ? `Focus on notes related to "${tag}". This server currently has no formal tag metadata, so treat the argument as a topic to match against note titles and contents. Say when no matching notes are found.` : "Cover the notes you find, grouping related points and preserving important decisions and action items.",
      "Base the summary only on retrieved notes, and mention note titles when useful. Do not create or change notes.",
    ].join("\n\n");
    return { description: "Summarize saved notes.", messages: [{ role: "user", content: { type: "text", text } }] };
  }
  if (name === "draft_note_from_meeting") {
    if (typeof values.meeting_text !== "string" || values.meeting_text.length < 1 || values.meeting_text.length > 12000) {
      throw new Error("meeting_text must be 1 to 12,000 characters.");
    }
    const text = `Draft a clear, concise note from this meeting text:\n\n${values.meeting_text}\n\nFirst use list_notes to check for related context, then read relevant notes with get_note or their notes://{id} resources. Separate decisions, action items, owners, and dates when present; do not invent missing details. Return a suggested title and note body. Do not call create_note yet: show the draft and ask the user before saving it.`;
    return { description: "Draft a note from a meeting.", messages: [{ role: "user", content: { type: "text", text } }] };
  }
  throw new Error(`Unknown prompt: ${name}`);
}

async function dispatchMcp(request: Request, identity: NoteIdentity): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: { Allow: "POST" } });
  }
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return new Response("Content-Type must be application/json", { status: 415 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return rpcError(null, -32700, "Parse error");
  }
  if (!isRecord(body) || body.jsonrpc !== "2.0" || typeof body.method !== "string" ||
      (body.id !== undefined && typeof body.id !== "string" && typeof body.id !== "number")) {
    return rpcError(null, -32600, "Invalid Request");
  }
  const rpc = body as JsonRpcRequest;
  const hasId = Object.prototype.hasOwnProperty.call(body, "id");
  if (!hasId) return new Response(null, { status: 202 });
  const id = rpc.id as JsonRpcId;
  const params = isRecord(rpc.params) ? rpc.params : {};

  try {
    if (rpc.method === "initialize") {
      return rpcResult(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: {
          tools: { listChanged: false },
          resources: { listChanged: true },
          prompts: {},
        },
        serverInfo: { name: "learn-mcp-step-04", version: "1.0.0" },
      });
    }
    if (rpc.method === "ping") return rpcResult(id, {});
    if (rpc.method === "tools/list") return rpcResult(id, { tools: toolDefinitions() });
    if (rpc.method === "tools/call") {
      if (typeof params.name !== "string") return rpcError(id, -32602, "tools/call requires a tool name.");
      const result = await callTool(params.name, params.arguments ?? {}, identity);
      if (result.resourceChanged) {
        const output = { ...result } as Record<string, unknown>;
        delete output.resourceChanged;
        if (request.headers.get("accept")?.includes("text/event-stream")) {
          const messages = [
            { jsonrpc: "2.0", method: "notifications/resources/list_changed" },
            { jsonrpc: "2.0", id, result: output },
          ];
          const body = messages.map((message) => `event: message\ndata: ${JSON.stringify(message)}\n\n`).join("");
          return new Response(body, { headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "MCP-Protocol-Version": PROTOCOL_VERSION,
          } });
        }
        return rpcResult(id, output);
      }
      return rpcResult(id, result);
    }
    if (rpc.method === "resources/list") {
      return rpcResult(id, { resources: await listResources(identity) });
    }
    if (rpc.method === "resources/templates/list") {
      return rpcResult(id, { resourceTemplates: [{ uriTemplate: "notes://{id}", name: "note", title: "Notes", description: "Read a saved note by its UUID.", mimeType: "text/markdown" }] });
    }
    if (rpc.method === "resources/read") {
      if (typeof params.uri !== "string") return rpcError(id, -32602, "resources/read requires a URI.");
      const match = /^notes:\/\/([0-9a-f-]+)$/i.exec(params.uri);
      if (!match || !isUuid(match[1])) return rpcError(id, -32602, `Resource ${params.uri} was not found.`);
      const note = await notesBinding().get<Note>(noteKey(identity, match[1]), "json");
      if (!note) return rpcError(id, -32602, `Resource ${params.uri} was not found.`);
      return rpcResult(id, { contents: [{
        uri: params.uri,
        mimeType: "text/markdown",
        text: `# ${note.title}\n\n- id: ${note.id}\n- created_at: ${note.createdAt}\n\n${note.content}`,
      }] });
    }
    if (rpc.method === "prompts/list") return rpcResult(id, { prompts: promptDefinitions() });
    if (rpc.method === "prompts/get") {
      if (typeof params.name !== "string") return rpcError(id, -32602, "prompts/get requires a prompt name.");
      try {
        return rpcResult(id, getPrompt(params.name, params.arguments));
      } catch (error) {
        return rpcError(id, -32602, error instanceof Error ? error.message : "Invalid prompt arguments.");
      }
    }
    return rpcError(id, -32601, `Method not found: ${rpc.method}`);
  } catch (error) {
    return rpcError(id, -32603, error instanceof Error ? error.message : "Internal error");
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const auth = createAuth(env);

    if (request.method === "GET" && url.pathname === "/sign-in") {
      return new Response(signInPage, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
    if (request.method === "GET" && url.pathname === "/consent") {
      return new Response(consentPage, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
    if (url.pathname !== "/mcp") return auth.handler(request);

    const protectedHandler = requireMcpAuth(
      auth,
      async (authenticatedRequest, claims) => {
        if (typeof claims.sub !== "string") {
          return Response.json({ error: "The access token has no user identity." }, { status: 403 });
        }
        const userId = claims.sub;
        const membership = await env.AUTH_DB
          .prepare(
            `SELECT member.organization_id, member.role
             FROM member
             JOIN organization ON organization.id = member.organization_id
             WHERE member.user_id = ?1 AND organization.slug = ?2
             LIMIT 1`,
          )
          .bind(userId, personalCompanySlug(userId))
          .first<{ organization_id: string; role: string }>();
        if (!membership) {
          return Response.json({ error: "No personal company membership was found." }, { status: 403 });
        }
        const membershipRoles = membership.role.split(",");
        const role = membershipRoles.includes("admin") || membershipRoles.includes("owner") ? "admin" : "member";
        const identity: NoteIdentity = { userId, organizationId: membership.organization_id, role };
        return dispatchMcp(authenticatedRequest, identity);
      },
      { resource: MCP_RESOURCE },
    );
    return protectedHandler(request);
  },
} satisfies ExportedHandler<Env>;