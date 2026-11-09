import type { Metadata } from "next";
import { brand } from "@/config/brand";
import { downloads, downloadsVerse } from "@/config/downloads";
import { withBasePath } from "@/lib/basePath";

export const metadata: Metadata = {
  title: "Downloads",
  description: `Free budgeting spreadsheets from ${brand.name} — zero-based budget, debt snowball, expense tracker, and savings goals.`,
};

export default function DownloadsPage() {
  return (
    <>
      <header className="hero">
        <div className="wrap">
          <span className="eyebrow">Free tools</span>
          <h1>
            Budgeting <em>spreadsheets</em> you can download today.
          </h1>
          <p className="lead">
            Practical templates for Excel, Google Sheets (File → Import), and
            Apple Numbers. Example rows are clearly labeled so you can delete
            them and fill in your own numbers. No accounts required.
          </p>
          <blockquote>
            &quot;{downloadsVerse.text}&quot;
            <cite>{downloadsVerse.citation}</cite>
          </blockquote>
        </div>
      </header>

      <section>
        <div className="wrap">
          <div className="cards two">
            {downloads.map((item) => (
              <article key={item.id} className="card download-card">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <p className="download-meta">
                  <strong>What&apos;s inside:</strong> {item.includes.join(" · ")}
                </p>
                <p className="download-meta">
                  File size: {item.sizeLabel} · .xlsx
                </p>
                <div className="cta-row" style={{ marginTop: 16 }}>
                  <a
                    className="btn"
                    href={withBasePath(item.file)}
                    download
                  >
                    Download
                  </a>
                </div>
              </article>
            ))}
          </div>
          <p className="notice" style={{ marginTop: 28, maxWidth: 720 }}>
            Opens in Microsoft Excel, Google Sheets (File → Import), and Apple
            Numbers. Formulas are live — totals are not hardcoded.{" "}
            <span className="ph">FREE TEMPLATES</span> Not financial advice.
          </p>
        </div>
      </section>
    </>
  );
}
