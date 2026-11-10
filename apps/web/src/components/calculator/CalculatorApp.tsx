"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  currentYearMonth,
  emptyAppState,
  formatCents,
  formatYearMonth,
  parseMoneyInput,
  parsePercentInput,
  planDebts,
  todayIso,
} from "@motter/core";
import type { PayoffStrategy } from "@motter/shared";
import { CalmShell } from "@/components/CalmShell";
import { BalanceChart } from "@/components/BalanceChart";
import { newId } from "@/lib/ids";
import {
  loadCalculatorDraft,
  loadQuickStart,
  saveCalculatorDraft,
  type CalculatorDraftDebt,
} from "@/lib/calculator-draft";
import { createLocalPlanStorage } from "@/lib/storage-local";

function emptyRow(): CalculatorDraftDebt {
  return { id: newId(), name: "", balance: "", apr: "", minimum: "" };
}

export function CalculatorApp() {
  const router = useRouter();
  const [debts, setDebts] = useState<CalculatorDraftDebt[]>([emptyRow(), emptyRow()]);
  const [extra, setExtra] = useState("");
  const [strategy, setStrategy] = useState<"snowball" | "avalanche">("snowball");
  const [hint, setHint] = useState<string | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  useEffect(() => {
    const draft = loadCalculatorDraft();
    const qs = loadQuickStart();
    if (draft?.debts?.length) {
      setDebts(draft.debts);
      setExtra(draft.extra ?? "");
      setStrategy(draft.strategy ?? "snowball");
      if (draft.hintTotal) setHint(`You entered ${draft.hintTotal} total — add each debt below for an exact plan.`);
    } else if (qs) {
      setExtra(qs.extra ?? "");
      if (qs.total) setHint(`You entered ${qs.total} total — add each debt below for an exact plan.`);
    }
  }, []);

  useEffect(() => {
    saveCalculatorDraft({ debts, extra, strategy });
  }, [debts, extra, strategy]);

  const parsed = useMemo(() => {
    const errors: string[] = [];
    const rows = debts
      .map((d, i) => {
        const name = d.name.trim() || `Debt ${i + 1}`;
        const balanceCents = parseMoneyInput(d.balance);
        const aprBps = d.apr.trim() ? parsePercentInput(d.apr) : 0;
        const minimumPaymentCents = d.minimum.trim() ? parseMoneyInput(d.minimum) : 0;
        const hasAny = d.name.trim() || d.balance.trim() || d.apr.trim() || d.minimum.trim();
        if (!hasAny) return null;
        if (balanceCents === null || balanceCents < 0) {
          errors.push(`Row ${i + 1}: enter a balance.`);
          return null;
        }
        if (aprBps === null) {
          errors.push(`Row ${i + 1}: enter the APR as a percent (for example 19.99).`);
          return null;
        }
        if (minimumPaymentCents === null) {
          errors.push(`Row ${i + 1}: enter the monthly minimum.`);
          return null;
        }
        return {
          id: d.id,
          name,
          balanceCents,
          aprBps,
          minimumPaymentCents,
        };
      })
      .filter((d): d is NonNullable<typeof d> => d !== null);
    const extraMonthlyCents = extra.trim() ? parseMoneyInput(extra) : 0;
    if (extra.trim() && extraMonthlyCents === null) errors.push("Enter the extra amount as dollars.");
    return { rows, extraMonthlyCents: extraMonthlyCents ?? 0, errors };
  }, [debts, extra]);

  const result = useMemo(() => {
    if (!parsed.rows.length || parsed.errors.length) return null;
    return planDebts({
      debts: parsed.rows,
      extraMonthlyCents: parsed.extraMonthlyCents,
      strategy,
      startMonth: currentYearMonth(),
      compare: true,
    });
  }, [parsed, strategy]);

  function update(id: string, field: keyof CalculatorDraftDebt, value: string) {
    setDebts((rows) => rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  function saveAsPlan() {
    if (!parsed.rows.length) {
      setSaveMsg("Add at least one debt first.");
      return;
    }
    const today = todayIso();
    const storage = createLocalPlanStorage();
    const loaded = storage.load(today);
    const base = loaded.state;
    const next = {
      ...base,
      debts: parsed.rows.map((d) => ({
        id: d.id,
        name: d.name,
        startDate: today,
        startingCents: Math.max(1, d.balanceCents),
        openingDate: today,
        openingCents: d.balanceCents,
        aprBps: d.aprBps,
        minimumPaymentCents: d.minimumPaymentCents,
        entries: [],
      })),
      plan: {
        ...base.plan,
        strategy: strategy as PayoffStrategy,
        extraMonthlyCents: parsed.extraMonthlyCents,
        startMonth: currentYearMonth(),
      },
      onboardingComplete: false,
      onboardingStep: 1,
    };
    const saved = storage.save(next, loaded.raw, today);
    if (!saved.ok) {
      setSaveMsg(saved.message);
      return;
    }
    router.push("/app");
  }

  const alt = result?.vsAvalanche ?? result?.vsSnowball;

  return (
    <>
      <CalmShell />
      <header className="hero compact">
        <div className="wrap">
          <span className="eyebrow">Calculator</span>
          <h1>
            Your exact <em>debt-free</em> date.
          </h1>
          <p className="lead">
            Add each debt. We&apos;ll include interest, roll freed payments into the next one, and
            show what you save versus paying minimums only. Nothing leaves this device.
          </p>
          {hint ? <p className="notice">{hint}</p> : null}
        </div>
      </header>

      <section className="flush">
        <div className="wrap">
          <div className="card solid">
            <div className="table-scroll">
              <table className="plain-table">
                <thead>
                  <tr>
                    <th scope="col">Debt name</th>
                    <th scope="col">Balance</th>
                    <th scope="col">APR %</th>
                    <th scope="col">Min. payment</th>
                    <th className="sr-only">Remove</th>
                  </tr>
                </thead>
                <tbody>
                  {debts.map((d, i) => (
                    <tr key={d.id}>
                      <td>
                        <label className="sr-only" htmlFor={`name-${d.id}`}>
                          Debt name
                        </label>
                        <input
                          id={`name-${d.id}`}
                          value={d.name}
                          onChange={(e) => update(d.id, "name", e.target.value)}
                          placeholder="Card, car, student…"
                          data-testid={`debt-name-${i}`}
                        />
                      </td>
                      <td>
                        <label className="sr-only" htmlFor={`bal-${d.id}`}>
                          Balance
                        </label>
                        <input
                          id={`bal-${d.id}`}
                          inputMode="decimal"
                          value={d.balance}
                          onChange={(e) => update(d.id, "balance", e.target.value)}
                          placeholder="3,200"
                          data-testid={`debt-balance-${i}`}
                        />
                      </td>
                      <td>
                        <label className="sr-only" htmlFor={`apr-${d.id}`}>
                          APR
                        </label>
                        <input
                          id={`apr-${d.id}`}
                          inputMode="decimal"
                          value={d.apr}
                          onChange={(e) => update(d.id, "apr", e.target.value)}
                          placeholder="24.99"
                          data-testid={`debt-apr-${i}`}
                        />
                      </td>
                      <td>
                        <label className="sr-only" htmlFor={`min-${d.id}`}>
                          Minimum payment
                        </label>
                        <input
                          id={`min-${d.id}`}
                          inputMode="decimal"
                          value={d.minimum}
                          onChange={(e) => update(d.id, "minimum", e.target.value)}
                          placeholder="95"
                          data-testid={`debt-min-${i}`}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="linkish"
                          onClick={() => setDebts((rows) => (rows.length <= 1 ? rows : rows.filter((r) => r.id !== d.id)))}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="cta-row" style={{ marginTop: 12 }}>
              <button type="button" className="btn ghost" onClick={() => setDebts((r) => [...r, emptyRow()])} data-testid="add-debt">
                Add a debt
              </button>
            </div>

            <div className="calc-controls">
              <label>
                Extra toward debt each month
                <input
                  inputMode="decimal"
                  value={extra}
                  onChange={(e) => setExtra(e.target.value)}
                  placeholder="100"
                  data-testid="calc-extra"
                />
              </label>
              <fieldset className="seg">
                <legend>Payoff order</legend>
                <label>
                  <input
                    type="radio"
                    name="strategy"
                    checked={strategy === "snowball"}
                    onChange={() => setStrategy("snowball")}
                    data-testid="strategy-snowball"
                  />
                  Snowball <span className="muted">smallest balance first</span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="strategy"
                    checked={strategy === "avalanche"}
                    onChange={() => setStrategy("avalanche")}
                    data-testid="strategy-avalanche"
                  />
                  Avalanche <span className="muted">highest APR first</span>
                </label>
              </fieldset>
            </div>
            {parsed.errors.length ? (
              <ul className="field-errors" role="alert">
                {parsed.errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            ) : null}
          </div>

          {result ? (
            <div className="results" data-testid="calc-results">
              {result.ok ? (
                <>
                  <div className="card solid highlight">
                    <p className="eyebrow">Debt-free date</p>
                    <p className="stat-num" data-testid="debt-free-date">
                      {result.debtFreeYearMonth
                        ? formatYearMonth(result.debtFreeYearMonth)
                        : "—"}
                    </p>
                    <p className="muted">
                      {result.months} month{result.months === 1 ? "" : "s"} ·{" "}
                      {formatCents(result.interestCents)} in interest
                    </p>
                  </div>
                  <div className="cards two">
                    <article className="card solid">
                      <h3>Versus minimums only</h3>
                      {result.vsMinimumOnly?.otherCapped ? (
                        <p>Paying only minimums may not finish within 50 years. This plan gets you there sooner.</p>
                      ) : (
                        <p>
                          You&apos;d save about{" "}
                          <strong>{formatCents(result.vsMinimumOnly?.interestSavedCents ?? 0)}</strong> in
                          interest and{" "}
                          <strong>{result.vsMinimumOnly?.monthsSaved ?? 0}</strong> months.
                        </p>
                      )}
                    </article>
                    <article className="card solid">
                      <h3>
                        {strategy === "snowball" ? "Versus avalanche" : "Versus snowball"}
                      </h3>
                      {alt && !alt.otherCapped ? (
                        <p>
                          {strategy === "avalanche"
                            ? "Avalanche usually costs less interest."
                            : "Snowball pays the smallest debt first — a win you can feel."}{" "}
                          Difference: {formatCents(Math.abs(alt.interestSavedCents ?? 0))} interest,{" "}
                          {Math.abs(alt.monthsSaved ?? 0)} months.
                        </p>
                      ) : (
                        <p className="muted">Switch the order above to compare.</p>
                      )}
                    </article>
                  </div>

                  <div className="card solid">
                    <h3>Payoff order</h3>
                    <ol className="payoff-order">
                      {result.debts
                        .slice()
                        .sort((a, b) => (a.payoffMonth ?? 9999) - (b.payoffMonth ?? 9999))
                        .map((d) => (
                          <li key={d.id}>
                            <strong>{d.name}</strong>
                            {d.payoffYearMonth ? ` — ${formatYearMonth(d.payoffYearMonth)}` : ""}
                          </li>
                        ))}
                    </ol>
                    <BalanceChart
                      title="Total balance over time"
                      points={result.schedule.map((s) => ({
                        month: s.month,
                        label: s.yearMonth,
                        cents: s.endBalanceCents,
                      }))}
                    />
                  </div>

                  {result.warnings.length ? (
                    <p className="notice">
                      Some minimums don&apos;t cover this month&apos;s interest. Extra payments are doing
                      the heavy lifting on:{" "}
                      {result.warnings.map((w) => w.name).join(", ")}.
                    </p>
                  ) : null}

                  <div className="card solid">
                    <button
                      type="button"
                      className="linkish"
                      onClick={() => setShowSchedule((s) => !s)}
                      aria-expanded={showSchedule}
                    >
                      {showSchedule ? "Hide" : "Show"} month-by-month schedule
                    </button>
                    {showSchedule ? (
                      <div className="table-scroll" style={{ marginTop: 12 }}>
                        <table className="plain-table compact">
                          <thead>
                            <tr>
                              <th>Month</th>
                              <th>Paid</th>
                              <th>Interest</th>
                              <th>Balance</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.schedule.map((s) => (
                              <tr key={s.month}>
                                <td>{s.yearMonth ?? s.month}</td>
                                <td>{formatCents(s.paymentCents)}</td>
                                <td>{formatCents(s.interestCents)}</td>
                                <td>{formatCents(s.endBalanceCents)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                  </div>
                </>
              ) : (
                <div className="card solid">
                  <h3>This payment can&apos;t quite get there</h3>
                  <p>
                    {result.reason === "interest"
                      ? "The monthly amount is at or below the interest being charged. Add a little extra and try again."
                      : "It would take more than 50 years at this pace. A bit more extra each month will change the picture."}
                  </p>
                </div>
              )}

              <div className="cta-row">
                <button type="button" className="btn" onClick={saveAsPlan} data-testid="save-plan">
                  Save this as my plan
                </button>
                <Link href="/app" className="btn ghost">
                  Open my plan
                </Link>
              </div>
              {saveMsg ? <p className="notice" role="status">{saveMsg}</p> : null}
            </div>
          ) : (
            <p className="muted" style={{ marginTop: 24 }}>
              Add a balance and a minimum to see your date.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
