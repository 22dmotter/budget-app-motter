"use client";

import { useEffect } from "react";

/** Turns off the particle/blob background on focused product screens. */
export function CalmShell() {
  useEffect(() => {
    document.body.classList.add("calm-shell");
    return () => document.body.classList.remove("calm-shell");
  }, []);
  return null;
}
