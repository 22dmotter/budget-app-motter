import type { Metadata } from "next";
import { PlanApp } from "@/components/plan/PlanApp";

export const metadata: Metadata = {
  title: "My Plan",
  description: "Track your debts, log payments, and walk your road to debt-free.",
};

export default function AppPage() {
  return <PlanApp />;
}
