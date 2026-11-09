import { createApiClient } from "@motter/api-client";

/** Browser / server typed client pointing at the shared Motter API */
export function getApiClient() {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
    "http://localhost:4000";
  return createApiClient({ baseUrl });
}
