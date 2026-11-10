import Link from "next/link";
import { brand } from "@/config/brand";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div>
          <strong className="footer-brand">{brand.name}</strong>
          <br />
          Data stays on this device until you create an account. Not financial
          advice.
        </div>
        <div className="links">
          <Link href="/">Home</Link>
          <Link href="/calculator">Calculator</Link>
          <Link href="/app">My Plan</Link>
          <Link href="/downloads">Free Spreadsheets</Link>
          <Link href="/free-worksheet">Free worksheet</Link>
          <Link href="/about">About</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/login">Log in</Link>
          <Link href="/signup">Sign up</Link>
          <a
            href="https://22dmotter.github.io/daniel-motter-site/"
            target="_blank"
            rel="noreferrer"
          >
            Daniel&apos;s journey
          </a>
          <a href={brand.founder.youtubeUrl} target="_blank" rel="noreferrer">
            YouTube
          </a>
        </div>
        <div className="footer-meta">
          © {year} {brand.name}.
        </div>
      </div>
    </footer>
  );
}
