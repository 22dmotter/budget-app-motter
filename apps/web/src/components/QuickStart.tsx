"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addMonths,
  currentYearMonth,
  estimateDebtFreeMonths,
  formatCents,
  formatYearMonth,
  parseMoneyInput,
} from "@motter/core";
import { saveQuickStart } from "@/lib/calculator-draft";

export function QuickStart() {
  const router = useRouter();
  const [total, setTotal] = useState("");
  const [mins, setMins] = useState("");
  const [extra, setExtra] = useState("");

  const result = useMemo(() => {
    const t = parseMoneyInput(total);
    const m = parseMoneyInput(mins);
    const e = parseMoneyInput(extra);
    if (t === null && !total.trim()) return null;
    if (t === null || t <= 0) return { error: "Enter your total debt to see a date." };
    const pay = (m ?? 0) + (e ?? 0);
    const est = estimateDebtFreeMonths(t, pay);
    if (!est.ok) {
      return { error: "Add a monthly amount — even a small one — to see a date." };
    }
    const when = formatYearMonth(addMonths(currentYearMonth(), Math.max(0, est.months - 1)));
    return { months: est.months, when, payment: pay };
  }, [total, mins, extra]);

  function goExact() {
    saveQuickStart({ total, mins, extra });
    router.push("/calculator");
  }

  return (
    <div className="card quick-start" data-testid="quick-start">
      <h2 className="quick-title">See your debt-free date</h2>
      <p className="muted">Three numbers. No account needed.</p>
      <form
        className="quick-form"
        onSubmit={(e) => {
          e.preventDefault();
          goExact();
        }}
      >
        <label>
          Total debt
          <input
            inputMode="decimal"
            autoComplete="off"
            placeholder="12,000"
            value={total}
            onChange={(e) => setTotal(e.target.value)}
            data-testid="qs-total"
          />
        </label>
        <label>
          Monthly minimums
          <input
            inputMode="decimal"
            autoComplete="off"
            placeholder="350"
            value={mins}
            onChange={(e) => setMins(e.target.value)}
            data-testid="qs-mins"
          />
        </label>
        <label>
          Extra you can put toward it
          <input
            inputMode="decimal"
            autoComplete="off"
            placeholder="100"
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            data-testid="qs-extra"
          />
        </label>
        <div className="quick-result" data-testid="qs-result">
          {result && "when" in result && typeof result.payment === "number" ? (
            <>
              <p className="eyebrow">As early as</p>
              <p className="stat-num" data-testid="qs-date">
                {result.when}
              </p>
              <p className="muted">
                That&apos;s about {result.months} month{result.months === 1 ? "" : "s"} if{" "}
                {formatCents(result.payment)} goes to principal each month. Interest isn&apos;t
                included yet — add your debts for an exact plan.
              </p>
            </>
          ) : (
            <p className="muted">{result?.error ?? "Enter your numbers to see a date."}</p>
          )}
        </div>
        <button type="submit" className="btn" data-testid="qs-submit">
          Get my exact plan
        </button>
      </form>
    </div>
  );
}
