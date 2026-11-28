import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";

// Deliberately poor example for comparison; do not register it in the Worker.
export function registerBadNoteTool(server: McpServer): void {
  server.registerTool(
    "do_thing",
    {
      inputSchema: z.object({
        value: z.string().optional(),
      }),
    },
    async ({ value }) => ({
      content: [{
        type: "text",
        text: value ? `Done: ${value}` : "Done.",
      }],
    }),
  );
}
