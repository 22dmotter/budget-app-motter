import { createApiClient } from "@motter/api-client";

/**
 * Browser / server typed client pointing at the shared Motter API.
 * Returns null when NEXT_PUBLIC_API_URL is unset so static Pages builds
 * and offline previews degrade gracefully instead of calling localhost.
 */
export function getApiClient() {
  const raw = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (!raw) return null;
  return createApiClient({ baseUrl: raw });
}
