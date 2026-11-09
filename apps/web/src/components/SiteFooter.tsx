import Link from "next/link";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div>
          <strong style={{ color: "var(--text)" }}>Daniel Motter</strong>
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
          <a
            href="https://www.youtube.com/@DanielEMotter"
            target="_blank"
            rel="noreferrer"
          >
            YouTube
          </a>
        </div>
        <div style={{ gridColumn: "1 / -1", fontSize: "0.8rem" }}>
          © {year} Daniel Motter. Not financial advice; just my story.{" "}
          <span className="ph">PLACEHOLDER — infrastructure only</span>
        </div>
      </div>
    </footer>
  );
}
