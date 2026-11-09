# apps/mobile (placeholder)

A future Expo (or React Native) mobile client can live here.

**Do not scaffold Expo in this commit.** When ready:

1. Create an Expo app under `apps/mobile`.
2. Depend on `@motter/api-client` and `@motter/shared` (same contracts as the website).
3. Point `API_URL` / `EXPO_PUBLIC_API_URL` at the shared `@motter/api` service.
4. Reuse auth tokens and zod schemas from `packages/shared`.

The backend at `apps/api` is intentionally client-agnostic (versioned `/v1` routes + CORS) so web and mobile stay in sync.
