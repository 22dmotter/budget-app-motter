import Link from "next/link";
import { brand } from "@/config/brand";

const links: { href: string; label: string }[] = [
  { href: "/", label: "Home" },
  { href: "/calculator", label: "Calculator" },
  { href: "/app", label: "My Plan" },
  { href: "/pricing", label: "Pricing" },
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
                <Link href={l.href}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="header-actions">
          <details className="nav-menu">
            <summary>Menu</summary>
            <ul>
              {links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </details>
          <Link href="/free-worksheet" className="btn sm">
            Free worksheet
          </Link>
        </div>
      </div>
    </header>
  );
}
