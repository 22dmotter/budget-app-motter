import { brand } from "@/config/brand";

export type DownloadItem = {
  id: string;
  title: string;
  description: string;
  includes: string[];
  /** Path under /public */
  file: string;
  /** Display size label */
  sizeLabel: string;
};

/**
 * Free spreadsheet templates served from `public/downloads/`.
 * Filenames stay generic; titles use the brand name from `brand.ts`.
 */
export const downloads: DownloadItem[] = [
  {
    id: "monthly-budget",
    title: `${brand.name} Monthly Zero-Based Budget`,
    description:
      "Give every dollar a job before the month begins — income, giving, savings, debt, needs, and wants with planned vs actual tracking.",
    includes: [
      "Income sources (planned vs actual)",
      "Categories including Giving/Tithe, Savings, Debt payments, Needs, and Wants",
      "Live totals and a remaining-to-assign check that aims for $0.00",
      "How to use sheet",
    ],
    file: "/downloads/budget-app-monthly-budget.xlsx",
    sizeLabel: "8 KB",
  },
  {
    id: "debt-snowball",
    title: `${brand.name} Debt Snowball Tracker`,
    description:
      "List your debts, set an extra payment, and follow a formula-driven snowball schedule that rolls payments to the next balance when one is gone.",
    includes: [
      "Debts list with balance, APR, and minimum payment",
      "Extra payment input and snowball order guidance",
      "Month-by-month schedule for up to 60 months with live interest formulas",
      "Estimated total interest and debt-free month summary",
    ],
    file: "/downloads/budget-app-debt-snowball.xlsx",
    sizeLabel: "17 KB",
  },
  {
    id: "expense-tracker",
    title: `${brand.name} Expense Tracker`,
    description:
      "Log daily spending with category dropdowns and see monthly totals by category using SUMIFS — no macros required.",
    includes: [
      "Transactions sheet (date, description, category, amount)",
      "Editable category list with data-validation dropdown",
      "Monthly summary by category",
      "How to use sheet",
    ],
    file: "/downloads/budget-app-expense-tracker.xlsx",
    sizeLabel: "12 KB",
  },
  {
    id: "savings-goals",
    title: `${brand.name} Savings Goals / Sinking Funds`,
    description:
      "Track sinking funds and goals with remaining balances, progress bars, target dates, and the monthly amount needed to finish on time.",
    includes: [
      "Goal, target, saved, remaining, and % progress",
      "Conditional formatting data bars on progress",
      "Target date and monthly amount needed formulas",
      "How to use sheet",
    ],
    file: "/downloads/budget-app-savings-goals.xlsx",
    sizeLabel: "9 KB",
  },
];

export const downloadsVerse = {
  text: "The plans of the diligent lead surely to abundance, but everyone who is hasty comes only to poverty.",
  citation: "Proverbs 21:5, ESV",
} as const;
