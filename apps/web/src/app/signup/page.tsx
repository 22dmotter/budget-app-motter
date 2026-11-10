import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign up",
};

export default function SignupPage() {
  return (
    <header className="hero">
      <div className="wrap">
        <span className="eyebrow">Accounts come later</span>
        <h1>
          Create an <em>account</em>
        </h1>
        <p className="lead">
          Signups are not collected yet. You can use the calculator and My Plan right now without
          an account — your data stays on this device.
        </p>
        <div className="card form-card">
          <label>
            Name
            <input type="text" name="name" placeholder="Your name" disabled />
          </label>
          <label>
            Email
            <input type="email" name="email" placeholder="you@example.com" disabled />
          </label>
          <label>
            Password
            <input type="password" name="password" placeholder="••••••••" disabled />
          </label>
          <button type="button" className="btn" disabled>
            Sign up (not available yet)
          </button>
          <p className="notice">
            This form does nothing until accounts launch. In the meantime,{" "}
            <Link href="/calculator" className="text-link">
              make a plan in the calculator
            </Link>{" "}
            or{" "}
            <Link href="/app" className="text-link">
              open My Plan
            </Link>
            .
          </p>
        </div>
      </div>
    </header>
  );
}
