import type { Metadata } from "next";
import { PricingPreview } from "@/components/PricingPreview";

export const metadata: Metadata = {
  title: "Pricing (preview)",
  description:
    "Preview of proposed Budget App plans — Free forever, Plus, and an optional Debt-Free Roadmap course. Checkout is not live.",
};

export default function PricingPage() {
  return <PricingPreview />;
}
