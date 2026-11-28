import { McpServer } from "@modelcontextprotocol/server";
import { env as workerEnv } from "cloudflare:workers";
import { createMcpHandler } from "agents/mcp/server";
import { z } from "zod";

const noteIdSchema = z
  .string({ error: "Provide the note UUID returned by create_note or list_notes." })
  .uuid({ error: "id must be a valid UUID returned by create_note or list_notes." })
  .describe("The UUID returned when the note was created or listed.");

const noteSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  content: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const noteSummarySchema = noteSchema.pick({
  id: true,
  title: true,
  createdAt: true,
  updatedAt: true,
});

type Note = z.infer<typeof noteSchema>;
type NoteMetadata = Pick<Note, "title" | "createdAt" | "updatedAt">;
type Env = { NOTES: KVNamespace };

const noteKey = (id: string) => `note:${id}`;
const notesBinding = () => (workerEnv as unknown as Env).NOTES;

function notFound(id: string) {
  return {
    isError: true,
    content: [
      {
        type: "text" as const,
        text: `Note ${id} was not found. Call list_notes to find an existing UUID, then retry get_note or delete_note. If it was created moments ago, retry shortly while KV updates propagate.`,
      },
    ],
  };
}

function createServer(): McpServer {
  const server = new McpServer({
    name: "learn-mcp-step-02",
    version: "1.0.0",
  });

  server.registerTool(
    "list_notes",
    {
      title: "List notes",
      description:
        "List note IDs, titles, and timestamps without note contents. Use this to find a note ID before calling get_note; pass the returned cursor to continue a longer list.",
      inputSchema: z.object({
        limit: z
          .number({ error: "limit must be a whole number from 1 to 50." })
          .int({ error: "limit must be a whole number from 1 to 50." })
          .min(1, { error: "limit must be at least 1; omit it to use the default of 20." })
          .max(50, { error: "limit cannot exceed 50." })
          .default(20)
          .describe("Maximum notes to return; defaults to 20 and cannot exceed 50."),
        cursor: z
          .string({ error: "cursor must come from a previous list_notes result, or be omitted to start at the first page." })
          .min(1, { error: "cursor cannot be empty; omit it to start at the first page." })
          .max(2048, { error: "cursor is too long; use the cursor returned by list_notes." })
          .optional()
          .describe("Pagination cursor from the previous list_notes result."),
      }),
      outputSchema: z.object({
        notes: z.array(noteSummarySchema),
        nextCursor: z.string().optional(),
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
      },
    },
    async ({ limit, cursor }) => {
      const notesKv = notesBinding();
      const page = await notesKv.list<NoteMetadata>({
        prefix: "note:",
        limit,
        cursor,
      });
      const summaries = await Promise.all(
        page.keys.map(async (entry) => {
          const metadata =
            entry.metadata ?? (await notesKv.get<Note>(entry.name, "json"));
          if (!metadata) return null;
          return {
            id: entry.name.slice("note:".length),
            title: metadata.title,
            createdAt: metadata.createdAt,
            updatedAt: metadata.updatedAt,
          };
        }),
      );
      const noteSummaries = summaries.filter((note) => note !== null);
      const nextCursor = page.list_complete ? undefined : page.cursor;

      return {
        content: [
          {
            type: "text",
            text: nextCursor
              ? `Found ${noteSummaries.length} notes. More notes are available; continue with the returned cursor.`
              : `Found ${noteSummaries.length} notes.`,
          },
        ],
        structuredContent: { notes: noteSummaries, nextCursor },
      };
    },
  );

  server.registerTool(
    "get_note",
    {
      title: "Get a note",
      description:
        "Read the full title and content of one note by UUID. Use list_notes to find the UUID when it is not already known.",
      inputSchema: z.object({ id: noteIdSchema }),
      outputSchema: noteSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
      },
    },
    async ({ id }) => {
      const note = await notesBinding().get<Note>(noteKey(id), "json");
      if (!note) return notFound(id);

      return {
        content: [{ type: "text", text: `Retrieved note “${note.title}”.` }],
        structuredContent: note,
      };
    },
  );

  server.registerTool(
    "create_note",
    {
      title: "Create a note",
      description:
        "Save a new note with a title and content. Use this when the user asks to record or save information; the result includes the generated UUID for later retrieval or deletion.",
      inputSchema: z.object({
        title: z
          .string({ error: "title must be text between 1 and 120 characters." })
          .trim()
          .min(1, { error: "title cannot be empty; provide 1 to 120 characters." })
          .max(120, { error: "title cannot exceed 120 characters." })
          .describe("Note title, 1–120 characters after trimming."),
        content: z
          .string({ error: "content must be text between 1 and 5,000 characters." })
          .min(1, { error: "content cannot be empty; provide at least one character." })
          .max(5000, { error: "content cannot exceed 5,000 characters." })
          .describe("Note body, 1–5,000 characters."),
      }),
      outputSchema: noteSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
      },
    },
    async ({ title, content }) => {
      const now = new Date().toISOString();
      const note: Note = {
        id: crypto.randomUUID(),
        title,
        content,
        createdAt: now,
        updatedAt: now,
      };
      const metadata: NoteMetadata = {
        title: note.title,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      };

      await notesBinding().put(noteKey(note.id), JSON.stringify(note), {
        metadata,
      });

      return {
        content: [
          {
            type: "text",
            text: `Created note “${note.title}” with ID ${note.id}.`,
          },
        ],
        structuredContent: note,
      };
    },
  );

  server.registerTool(
    "delete_note",
    {
      title: "Delete a note",
      description:
        "Permanently remove one note by UUID. Use this when the user asks to delete a specific note; use list_notes first if its UUID is unknown.",
      inputSchema: z.object({ id: noteIdSchema }),
      outputSchema: z.object({ id: z.string().uuid(), deleted: z.boolean() }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
      },
    },
    async ({ id }) => {
      const key = noteKey(id);
      const note = await notesBinding().get(key, "text");
      if (note === null) return notFound(id);

      await notesBinding().delete(key);
      return {
        content: [{ type: "text", text: `Deleted note ${id}.` }],
        structuredContent: { id, deleted: true },
      };
    },
  );

  return server;
}

// The handler is shared, but each request gets a fresh MCP server from createServer.
const mcpHandler = createMcpHandler(createServer, { route: "/mcp" });

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (new URL(request.url).pathname !== "/mcp") {
      return Promise.resolve(new Response("Not found", { status: 404 }));
    }
    return mcpHandler(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
