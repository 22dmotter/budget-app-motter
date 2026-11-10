import Link from "next/link";
import { brand } from "@/config/brand";

const links: { href: string; label: string; highlight?: boolean }[] = [
  { href: "/", label: "Home" },
  { href: "/calculator", label: "Calculator" },
  { href: "/app", label: "My Plan" },
  { href: "/downloads", label: "Free Spreadsheets" },
  { href: "/free-worksheet", label: "Free worksheet", highlight: true },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="accent-bar" aria-hidden="true" />
      <div className="wrap">
        <Link href="/" className="logo">
          {brand.name}
          {brand.logoMark ? <span>{brand.logoMark}</span> : null}
        </Link>
        <nav aria-label="Main navigation">
          <ul className="nav-links">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={l.highlight ? "nav-freebie" : undefined}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="header-actions">
          <Link href="/free-worksheet" className="btn sm ghost-on-dark header-freebie">
            Free worksheet
          </Link>
          <Link href="/app" className="btn sm">
            Open my plan
          </Link>
        </div>
      </div>
    </header>
  );
}
