import {
  emptyAppState,
  LOCAL_PLAN_KEY,
  parseAppState,
  serializeAppState,
  type PlanStorage,
  type StorageLoadResult,
  type StorageSaveResult,
} from "@motter/core";
import type { AppState } from "@motter/shared";

export function createLocalPlanStorage(key = LOCAL_PLAN_KEY): PlanStorage {
  return {
    load(today: string): StorageLoadResult {
      let raw: string | null;
      try {
        raw = window.localStorage.getItem(key);
      } catch {
        return {
          ok: false,
          kind: "unavailable",
          message:
            "Browser storage is unavailable. Changes will only stay in this tab. Download a backup before leaving.",
          state: emptyAppState(),
          raw: null,
        };
      }
      if (raw === null) return { ok: true, state: emptyAppState(), raw: null };
      try {
        return { ok: true, state: parseAppState(raw, today), raw };
      } catch (e) {
        return {
          ok: false,
          kind: "invalid",
          message:
            e instanceof Error
              ? e.message
              : "Saved data could not be read. It has not been overwritten.",
          state: emptyAppState(),
          raw,
        };
      }
    },
    save(state: AppState, expectedRaw, today: string): StorageSaveResult {
      let raw: string;
      try {
        raw = serializeAppState(state, today);
      } catch (e) {
        return {
          ok: false,
          kind: "invalid",
          message: e instanceof Error ? e.message : "Could not save this plan.",
        };
      }
      try {
        if (expectedRaw !== undefined && window.localStorage.getItem(key) !== expectedRaw) {
          return {
            ok: false,
            kind: "conflict",
            message:
              "Another tab changed this plan. Reload the page to use the latest data. No changes were applied.",
          };
        }
        window.localStorage.setItem(key, raw);
        if (window.localStorage.getItem(key) !== raw) {
          throw new Error("Write was not retained");
        }
        return { ok: true, raw };
      } catch {
        return {
          ok: false,
          kind: "unavailable",
          message:
            "Changes are not saved in this browser. Keep this tab open and download a backup.",
        };
      }
    },
  };
}
