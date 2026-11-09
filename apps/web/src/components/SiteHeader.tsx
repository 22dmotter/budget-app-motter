import Link from "next/link";
import { brand } from "@/config/brand";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/downloads", label: "Downloads" },
  { href: "/pricing", label: "Pricing" },
  { href: "/dashboard", label: "Dashboard" },
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
            <li>
              <Link href="/login">Log in</Link>
            </li>
          </ul>
        </nav>
        <Link href="/signup" className="btn sm">
          Sign up
        </Link>
      </div>
    </header>
  );
}
