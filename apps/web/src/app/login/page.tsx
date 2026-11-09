import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Log in",
};

export default function LoginPage() {
  return (
    <header className="hero">
      <div className="wrap">
        <span className="eyebrow">Auth · Placeholder</span>
        <h1>
          Log <em>in</em>
        </h1>
        <p className="lead">
          UI shell only. No authentication backend is connected yet.
        </p>
        <div className="card form-card">
          <label>
            Email
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              disabled
            />
          </label>
          <label>
            Password
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              disabled
            />
          </label>
          <button type="button" className="btn" disabled>
            Log in (disabled)
          </button>
          <p className="notice">
            <span className="ph">PLACEHOLDER</span> — POST /v1/auth/login returns
            501 until auth is implemented.{" "}
            <Link href="/signup" style={{ color: "var(--accent)" }}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </header>
  );
}
