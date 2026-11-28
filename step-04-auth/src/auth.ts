import { cimd } from "@better-auth/cimd";
import { mcp } from "@better-auth/mcp";
import { betterAuth } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { jwt, organization } from "better-auth/plugins";
import type { D1Database } from "@cloudflare/workers-types";

export const ISSUER = "https://learn-mcp-step-04.step-01-hello-world.workers.dev";
export const MCP_RESOURCE = `${ISSUER}/mcp`;

export type AuthEnv = {
  AUTH_DB: D1Database;
  BETTER_AUTH_SECRET: string;
};

export function personalCompanySlug(userId: string): string {
  const safeUserId = userId.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  return `personal-${safeUserId}`;
}

// Limit CIMD lookups to the two client hosts used by this course. Redirects are
// disabled so a client document cannot redirect the fetch to another origin.
async function fetchClientMetadataResource(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const target = new URL(input instanceof Request ? input.url : input.toString());
  const allowedHosts = new Set(["claude.ai", "chatgpt.com"]);
  if (
    target.protocol !== "https:" ||
    target.port !== "" ||
    target.username !== "" ||
    target.password !== "" ||
    !allowedHosts.has(target.hostname)
  ) {
    throw new Error("CIMD fetch is limited to HTTPS metadata on Claude and ChatGPT hosts.");
  }

  return fetch(new Request(target, { ...init, redirect: "manual" }));
}

export function createAuth(env: AuthEnv) {
  let ensurePersonalCompany: (user: { id: string; name: string }) => Promise<void> = async () => {};
  const auth = betterAuth({
    database: env.AUTH_DB,
    baseURL: ISSUER,
    basePath: "/",
    secret: env.BETTER_AUTH_SECRET,
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    // MCP access tokens are issued by /oauth2/token; the JWT plugin's /token
    // endpoint and browser-session JWT header must stay disabled.
    disabledPaths: ["/token"],
    plugins: [
      jwt({ disableSettingJwtHeader: true }),
      mcp({
        loginPage: "/sign-in",
        consentPage: "/consent",
        resource: MCP_RESOURCE,
        scopes: ["openid", "profile", "email", "offline_access", "mcp"],
        allowDynamicClientRegistration: true,
        allowUnauthenticatedClientRegistration: true,
        clientRegistrationDefaultApplicationType: "infer",
        clientRegistrationDefaultScopes: ["openid", "profile", "email", "offline_access", "mcp"],
      }),
      cimd({
        fetchClientMetadataResource,
        metadataProfile: "mcp-2026-07-28",
      }),
      organization({ creatorRole: "admin" }),
    ],
    hooks: {
      after: createAuthMiddleware(async (context) => {
        if (context.path !== "/sign-up/email" && context.path !== "/sign-in/email") return;

        const user = context.context.newSession?.user;
        if (user) await ensurePersonalCompany({ id: user.id, name: user.name });
      }),
    },
  });

  ensurePersonalCompany = async (user) => {
    const slug = personalCompanySlug(user.id);
    const existing = await env.AUTH_DB
      .prepare("SELECT id FROM organization WHERE slug = ?1 LIMIT 1")
      .bind(slug)
      .first<{ id: string }>();
    if (existing) return;

    // The organization plugin also creates the creator's admin membership.
    await auth.api.createOrganization({
      body: {
        userId: user.id,
        name: `${user.name}'s company`,
        slug,
      },
    });
  };

  return auth;
}
