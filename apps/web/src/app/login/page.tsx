import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Log in",
};

export default function LoginPage() {
  return (
    <header className="hero">
      <div className="wrap">
        <span className="eyebrow">Accounts come later</span>
        <h1>
          Log <em>in</em>
        </h1>
        <p className="lead">
          Accounts are not open yet. Your plan already works in this browser, and stays on this
          device. We&apos;ll add sign-in when a hosted backup is ready — nothing to create today.
        </p>
        <div className="card form-card">
          <label>
            Email
            <input type="email" name="email" placeholder="you@example.com" disabled />
          </label>
          <label>
            Password
            <input type="password" name="password" placeholder="••••••••" disabled />
          </label>
          <button type="button" className="btn" disabled>
            Log in (not available yet)
          </button>
          <p className="notice">
            The form is disabled on purpose. Your numbers are already saved on this device.{" "}
            <Link href="/app" className="text-link">
              Open my plan
            </Link>
          </p>
        </div>
      </div>
    </header>
  );
}
