"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

/** Marketing chrome around public pages; /app uses its own shell. */
export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isApp = pathname === "/app" || pathname.startsWith("/app/");
  if (isApp) {
    return <div className="app-root">{children}</div>;
  }
  return (
    <>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}
