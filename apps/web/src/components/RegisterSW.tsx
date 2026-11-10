"use client";

import { useEffect } from "react";
import { getBasePath } from "@/lib/basePath";

export function RegisterSW() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    const base = getBasePath();
    const sw = `${base}/sw.js`;
    navigator.serviceWorker.register(sw, { scope: `${base}/` || "/" }).catch(() => {
      /* offline registration can fail on first local file open — ignore */
    });
  }, []);
  return null;
}
