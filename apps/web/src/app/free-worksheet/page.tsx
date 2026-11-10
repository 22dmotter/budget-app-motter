import type { Metadata } from "next";
import Link from "next/link";
import { brand } from "@/config/brand";
import { withBasePath } from "@/lib/basePath";
import { WorksheetSignup } from "@/components/WorksheetSignup";

export const metadata: Metadata = {
  title: "Free Debt Snowball Worksheet",
  description:
    "A one-page printable plan to list your debts, order them smallest-first, and circle the date you’ll be free, plus a first 30 days checklist.",
};

export default function FreeWorksheetPage() {
  const preview = withBasePath("/freebies/worksheet-preview.png");
  return (
    <>
      <header className="hero">
        <div className="wrap">
          <span className="eyebrow">Free download</span>
          <h1>
            Get Your Free Debt <em>Snowball</em> Worksheet
          </h1>
          <p className="lead">
            A one-page printable plan to list your debts, order them
            smallest-first, and circle the date you’ll be free, plus a first 30
            days checklist.
          </p>
        </div>
      </header>

      <section>
        <div className="wrap">
          <div className="cards two" style={{ alignItems: "start" }}>
            <div>
              <img
                className="worksheet-preview"
                src={preview}
                alt={`Preview of the ${brand.name} debt snowball worksheet, showing a table for listing debts and a grid to circle a target date.`}
                width={816}
                height={1056}
              />
              <p className="download-meta" style={{ marginTop: 12 }}>
                Built by{" "}
                <a
                  className="text-link"
                  href="https://22dmotter.github.io/daniel-motter-site/"
                >
                  Daniel Motter
                </a>
                , who is paying off about $49k of his own debt, one payment at a
                time. Also see the{" "}
                <Link href="/downloads" className="text-link">
                  free spreadsheets
                </Link>
                .
              </p>
            </div>
            <WorksheetSignup />
          </div>
        </div>
      </section>
    </>
  );
}
