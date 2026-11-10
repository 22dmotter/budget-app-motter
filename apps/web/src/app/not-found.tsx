import Link from "next/link";

export default function NotFound() {
  return (
    <header className="hero">
      <div className="wrap">
        <span className="eyebrow">404</span>
        <h1>
          Page <em>not found</em>
        </h1>
        <p className="lead">
          That page isn&apos;t on this site. Try the calculator or My Plan.
        </p>
        <Link href="/" className="btn">
          Go home
        </Link>
      </div>
    </header>
  );
}
