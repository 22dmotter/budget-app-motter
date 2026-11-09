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
          &quot;Let no debt remain outstanding, except the continuing debt to
          love one another.&quot; Romans 13:8
        </div>
        <div className="links">
          <Link href="/">Home</Link>
          <Link href="/about">About</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/login">Log in</Link>
          <Link href="/signup">Sign up</Link>
        </div>
        <div className="footer-meta">
          © {year} {brand.name}. Not financial advice.{" "}
          <span className="ph">PLACEHOLDER — infrastructure only</span>
        </div>
      </div>
    </footer>
  );
}
