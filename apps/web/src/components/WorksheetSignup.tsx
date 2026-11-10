"use client";

import { useState, type FormEvent } from "react";
import { withBasePath } from "@/lib/basePath";
import { submitLead } from "@/lib/leads";

const PDF_HREF = "/freebies/debt-snowball-worksheet.pdf";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string }
  | { kind: "ready"; mode: "local" | "remote" };

export function WorksheetSignup() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [consent, setConsent] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const honey = (form.elements.namedItem("website") as HTMLInputElement)
      ?.value;
    if (honey) {
      // Silent honeypot: pretends success without sending anything.
      setStatus({ kind: "ready", mode: "local" });
      return;
    }
    if (!consent) {
      setStatus({
        kind: "error",
        message: "Please confirm the consent box to continue.",
      });
      return;
    }
    const trimmedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setStatus({
        kind: "error",
        message: "Please enter a valid email address.",
      });
      return;
    }

    setStatus({ kind: "submitting" });
    try {
      const name = firstName.trim();
      const result = await submitLead({
        email: trimmedEmail,
        ...(name ? { firstName: name } : {}),
        source: "snowball-worksheet",
        consent: true,
        ts: new Date().toISOString(),
      });
      setStatus({ kind: "ready", mode: result.mode });
    } catch {
      setStatus({
        kind: "error",
        message:
          "We couldn’t reach the signup service. Please try again in a moment.",
      });
    }
  }

  if (status.kind === "ready") {
    return (
      <div className="card form-card" role="status">
        <h2 style={{ marginBottom: 8 }}>Here’s your worksheet</h2>
        {status.mode === "local" ? (
          <p>
            Your two-page PDF is ready. We didn’t save your email — collection
            isn’t connected on this preview yet.
          </p>
        ) : (
          <p>Thanks. Your two-page PDF is ready to download.</p>
        )}
        <a className="btn" href={withBasePath(PDF_HREF)} download>
          Download the worksheet (PDF)
        </a>
      </div>
    );
  }

  return (
    <form className="card form-card" onSubmit={onSubmit} noValidate>
      <label>
        First name <span style={{ fontWeight: 400 }}>(optional)</span>
        <input
          type="text"
          name="firstName"
          autoComplete="given-name"
          maxLength={120}
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
      </label>
      <label>
        Email
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </label>
      <div className="hp-field" aria-hidden="true">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <label className="consent-row">
        <input
          type="checkbox"
          name="consent"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        <span>
          I agree to be contacted about this worksheet and Budget App updates.
          You can ignore messages anytime. We will not share your email.
        </span>
      </label>
      {status.kind === "error" ? (
        <p className="form-error" role="alert">
          {status.message}
        </p>
      ) : null}
      <button
        type="submit"
        className="btn"
        disabled={status.kind === "submitting"}
      >
        {status.kind === "submitting" ? "One moment…" : "Get the free worksheet"}
      </button>
      <p className="download-meta">
        Two-page US Letter PDF. No account required. Not financial advice.
      </p>
    </form>
  );
}
