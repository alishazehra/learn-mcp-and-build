import { McpServer } from "@modelcontextprotocol/server";
import { createMcpHandler } from "agents/mcp/server";
import { z } from "zod";

function createServer(): McpServer {
  const server = new McpServer({
    name: "learn-mcp-step-01",
    version: "1.0.0",
  });

  server.registerTool(
    "greet",
    {
      title: "Greet someone",
      description: "Return a friendly greeting for the supplied name.",
      inputSchema: z.object({
        name: z
          .string()
          .trim()
          .min(1)
          .max(80)
          .describe("The name to include in the greeting."),
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
      },
    },
    async ({ name }) => ({
      content: [{ type: "text", text: `Hello, ${name}!` }],
    }),
  );

  server.registerTool(
    "get_time",
    {
      title: "Get the current time",
      description:
        "Return the current date and time, optionally formatted for an IANA timezone such as Europe/London.",
      inputSchema: z.object({
        timezone: z
          .string()
          .optional()
          .describe("Optional IANA timezone; defaults to UTC."),
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
      },
    },
    async ({ timezone }) => {
      const timeZone = timezone ?? "UTC";

      try {
        const formatted = new Intl.DateTimeFormat("en-US", {
          dateStyle: "full",
          timeStyle: "long",
          timeZone,
        }).format(new Date());

        return {
          content: [{ type: "text", text: formatted }],
        };
      } catch {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Invalid IANA timezone: ${timeZone}. Try a value such as UTC or Europe/London.`,
            },
          ],
        };
      }
    },
  );

  return server;
}

// Keep only the request handler at module scope; it creates a fresh server for each call.
const mcpHandler = createMcpHandler(createServer, { route: "/mcp" });

type Env = Record<string, never>;

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (new URL(request.url).pathname !== "/mcp") {
      return Promise.resolve(new Response("Not found", { status: 404 }));
    }

    return mcpHandler(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
