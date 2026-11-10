"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/app");
  }, [router]);
  return (
    <header className="hero">
      <div className="wrap">
        <p>Taking you to My Plan…</p>
      </div>
    </header>
  );
}
