import type { Metadata } from "next";
import Link from "next/link";
import { getApiClient } from "@/lib/api";

export const metadata: Metadata = {
  title: "Dashboard",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let apiStatus = "unreachable";
  try {
    const health = await getApiClient().health();
    apiStatus = health.status;
  } catch {
    apiStatus = "unreachable (start the API with npm run dev)";
  }

  return (
    <header className="hero">
      <div className="wrap">
        <span className="eyebrow">Dashboard · Placeholder</span>
        <h1>
          Your <em>dashboard</em>
        </h1>
        <p className="lead">
          Authenticated budget and debt views will live here. Right now this
          page only probes the shared API health endpoint via the typed client.
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
