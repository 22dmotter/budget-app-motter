import type { Metadata } from "next";
import { CalculatorApp } from "@/components/calculator/CalculatorApp";

export const metadata: Metadata = {
  title: "Calculator",
  description: "See your debt-free date. Add your debts, pick a plan, and save it.",
};

export default function CalculatorPage() {
  return <CalculatorApp />;
}
