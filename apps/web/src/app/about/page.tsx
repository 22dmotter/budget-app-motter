import type { Metadata } from "next";
import Link from "next/link";
import { brand } from "@/config/brand";

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
          {brand.name} is a planned budgeting product focused on Christian
          debt-free living. It was started by {brand.founder.name}, who is
          documenting his own journey to pay off debt on YouTube (
          <a
            href={brand.founder.youtubeUrl}
            target="_blank"
            rel="noreferrer"
            className="text-link"
          >
            {brand.founder.youtubeHandle}
          </a>
          ). That founder story is personal context — not the product brand.
          This repository scaffolds a future app that can serve both a website
          and a mobile client through one shared API.
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
