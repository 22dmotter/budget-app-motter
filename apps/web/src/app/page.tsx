import Link from "next/link";
import { QuickStart } from "@/components/QuickStart";
import { HomeLead } from "@/components/HomeLead";

export default function HomePage() {
  return (
    <>
      <header className="hero hero-home">
        <div className="wrap home-grid">
          <div>
            <span className="eyebrow">Free to start · Stays on this device</span>
            <h1>
              How soon could you be <em>debt-free</em>?
            </h1>
            <HomeLead />
            <p className="lead soft">You&apos;ve got this. Let&apos;s see your path out.</p>
            <div className="cta-row">
              <Link href="/calculator" className="btn ghost">
                Open the calculator
              </Link>
              <Link href="/app" className="btn ghost">
                Open my plan
              </Link>
            </div>
          </div>
          <QuickStart />
        </div>
      </header>

      <section>
        <div className="wrap narrow">
          <p className="social-proof">
            Built by someone paying off his own $49k, one payment at a time.{" "}
            <a
              className="text-link"
              href="https://22dmotter.github.io/daniel-motter-site/"
              target="_blank"
              rel="noreferrer"
            >
              Follow the journey
            </a>
          </p>
          <ol className="steps-plain">
            <li>
              <strong>See a date.</strong> Start with three numbers, then add each debt for a plan
              that includes interest.
            </li>
            <li>
              <strong>Save it as your plan.</strong> Track balances, log payments, and watch
              milestones as you go — all in this browser.
            </li>
            <li>
              <strong>Keep going.</strong> Your data stays on this device until you choose to create
              an account later.
            </li>
          </ol>
          <blockquote>
            &quot;For which of you, desiring to build a tower, does not first sit down and count
            the cost, whether he has enough to complete it?&quot;
            <cite>Luke 14:28, ESV</cite>
          </blockquote>
        </div>
      </section>
    </>
  );
}
