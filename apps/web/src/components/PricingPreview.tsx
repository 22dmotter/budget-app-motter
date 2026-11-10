"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  calculatorHref,
  formatUsdFromCents,
  pricing,
  worksheetHref,
} from "@/config/pricing";

type Billing = "monthly" | "annual";

const PLUS_FEATURES = [
  "Everything in Free",
  "Plan that adjusts to irregular income and pay periods",
  "Cloud sync across phone and desktop",
  "What-if scenarios (lump sums, side income)",
  "Exportable PDF progress reports",
  "Streak reminders and a weekly check-in nudge",
  "Shareable milestone cards",
  "Accountability partner sharing",
  "Spouse / shared budget access",
];

const FREE_FEATURES = [
  "Snowball, avalanche, and custom payoff calculator",
  "Debt-free date and interest saved vs. minimums",
  "Basic tracker on one device",
  "Journey path and basic milestones",
  "Budget with a giving line",
  "Free spreadsheets and the snowball worksheet",
];

const ROADMAP_FEATURES = [
  "Guided Debt-Free Roadmap video course",
  "Worksheets that pair with the calculator",
  "Lessons from a real ~$49k payoff journey",
  "Yours to keep — no renewal",
];

export function PricingPreview() {
  const [billing, setBilling] = useState<Billing>("annual");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // ?theme=dark is ignored: the site is dark-only.
    if (params.get("billing") === "monthly") setBilling("monthly");
  }, []);

  const plusPrice = useMemo(() => {
    if (billing === "annual") {
      return {
        amount: formatUsdFromCents(pricing.plus.annualCents),
        period: "/year",
        sub: `That’s ${formatUsdFromCents(pricing.plus.annualMonthlyEquivalentCents)}/month, billed annually`,
      };
    }
    return {
      amount: formatUsdFromCents(pricing.plus.monthlyCents),
      period: "/month",
      sub: `Or ${formatUsdFromCents(pricing.plus.annualCents)}/year (save ${pricing.plus.annualSavingsPercent}%)`,
    };
  }, [billing]);

  return (
    <div className="pricing-preview">
      <header className="hero pricing-hero">
        <div className="wrap">
          <span className="eyebrow">{pricing.previewLabel}</span>
          <h1>
            See your debt-free date. <em>Then</em> walk the plan.
          </h1>
          <p className="lead">
            A simple Christian debt-payoff budget. No bank login required. The
            calculator and your date stay free — forever.
          </p>
          <div className="founder-chip">
            Early supporters: first {pricing.founder.seats} lock in{" "}
            <strong>
              {formatUsdFromCents(pricing.founder.annualCents)}/year for{" "}
              {pricing.founder.lockYears} years
            </strong>
          </div>
          <div className="pricing-toolbar">
            <div className="billing-toggle" role="group" aria-label="Billing period">
              <button
                type="button"
                aria-pressed={billing === "monthly"}
                onClick={() => setBilling("monthly")}
              >
                Monthly
              </button>
              <button
                type="button"
                aria-pressed={billing === "annual"}
                onClick={() => setBilling("annual")}
              >
                Annual
              </button>
            </div>
          </div>
          <p className="save-hint">
            {billing === "annual"
              ? `Save ${pricing.plus.annualSavingsPercent}% with annual billing`
              : "\u00a0"}
          </p>
        </div>
      </header>

      <section>
        <div className="wrap">
          <div className="price-cards">
            <article className="price-card">
              <h2>Free</h2>
              <p className="who">
                Get the “aha” — your debt-free date — and walk a simple journey
                with basic milestones.
              </p>
              <div className="price-amount">
                $0 <span>forever</span>
              </div>
              <p className="price-sub">No account required</p>
              <Link href={calculatorHref} className="btn ghost">
                Open the calculator
              </Link>
              <p className="cta-note">Goes to the free calculator. No signup.</p>
              <ul className="feat-list">
                {FREE_FEATURES.map((f) => (
                  <li key={f}>
                    <span className="mark">✓</span>
                    {f}
                  </li>
                ))}
                <li className="dim">
                  <span className="mark">–</span>
                  Cloud sync, streak reminders, and partner sharing
                </li>
              </ul>
            </article>

            <article className="price-card popular">
              <div className="price-badge">Most popular</div>
              <h2>Plus</h2>
              <p className="who">
                Keep going — a living plan, reminders, and a partner if you want
                one.
              </p>
              <div className="price-amount">
                {plusPrice.amount} <span>{plusPrice.period}</span>
              </div>
              <p className="price-sub">{plusPrice.sub}</p>
              <Link href={worksheetHref} className="btn">
                Get notified — checkout isn’t open
              </Link>
              <p className="cta-note">
                Checkout isn’t live yet. This takes you to the free worksheet —
                no payment, no card.
              </p>
              <ul className="feat-list">
                {PLUS_FEATURES.map((f) => (
                  <li key={f}>
                    <span className="mark">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </article>

            <article className="price-card">
              <h2>Roadmap</h2>
              <p className="who">
                A guided course you can keep — not another subscription.
              </p>
              <div className="price-amount">
                {formatUsdFromCents(pricing.roadmap.oneTimeCents)}{" "}
                <span>once</span>
              </div>
              <p className="price-sub">
                {formatUsdFromCents(pricing.roadmap.plusMemberCents)} for Plus
                members
              </p>
              <Link href={worksheetHref} className="btn ghost">
                Not open yet
              </Link>
              <p className="cta-note">
                No checkout on this preview. Grab the free worksheet instead.
              </p>
              <ul className="feat-list">
                {ROADMAP_FEATURES.map((f) => (
                  <li key={f}>
                    <span className="mark">✓</span>
                    {f}
                  </li>
                ))}
                <li className="dim">
                  <span className="mark">–</span>
                  Not 1:1 coaching (that stays optional and rare)
                </li>
              </ul>
            </article>
          </div>

          <p className="pricing-guarantee">
            <span>
              <strong>{pricing.trialDays}-day Plus trial</strong> — no bank
              connection needed
            </span>
            <span>
              <strong>{pricing.refundDays}-day money-back</strong> after your
              first payment (when checkout opens)
            </span>
            <span>
              <strong>Manual-first</strong> — your numbers stay yours
            </span>
          </p>
          <p className="pricing-faith">
            “{pricing.verse.text}”
            <cite>
              {pricing.verse.citation} — {pricing.verse.note}
            </cite>
          </p>
        </div>
      </section>

      <section className="pricing-faq">
        <div className="wrap">
          <h2>A few straight answers</h2>
          <div className="faq-list">
            <div className="faq-item">
              <h3>Can I pay today?</h3>
              <p>
                Not yet. This page is a preview of proposed prices. Buttons will
                not take a card or collect payment. The calculator and worksheet
                are free now.
              </p>
            </div>
            <div className="faq-item">
              <h3>Do I have to link my bank?</h3>
              <p>
                No. Budget App is manual-first. You enter balances and log
                payments yourself.
              </p>
            </div>
            <div className="faq-item">
              <h3>What’s free, and what is Plus for?</h3>
              <p>
                The calculator, debt-free date, basic tracker, journey path, and
                basic milestones stay free. Plus is for staying on the plan:
                streak reminders, shareable milestone cards, an accountability
                partner, cloud sync, and what-if planning.
              </p>
            </div>
            <div className="faq-item">
              <h3>What if Plus isn’t a fit later?</h3>
              <p>
                When checkout opens, you’ll get a {pricing.trialDays}-day trial
                and a {pricing.refundDays}-day money-back promise after the
                first charge. Prices here may still change.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
