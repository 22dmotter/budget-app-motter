import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <header className="hero">
        <div className="wrap">
          <span className="eyebrow">Placeholder · Not launched</span>
          <h1>
            Stewardship that honors <em>God</em> and frees you from debt.
          </h1>
          <p className="lead">
            This site is scaffolding for a planned budgeting app built around
            Christian debt-free living — clearer money habits, honest progress
            tracking, and a path toward owing no one except the continuing debt
            of love.{" "}
            <span className="ph">PLACEHOLDER COPY — not a live product</span>
          </p>
          <div className="cta-row">
            <Link href="/signup" className="btn">
              Join the waitlist (placeholder)
            </Link>
            <Link href="/about" className="btn ghost">
              About this project
            </Link>
          </div>
        </div>
      </header>

      <section>
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">Why this matters</span>
            <h2>Faithful with little. Free from debt.</h2>
            <p>
              Scripture frames money as stewardship, not ownership. The goal of
              this app idea is to help people see their finances clearly and
              take manageable steps toward debt freedom — without hype or false
              promises.
            </p>
          </div>
          <blockquote>
            &quot;Let no debt remain outstanding, except the continuing debt to
            love one another.&quot;
            <cite>Romans 13:8 (NIV)</cite>
          </blockquote>
          <blockquote>
            &quot;The rich rule over the poor, and the borrower is slave to the
            lender.&quot;
            <cite>Proverbs 22:7 (NIV)</cite>
          </blockquote>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">Planned ideas</span>
            <h2>What this could help with.</h2>
            <p>
              Ideas under consideration — not a confirmed feature list. Scope
              may change. No pricing, launch date, or testimonials are shown
              because none exist yet.
            </p>
          </div>
          <div className="cards two">
            <article className="card">
              <h3>Organize your money</h3>
              <p>
                Bring income, spending, and priorities into one clearer picture
                so decisions feel less overwhelming.
              </p>
            </article>
            <article className="card">
              <h3>Track debt progress</h3>
              <p>
                Follow balances and payments as you work toward paying debts
                down — celebrating progress without fake stats.
              </p>
            </article>
            <article className="card">
              <h3>Budget with purpose</h3>
              <p>
                Plan categories that reflect stewardship: giving, needs, debt
                payoff, and savings toward stability.
              </p>
            </article>
            <article className="card">
              <h3>Shared API foundation</h3>
              <p>
                This website talks to a versioned backend API designed so a
                future mobile app can reuse the same contracts.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">Status</span>
            <h2>Infrastructure only.</h2>
          </div>
          <div className="card" style={{ maxWidth: 720 }}>
            <p>
              Accounts, database, payments, and real auth are{" "}
              <strong>not</strong> wired yet. Pages labeled placeholder show UI
              shells only. See the repository README for how to run locally and
              what comes next.
            </p>
            <div className="cta-row" style={{ marginTop: 20 }}>
              <Link href="/pricing" className="btn ghost">
                Pricing (placeholder)
              </Link>
              <Link href="/dashboard" className="btn ghost">
                Dashboard (placeholder)
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
