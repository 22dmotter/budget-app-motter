import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/pricing", label: "Pricing" },
  { href: "/dashboard", label: "Dashboard" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="wrap">
        <Link href="/" className="logo">
          Daniel Motter<span>.</span>
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
