import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <header className="hero">
      <div className="wrap">
        <span className="eyebrow">About</span>
        <h1>
          Built around <em>stewardship</em>, not hype.
        </h1>
        <p className="lead">
          Daniel Motter shares a Christian debt-free journey on YouTube (
          <a
            href="https://www.youtube.com/@DanielEMotter"
            target="_blank"
            rel="noreferrer"
            style={{ color: "var(--accent)" }}
          >
            @DanielEMotter
          </a>
          ). This repository scaffolds a future budgeting product that can serve
          both a website and a mobile client through one shared API.
        </p>
        <div className="cards two" style={{ marginTop: 32 }}>
          <article className="card">
            <h3>What this is</h3>
            <p>
              Starter infrastructure: Next.js website, Fastify API, shared
              TypeScript types, and a typed API client.{" "}
              <span className="ph">PLACEHOLDER SITE</span>
            </p>
          </article>
          <article className="card">
            <h3>What this is not</h3>
            <p>
              Not financial advice. Not a live product. No real accounts,
              billing, or bank connections exist in this scaffold.
            </p>
          </article>
        </div>
        <div className="cta-row" style={{ marginTop: 28 }}>
          <Link href="/" className="btn ghost">
            Back home
          </Link>
        </div>
      </div>
    </header>
  );
}
