"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getApiClient } from "@/lib/api";

/**
 * Client-side health probe so the static Pages build never needs a live API.
 * Shows "not connected yet" when NEXT_PUBLIC_API_URL is unset or unreachable.
 */
export function DashboardClient() {
  const [apiStatus, setApiStatus] = useState("checking…");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const client = getApiClient();
      if (!client) {
        if (!cancelled) setApiStatus("not connected yet");
        return;
      }
      try {
        const health = await client.health();
        if (!cancelled) setApiStatus(health.status);
      } catch {
        if (!cancelled) setApiStatus("not connected yet");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <header className="hero">
      <div className="wrap">
        <span className="eyebrow">Dashboard · Placeholder</span>
        <h1>
          Your <em>dashboard</em>
        </h1>
        <p className="lead">
          Authenticated budget and debt views will live here. Right now this
          page only probes the shared API health endpoint via the typed client
          when an API URL is configured.
        </p>
        <div className="cards two">
          <article className="card">
            <h3>API health</h3>
            <p>
              GET /v1/health → <strong>{apiStatus}</strong>
            </p>
          </article>
          <article className="card">
            <h3>Budgets & debts</h3>
            <p>
              Stub routes return 501. Wire Postgres + auth before showing real
              data. <span className="ph">NO DATA YET</span>
            </p>
          </article>
        </div>
        <div className="cta-row" style={{ marginTop: 28 }}>
          <Link href="/login" className="btn ghost">
            Log in (placeholder)
          </Link>
        </div>
      </div>
    </header>
  );
}
