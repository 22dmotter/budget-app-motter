"use client";

import { useEffect, useState } from "react";

const KEY = "budget-app-install-hint-dismissed";

export function InstallHint() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      if (localStorage.getItem(KEY)) return;
    } catch {
      return;
    }
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && Boolean((navigator as { standalone?: boolean }).standalone));
    const mobile = window.matchMedia("(max-width: 859px)").matches;
    if (!standalone && mobile) setShow(true);
  }, []);
  if (!show) return null;
  return (
    <div className="install-hint" role="status">
      <p>
        Add {typeof document !== "undefined" ? "Budget App" : "this"} to your home screen for a
        one-tap plan — in your browser menu, choose <strong>Add to Home Screen</strong>.
      </p>
      <button
        type="button"
        className="linkish"
        onClick={() => {
          try {
            localStorage.setItem(KEY, "1");
          } catch {
            /* ignore */
          }
          setShow(false);
        }}
      >
        Dismiss
      </button>
    </div>
  );
}
