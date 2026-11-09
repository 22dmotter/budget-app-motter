import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign up",
};

export default function SignupPage() {
  return (
    <header className="hero">
      <div className="wrap">
        <span className="eyebrow">Auth · Placeholder</span>
        <h1>
          Create an <em>account</em>
        </h1>
        <p className="lead">
          UI shell only. Signups are not collected yet — this form does nothing.
        </p>
        <div className="card form-card">
          <label>
            Name
            <input type="text" name="name" placeholder="Your name" disabled />
          </label>
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
            Sign up (disabled)
          </button>
          <p className="notice">
            <span className="ph">PLACEHOLDER</span> — POST /v1/auth/signup and
            POST /v1/leads return 501 until implemented.{" "}
            <Link href="/login" className="text-link">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </header>
  );
}
