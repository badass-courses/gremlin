# ADR-001: Auth Architecture - Hive + Spoke Model

**Status**: Accepted
**Date**: 2024-12-18
**Authors**: @joelhooks

## Context

Creators using @badass often have multiple sites under different TLDs (e.g., Kent C. Dodds has epicweb.dev, epicreact.dev, epicai.pro). Users expect a unified identity - purchasing on one site should grant access across all sites without creating separate accounts.

Key constraints:

1. **Different TLDs**: Sites are on different domains, not subdomains
2. **Shared database**: Creator's sites share a database (per ADR-XXX)
3. **Cookie limitations**: Browser cookies don't share across different TLDs
4. **BetterAuth limitation**: `crossSubDomainCookies` only works for subdomains of the same root domain

The driving use case: A user buys Epic React, then starts the Workshop App tutorial on EpicWeb.dev. They shouldn't need a separate account.

## Decision

Implement a **Hive + Spoke** authentication model:

1. **Hive Site**: Each creator designates ONE site as their auth "hive" (e.g., epicweb.dev for Kent). This site runs BetterAuth with the `oidcProvider` plugin, acting as an Identity Provider (IdP).

2. **Spoke Sites**: All other sites (epicreact.dev, epicai.pro) are "spokes" that trust the hive. They redirect to the hive for authentication using standard OAuth/OIDC flows.

3. **Shared Database**: Since all sites share a database, user/session data is already unified. The auth handshake just establishes the session on the spoke site.

4. **Device Flow**: For CLI tools and local apps (like Workshop App), implement RFC 8628 Device Authorization Grant. User authenticates on hive site, CLI receives tokens.

### Implementation

```
┌─────────────────┐     OAuth/OIDC      ┌─────────────────┐
│   Spoke Site    │ ──────────────────► │    Hive Site    │
│ epicreact.dev   │                     │  epicweb.dev    │
│                 │ ◄────────────────── │  (IdP)          │
│ genericOAuth    │     tokens          │  oidcProvider   │
└─────────────────┘                     └─────────────────┘
         │                                       │
         │              Shared DB                │
         └───────────────┬───────────────────────┘
                         │
                   ┌─────▼─────┐
                   │  Users    │
                   │  Sessions │
                   │  Accounts │
                   └───────────┘
```

**Hive configuration** (BetterAuth):

```typescript
// epicweb.dev/lib/auth.ts
import { betterAuth } from "better-auth";
import { oidcProvider } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    oidcProvider({
      loginPage: "/sign-in",
    }),
  ],
  trustedOrigins: ["https://epicreact.dev", "https://epicai.pro"],
});
```

**Spoke configuration** (BetterAuth):

```typescript
// epicreact.dev/lib/auth.ts
import { betterAuth } from "better-auth";
import { genericOAuth } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    genericOAuth({
      config: [
        {
          providerId: "epicweb",
          clientId: process.env.EPICWEB_CLIENT_ID,
          clientSecret: process.env.EPICWEB_CLIENT_SECRET,
          discoveryUrl: "https://epicweb.dev/.well-known/openid-configuration",
        },
      ],
    }),
  ],
});
```

## Consequences

### Positive

- **Standard protocol**: Uses OAuth/OIDC, well-understood and battle-tested
- **Single source of truth**: Hive site owns identity, spokes just trust it
- **Works across TLDs**: No cookie sharing needed, just token exchange
- **Device flow support**: CLI and local apps can authenticate without browser redirect
- **Shared DB leverage**: User data already unified, minimal duplication

### Negative

- **Hive dependency**: If hive site is down, spokes can't authenticate new sessions
- **Configuration complexity**: Each spoke needs OAuth client credentials
- **Redirect UX**: Users see a redirect to hive site during login
- **Creator requirement**: Creators MUST designate a hive - not optional

### Neutral

- **BetterAuth lock-in**: Committed to BetterAuth for auth layer
- **OIDC complexity**: Need to understand OIDC flows for debugging

## Alternatives Considered

### Alternative 1: Central Auth Service

Run a dedicated auth service (e.g., auth.badass.dev) that all sites use.

**Why rejected**: Adds infrastructure complexity. Creators want to own their auth, not depend on a shared service. Also creates a single point of failure for all creators.

### Alternative 2: Token Replication

Replicate session tokens across sites using a shared token store.

**Why rejected**: Complex to implement correctly. Race conditions, token invalidation across sites, security concerns with token sharing.

### Alternative 3: Magic Links Only

Use email-based magic links that work across any domain.

**Why rejected**: Poor UX for frequent logins. Doesn't solve the "already logged in on site A, want to be logged in on site B" flow.

### Alternative 4: Shared Subdomain

Force all creator sites to use subdomains (epicweb.dev, react.epicweb.dev).

**Why rejected**: Creators have existing domains with SEO value. Can't force domain structure changes.

## References

- [BetterAuth OIDC Provider Plugin](https://www.better-auth.com/docs/plugins/oidc-provider)
- [BetterAuth Generic OAuth Plugin](https://www.better-auth.com/docs/plugins/generic-oauth)
- [RFC 8628: Device Authorization Grant](https://datatracker.ietf.org/doc/html/rfc8628)
- [Course-builder Device Flow Reference](../legacy/course-builder/apps/ai-hero/src/app/oauth/device/)
- Kent's unified accounts feature request (semantic memory: `dda2aaf9-9eb`)
