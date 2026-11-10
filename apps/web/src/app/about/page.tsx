import type { Metadata } from "next";
import Link from "next/link";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <header className="hero">
      <div className="wrap narrow">
        <span className="eyebrow">About</span>
        <h1>
          Built to help you get <em>out of debt</em>.
        </h1>
        <p className="lead">
          {brand.name} is a debt payoff calculator and tracker that runs right in your browser.
          See a debt-free date, make a plan, and log payments as you go. Your numbers stay on
          this device until accounts launch.
        </p>
        <p className="lead">
          It was started by {brand.founder.name}, who is documenting his own journey to pay off
          about $49k of debt on{" "}
          <a href="https://22dmotter.github.io/daniel-motter-site/" className="text-link">
            his public tracker
          </a>{" "}
          and on YouTube (
          <a
            href={brand.founder.youtubeUrl}
            target="_blank"
            rel="noreferrer"
            className="text-link"
          >
            {brand.founder.youtubeHandle}
          </a>
          ). That story is personal context — not the product brand.
        </p>
        <div className="cards two" style={{ marginTop: 32 }}>
          <article className="card">
            <h3>What this is</h3>
            <p>
              A working calculator and tracker: payoff math, a zero-based budget, milestones, and
              backups you can export. Not financial advice.
            </p>
          </article>
          <article className="card">
            <h3>What this is not</h3>
            <p>
              Not a bank connection, not a credit card, and not a lecture. Accounts, cloud sync,
              and paid extras will come later — nothing is locked today.
            </p>
          </article>
        </div>
        <div className="cta-row" style={{ marginTop: 28 }}>
          <Link href="/calculator" className="btn">
            See my debt-free date
          </Link>
          <Link href="/" className="btn ghost">
            Back home
          </Link>
        </div>
      </div>
    </header>
  );
}
