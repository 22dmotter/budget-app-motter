import { LOCAL_CALCULATOR_KEY } from "@motter/core";

export type CalculatorDraftDebt = {
  id: string;
  name: string;
  balance: string;
  apr: string;
  minimum: string;
};

export type CalculatorDraft = {
  debts: CalculatorDraftDebt[];
  extra: string;
  strategy: "snowball" | "avalanche";
  hintTotal?: string;
  hintMins?: string;
};

export type QuickStartDraft = {
  total: string;
  mins: string;
  extra: string;
};

const QUICK_KEY = "budget-app-quickstart-v1";

export function loadCalculatorDraft(): CalculatorDraft | null {
  try {
    const raw = localStorage.getItem(LOCAL_CALCULATOR_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CalculatorDraft;
  } catch {
    return null;
  }
}

export function saveCalculatorDraft(draft: CalculatorDraft): void {
  try {
    localStorage.setItem(LOCAL_CALCULATOR_KEY, JSON.stringify(draft));
  } catch {
    /* ignore quota */
  }
}

export function loadQuickStart(): QuickStartDraft | null {
  try {
    const raw = sessionStorage.getItem(QUICK_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as QuickStartDraft;
  } catch {
    return null;
  }
}

export function saveQuickStart(draft: QuickStartDraft): void {
  try {
    sessionStorage.setItem(QUICK_KEY, JSON.stringify(draft));
  } catch {
    /* ignore */
  }
}
