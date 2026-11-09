import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing",
};

export default function PricingPage() {
  return (
    <header className="hero">
      <div className="wrap">
        <span className="eyebrow">Pricing · Placeholder</span>
        <h1>
          Pricing has <em>not</em> been set.
        </h1>
        <p className="lead">
          A subscription model is planned for a future app, but there are no
          prices, plans, or launch dates to announce. This page exists only so
          routing and layout are in place.
        </p>
        <div className="cards three">
          <article className="card">
            <h3>
              <span className="ph">Plan A</span>
            </h3>
            <p>Placeholder — no price. Feature list TBD.</p>
          </article>
          <article className="card">
            <h3>
              <span className="ph">Plan B</span>
            </h3>
            <p>Placeholder — no price. Feature list TBD.</p>
          </article>
          <article className="card">
            <h3>
              <span className="ph">Plan C</span>
            </h3>
            <p>Placeholder — no price. Feature list TBD.</p>
          </article>
        </div>
        <div className="cta-row" style={{ marginTop: 28 }}>
          <Link href="/signup" className="btn">
            Waitlist UI (placeholder)
          </Link>
        </div>
      </div>
    </header>
  );
}
