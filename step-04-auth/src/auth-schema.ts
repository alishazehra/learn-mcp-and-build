import { betterAuth } from "better-auth";
import { jwt, organization } from "better-auth/plugins";
import { cimd } from "@better-auth/cimd";
import { fetchClientMetadataResource } from "@better-auth/cimd/node";
import { mcp } from "@better-auth/mcp";

// Schema-only config used by Better Auth's CLI to include plugin tables.
export const auth = betterAuth({
  baseURL: "https://learn-mcp-step-04.step-01-hello-world.workers.dev",
  basePath: "/",
  disabledPaths: ["/token"],
  plugins: [
    jwt({ disableSettingJwtHeader: true }),
    mcp({
      loginPage: "/sign-in",
      consentPage: "/consent",
      resource: "https://learn-mcp-step-04.step-01-hello-world.workers.dev/mcp",
      allowDynamicClientRegistration: true,
      allowUnauthenticatedClientRegistration: true,
      clientRegistrationDefaultApplicationType: "infer",
    }),
    cimd({
      fetchClientMetadataResource,
      metadataProfile: "mcp-2026-07-28",
    }),
    organization({ creatorRole: "admin" }),
  ],
});
