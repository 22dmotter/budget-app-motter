import type { AppState } from "@motter/shared";

/**
 * Storage port — localStorage today, the shared API later.
 * Implementations must not invent or silently drop history entries.
 */
export type StorageLoadResult =
  | { ok: true; state: AppState; raw: string | null }
  | {
      ok: false;
      kind: "unavailable" | "invalid";
      message: string;
      state: AppState;
      raw: string | null;
    };

export type StorageSaveResult =
  | { ok: true; raw: string }
  | { ok: false; kind: "unavailable" | "invalid" | "conflict"; message: string };

export type PlanStorage = {
  load(today: string): StorageLoadResult;
  save(state: AppState, expectedRaw: string | null | undefined, today: string): StorageSaveResult;
};
