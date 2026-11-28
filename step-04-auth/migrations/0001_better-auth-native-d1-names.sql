ALTER TABLE "oauth_access_token" RENAME TO "oauthAccessToken";
--> statement-breakpoint
ALTER TABLE "oauth_client" RENAME TO "oauthClient";
--> statement-breakpoint
ALTER TABLE "oauth_client_assertion" RENAME TO "oauthClientAssertion";
--> statement-breakpoint
ALTER TABLE "oauth_client_resource" RENAME TO "oauthClientResource";
--> statement-breakpoint
ALTER TABLE "oauth_consent" RENAME TO "oauthConsent";
--> statement-breakpoint
ALTER TABLE "oauth_refresh_token" RENAME TO "oauthRefreshToken";
--> statement-breakpoint
ALTER TABLE "oauth_resource" RENAME TO "oauthResource";
--> statement-breakpoint
ALTER TABLE "account" RENAME COLUMN "account_id" TO "accountId";
--> statement-breakpoint
ALTER TABLE "account" RENAME COLUMN "provider_id" TO "providerId";
--> statement-breakpoint
ALTER TABLE "account" RENAME COLUMN "user_id" TO "userId";
--> statement-breakpoint
ALTER TABLE "account" RENAME COLUMN "access_token" TO "accessToken";
--> statement-breakpoint
ALTER TABLE "account" RENAME COLUMN "refresh_token" TO "refreshToken";
--> statement-breakpoint
ALTER TABLE "account" RENAME COLUMN "id_token" TO "idToken";
--> statement-breakpoint
ALTER TABLE "account" RENAME COLUMN "access_token_expires_at" TO "accessTokenExpiresAt";
--> statement-breakpoint
ALTER TABLE "account" RENAME COLUMN "refresh_token_expires_at" TO "refreshTokenExpiresAt";
--> statement-breakpoint
ALTER TABLE "account" RENAME COLUMN "created_at" TO "createdAt";
--> statement-breakpoint
ALTER TABLE "account" RENAME COLUMN "updated_at" TO "updatedAt";
--> statement-breakpoint
ALTER TABLE "invitation" RENAME COLUMN "organization_id" TO "organizationId";
--> statement-breakpoint
ALTER TABLE "invitation" RENAME COLUMN "expires_at" TO "expiresAt";
--> statement-breakpoint
ALTER TABLE "invitation" RENAME COLUMN "created_at" TO "createdAt";
--> statement-breakpoint
ALTER TABLE "invitation" RENAME COLUMN "inviter_id" TO "inviterId";
--> statement-breakpoint
ALTER TABLE "jwks" RENAME COLUMN "public_key" TO "publicKey";
--> statement-breakpoint
ALTER TABLE "jwks" RENAME COLUMN "private_key" TO "privateKey";
--> statement-breakpoint
ALTER TABLE "jwks" RENAME COLUMN "created_at" TO "createdAt";
--> statement-breakpoint
ALTER TABLE "jwks" RENAME COLUMN "expires_at" TO "expiresAt";
--> statement-breakpoint
ALTER TABLE "member" RENAME COLUMN "organization_id" TO "organizationId";
--> statement-breakpoint
ALTER TABLE "member" RENAME COLUMN "user_id" TO "userId";
--> statement-breakpoint
ALTER TABLE "member" RENAME COLUMN "created_at" TO "createdAt";
--> statement-breakpoint
ALTER TABLE "oauthAccessToken" RENAME COLUMN "client_id" TO "clientId";
--> statement-breakpoint
ALTER TABLE "oauthAccessToken" RENAME COLUMN "session_id" TO "sessionId";
--> statement-breakpoint
ALTER TABLE "oauthAccessToken" RENAME COLUMN "user_id" TO "userId";
--> statement-breakpoint
ALTER TABLE "oauthAccessToken" RENAME COLUMN "reference_id" TO "referenceId";
--> statement-breakpoint
ALTER TABLE "oauthAccessToken" RENAME COLUMN "authorization_code_id" TO "authorizationCodeId";
--> statement-breakpoint
ALTER TABLE "oauthAccessToken" RENAME COLUMN "requested_user_info_claims" TO "requestedUserInfoClaims";
--> statement-breakpoint
ALTER TABLE "oauthAccessToken" RENAME COLUMN "refresh_id" TO "refreshId";
--> statement-breakpoint
ALTER TABLE "oauthAccessToken" RENAME COLUMN "expires_at" TO "expiresAt";
--> statement-breakpoint
ALTER TABLE "oauthAccessToken" RENAME COLUMN "created_at" TO "createdAt";
--> statement-breakpoint
ALTER TABLE "oauthClient" RENAME COLUMN "client_id" TO "clientId";
--> statement-breakpoint
ALTER TABLE "oauthClient" RENAME COLUMN "client_secret" TO "clientSecret";
--> statement-breakpoint
ALTER TABLE "oauthClient" RENAME COLUMN "client_discovery_id" TO "clientDiscoveryId";
--> statement-breakpoint
ALTER TABLE "oauthClient" RENAME COLUMN "skip_consent" TO "skipConsent";
--> statement-breakpoint
ALTER TABLE "oauthClient" RENAME COLUMN "enable_end_session" TO "enableEndSession";
--> statement-breakpoint
ALTER TABLE "oauthClient" RENAME COLUMN "subject_type" TO "subjectType";
--> statement-breakpoint
ALTER TABLE "oauthClient" RENAME COLUMN "client_credentials_scopes" TO "clientCredentialsScopes";
--> statement-breakpoint
ALTER TABLE "oauthClient" RENAME COLUMN "user_id" TO "userId";
--> statement-breakpoint
ALTER TABLE "oauthClient" RENAME COLUMN "created_at" TO "createdAt";
--> statement-breakpoint
ALTER TABLE "oauthClient" RENAME COLUMN "updated_at" TO "updatedAt";
--> statement-breakpoint
ALTER TABLE "oauthClient" RENAME COLUMN "software_id" TO "softwareId";
--> statement-breakpoint
ALTER TABLE "oauthClient" RENAME COLUMN "software_version" TO "softwareVersion";
--> statement-breakpoint
ALTER TABLE "oauthClient" RENAME COLUMN "software_statement" TO "softwareStatement";
--> statement-breakpoint
ALTER TABLE "oauthClient" RENAME COLUMN "redirect_uris" TO "redirectUris";
--> statement-breakpoint
ALTER TABLE "oauthClient" RENAME COLUMN "post_logout_redirect_uris" TO "postLogoutRedirectUris";
--> statement-breakpoint
ALTER TABLE "oauthClient" RENAME COLUMN "backchannel_logout_uri" TO "backchannelLogoutUri";
--> statement-breakpoint
ALTER TABLE "oauthClient" RENAME COLUMN "backchannel_logout_session_required" TO "backchannelLogoutSessionRequired";
--> statement-breakpoint
ALTER TABLE "oauthClient" RENAME COLUMN "token_endpoint_auth_method" TO "tokenEndpointAuthMethod";
--> statement-breakpoint
ALTER TABLE "oauthClient" RENAME COLUMN "application_type" TO "applicationType";
--> statement-breakpoint
ALTER TABLE "oauthClient" RENAME COLUMN "jwks_uri" TO "jwksUri";
--> statement-breakpoint
ALTER TABLE "oauthClient" RENAME COLUMN "grant_types" TO "grantTypes";
--> statement-breakpoint
ALTER TABLE "oauthClient" RENAME COLUMN "response_types" TO "responseTypes";
--> statement-breakpoint
ALTER TABLE "oauthClient" RENAME COLUMN "require_pkce" TO "requirePkce";
--> statement-breakpoint
ALTER TABLE "oauthClient" RENAME COLUMN "dpop_bound_access_tokens" TO "dpopBoundAccessTokens";
--> statement-breakpoint
ALTER TABLE "oauthClient" RENAME COLUMN "reference_id" TO "referenceId";
--> statement-breakpoint
ALTER TABLE "oauthClientAssertion" RENAME COLUMN "expires_at" TO "expiresAt";
--> statement-breakpoint
ALTER TABLE "oauthClientResource" RENAME COLUMN "client_id" TO "clientId";
--> statement-breakpoint
ALTER TABLE "oauthClientResource" RENAME COLUMN "resource_id" TO "resourceId";
--> statement-breakpoint
ALTER TABLE "oauthClientResource" RENAME COLUMN "created_at" TO "createdAt";
--> statement-breakpoint
ALTER TABLE "oauthConsent" RENAME COLUMN "client_id" TO "clientId";
--> statement-breakpoint
ALTER TABLE "oauthConsent" RENAME COLUMN "user_id" TO "userId";
--> statement-breakpoint
ALTER TABLE "oauthConsent" RENAME COLUMN "reference_id" TO "referenceId";
--> statement-breakpoint
ALTER TABLE "oauthConsent" RENAME COLUMN "requested_user_info_claims" TO "requestedUserInfoClaims";
--> statement-breakpoint
ALTER TABLE "oauthConsent" RENAME COLUMN "created_at" TO "createdAt";
--> statement-breakpoint
ALTER TABLE "oauthConsent" RENAME COLUMN "updated_at" TO "updatedAt";
--> statement-breakpoint
ALTER TABLE "oauthRefreshToken" RENAME COLUMN "client_id" TO "clientId";
--> statement-breakpoint
ALTER TABLE "oauthRefreshToken" RENAME COLUMN "session_id" TO "sessionId";
--> statement-breakpoint
ALTER TABLE "oauthRefreshToken" RENAME COLUMN "user_id" TO "userId";
--> statement-breakpoint
ALTER TABLE "oauthRefreshToken" RENAME COLUMN "reference_id" TO "referenceId";
--> statement-breakpoint
ALTER TABLE "oauthRefreshToken" RENAME COLUMN "authorization_code_id" TO "authorizationCodeId";
--> statement-breakpoint
ALTER TABLE "oauthRefreshToken" RENAME COLUMN "requested_user_info_claims" TO "requestedUserInfoClaims";
--> statement-breakpoint
ALTER TABLE "oauthRefreshToken" RENAME COLUMN "expires_at" TO "expiresAt";
--> statement-breakpoint
ALTER TABLE "oauthRefreshToken" RENAME COLUMN "created_at" TO "createdAt";
--> statement-breakpoint
ALTER TABLE "oauthRefreshToken" RENAME COLUMN "rotated_at" TO "rotatedAt";
--> statement-breakpoint
ALTER TABLE "oauthRefreshToken" RENAME COLUMN "rotation_replay_response" TO "rotationReplayResponse";
--> statement-breakpoint
ALTER TABLE "oauthRefreshToken" RENAME COLUMN "rotation_replay_expires_at" TO "rotationReplayExpiresAt";
--> statement-breakpoint
ALTER TABLE "oauthRefreshToken" RENAME COLUMN "auth_time" TO "authTime";
--> statement-breakpoint
ALTER TABLE "oauthResource" RENAME COLUMN "access_token_ttl" TO "accessTokenTtl";
--> statement-breakpoint
ALTER TABLE "oauthResource" RENAME COLUMN "refresh_token_ttl" TO "refreshTokenTtl";
--> statement-breakpoint
ALTER TABLE "oauthResource" RENAME COLUMN "signing_algorithm" TO "signingAlgorithm";
--> statement-breakpoint
ALTER TABLE "oauthResource" RENAME COLUMN "signing_key_id" TO "signingKeyId";
--> statement-breakpoint
ALTER TABLE "oauthResource" RENAME COLUMN "allowed_scopes" TO "allowedScopes";
--> statement-breakpoint
ALTER TABLE "oauthResource" RENAME COLUMN "custom_claims" TO "customClaims";
--> statement-breakpoint
ALTER TABLE "oauthResource" RENAME COLUMN "dpop_bound_access_tokens_required" TO "dpopBoundAccessTokensRequired";
--> statement-breakpoint
ALTER TABLE "oauthResource" RENAME COLUMN "created_at" TO "createdAt";
--> statement-breakpoint
ALTER TABLE "oauthResource" RENAME COLUMN "updated_at" TO "updatedAt";
--> statement-breakpoint
ALTER TABLE "oauthResource" RENAME COLUMN "policy_version" TO "policyVersion";
--> statement-breakpoint
ALTER TABLE "organization" RENAME COLUMN "created_at" TO "createdAt";
--> statement-breakpoint
ALTER TABLE "session" RENAME COLUMN "expires_at" TO "expiresAt";
--> statement-breakpoint
ALTER TABLE "session" RENAME COLUMN "created_at" TO "createdAt";
--> statement-breakpoint
ALTER TABLE "session" RENAME COLUMN "updated_at" TO "updatedAt";
--> statement-breakpoint
ALTER TABLE "session" RENAME COLUMN "ip_address" TO "ipAddress";
--> statement-breakpoint
ALTER TABLE "session" RENAME COLUMN "user_agent" TO "userAgent";
--> statement-breakpoint
ALTER TABLE "session" RENAME COLUMN "user_id" TO "userId";
--> statement-breakpoint
ALTER TABLE "session" RENAME COLUMN "active_organization_id" TO "activeOrganizationId";
--> statement-breakpoint
ALTER TABLE "user" RENAME COLUMN "email_verified" TO "emailVerified";
--> statement-breakpoint
ALTER TABLE "user" RENAME COLUMN "created_at" TO "createdAt";
--> statement-breakpoint
ALTER TABLE "user" RENAME COLUMN "updated_at" TO "updatedAt";
--> statement-breakpoint
ALTER TABLE "verification" RENAME COLUMN "expires_at" TO "expiresAt";
--> statement-breakpoint
ALTER TABLE "verification" RENAME COLUMN "created_at" TO "createdAt";
--> statement-breakpoint
ALTER TABLE "verification" RENAME COLUMN "updated_at" TO "updatedAt";
--> statement-breakpoint
ALTER TABLE "member" ADD COLUMN "organization_id" TEXT GENERATED ALWAYS AS ("organizationId") VIRTUAL;
--> statement-breakpoint
ALTER TABLE "member" ADD COLUMN "user_id" TEXT GENERATED ALWAYS AS ("userId") VIRTUAL;
--> statement-breakpoint
ALTER TABLE "member" ADD COLUMN "created_at" INTEGER GENERATED ALWAYS AS ("createdAt") VIRTUAL;
