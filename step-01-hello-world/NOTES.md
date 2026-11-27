# Step 01 - Hello World MCP Server
Student: Alisha Zehra

## Live MCP URL
https://learn-mcp-step-01.step-01-hello-world.workers.dev/mcp

## What I Built
- Minimal remote MCP server in TypeScript
- Deployed to Cloudflare Workers over Streamable HTTP
- No auth yet
- Used Cloudflare stateless createMcpHandler
- Used MCP SDK v2, not deprecated McpAgent class
- Handler created once at module level, factory builds new McpServer on every request

## Tools
1. greet - takes name, returns hello message
2. get_time - returns current time

## Verification by Alisha Zehra
- Ran `npm install` - 126 packages, 0 vulnerabilities
- Ran `npm run typecheck` - passed
- Ran `npx wrangler deploy` - deployed successfully
- Ran `curl -i <live-url>/mcp` - got HTTP 405 Method Not Allowed
- 405 means server is live, MCP expects POST not GET

## GitHub
https://github.com/alishazehra/learn-mcp-and-build
Tag: step-01-done