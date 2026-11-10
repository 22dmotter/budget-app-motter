"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  addPaymentEntry,
  currentBalanceCents,
  deriveJourney,
  emptyAppState,
  formatCents,
  formatYearMonth,
  parseMoneyInput,
  pickLine,
  progressTotals,
  summarizeBudget,
  todayIso,
  parseAppState,
  undoLatestEntry,
  type JourneyStation,
} from "@motter/core";
import type { AppState, BudgetLine, IncomeSource, TrackedDebt } from "@motter/shared";
import { brand } from "@/config/brand";
import { CalmShell } from "@/components/CalmShell";
import { PlusBadge } from "@/components/PlusBadge";
import { newId } from "@/lib/ids";
import { createLocalPlanStorage } from "@/lib/storage-local";
import { Celebration } from "./Celebration";
import { DanielStory } from "./DanielStory";
import { InstallHint } from "./InstallHint";
import { JourneyPath } from "./JourneyPath";

type Tab = "plan" | "journey" | "log" | "budget" | "more";
const TABS: { id: Tab; label: string }[] = [
  { id: "plan", label: "Plan" },
  { id: "journey", label: "Journey" },
  { id: "log", label: "Log payment" },
  { id: "budget", label: "Budget" },
  { id: "more", label: "More" },
];

const DEFAULT_CATEGORIES: { name: string; group: BudgetLine["group"] }[] = [
  { name: "Tithe / Giving", group: "giving" },
  { name: "Emergency fund", group: "saving" },
  { name: "Housing", group: "needs" },
  { name: "Groceries", group: "needs" },
  { name: "Utilities", group: "needs" },
  { name: "Transport", group: "needs" },
  { name: "Dining", group: "wants" },
];

function parseTab(hash: string): Tab {
  const id = hash.replace(/^#/, "") as Tab;
  return TABS.some((t) => t.id === id) ? id : "plan";
}

export function PlanApp() {
  const today = todayIso();
  const storage = useMemo(() => createLocalPlanStorage(), []);
  const [state, setState] = useState<AppState>(() => emptyAppState());
  const [raw, setRaw] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("plan");
  const [celebrate, setCelebrate] = useState<JourneyStation | null>(null);

  const persist = useCallback(
    (next: AppState, message?: string) => {
      const saved = storage.save(next, raw, today);
      if (!saved.ok) {
        setNotice(saved.message);
        return false;
      }
      setState(next);
      setRaw(saved.raw);
      if (message) {
        setToast(message);
        setTimeout(() => setToast(null), 4000);
      }
      return true;
    },
    [raw, storage, today]
  );

  useEffect(() => {
    const loaded = storage.load(today);
    setState(loaded.state);
    setRaw(loaded.raw);
    if (!loaded.ok) setNotice(loaded.message);
    setReady(true);
  }, [storage, today]);

  useEffect(() => {
    const apply = () => setTab(parseTab(window.location.hash));
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);

  function go(next: Tab) {
    setTab(next);
    const url = `${window.location.pathname}${window.location.search}#${next}`;
    window.history.replaceState(null, "", url);
  }

  const journey = useMemo(() => deriveJourney(state, today), [state, today]);
  const budget = useMemo(() => {
    const mins = state.debts.reduce((s, d) => s + d.minimumPaymentCents, 0);
    return summarizeBudget({
      incomes: state.incomes,
      categories: state.categories,
      debtMinimumsCents: mins,
    });
  }, [state]);

  useEffect(() => {
    if (!ready || !state.onboardingComplete) return;
    const fresh = journey.stations.filter(
      (s) => s.achieved && !(state.celebratedIds ?? []).includes(s.id)
    );
    if (fresh[0] && !celebrate) setCelebrate(fresh[0]);
  }, [ready, state, journey, celebrate]);

  const behindPlan =
    state.onboardingComplete &&
    budget.monthlyIncomeCents > 0 &&
    (() => {
      const planned = state.debts.reduce((s, d) => s + d.minimumPaymentCents, 0) + state.plan.extraMonthlyCents;
      const month = today.slice(0, 7);
      let paid = 0;
      for (const d of state.debts) {
        for (const e of d.entries) if (e.date.startsWith(month)) paid += e.paymentCents;
      }
      return planned > 0 && paid < planned && paid > 0;
    })();

  if (!ready) {
    return (
      <>
        <CalmShell />
        <div className="app-shell">
          <p className="muted" style={{ padding: 24 }}>
            Loading your plan…
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <CalmShell />
      <div className="app-shell">
        <aside className="app-sidebar">
          <Link href="/" className="logo app-logo">
            {brand.name}
            {brand.logoMark ? <span>{brand.logoMark}</span> : null}
          </Link>
          {state.onboardingComplete ? <Nav tab={tab} onGo={go} variant="side" /> : null}
        </aside>
        <div className="app-main">
          <header className="app-top">
            <Link href="/" className="logo app-logo mobile-only">
              {brand.name}
            </Link>
            <p className="device-note">Data stays on this device until accounts launch.</p>
          </header>
          {notice ? (
            <p className="notice" role="status">
              {notice}
            </p>
          ) : null}
          {state.onboardingComplete ? <InstallHint /> : null}
          {toast ? (
            <p className="toast" role="status">
              {toast}
            </p>
          ) : null}
          {!state.onboardingComplete ? (
            <Onboarding state={state} persist={persist} />
          ) : (
            <>
              {behindPlan ? (
                <p className="grace-note">{pickLine("behindPlan", today).text}</p>
              ) : null}
              {tab === "plan" && (
                <PlanHome state={state} journey={journey} budget={budget} onGo={go} />
              )}
              {tab === "journey" && (
                <JourneyView
                  state={state}
                  journey={journey}
                  onHideStory={() => persist({ ...state, hideDanielStory: true })}
                />
              )}
              {tab === "log" && <LogPayment state={state} persist={persist} today={today} />}
              {tab === "budget" && <BudgetView state={state} budget={budget} persist={persist} />}
              {tab === "more" && (
                <MoreView state={state} persist={persist} today={today} raw={raw} setNotice={setNotice} />
              )}
            </>
          )}
        </div>
        {state.onboardingComplete ? <Nav tab={tab} onGo={go} variant="tabs" /> : null}
      </div>
      {celebrate ? (
        <Celebration
          station={celebrate}
          onDone={() => {
            persist({
              ...state,
              celebratedIds: [...(state.celebratedIds ?? []), celebrate.id],
            });
            setCelebrate(null);
          }}
        />
      ) : null}
    </>
  );
}

function Nav({
  tab,
  onGo,
  variant,
}: {
  tab: Tab;
  onGo: (t: Tab) => void;
  variant: "side" | "tabs";
}) {
  return (
    <nav className={variant === "tabs" ? "tab-bar" : "side-nav"} aria-label="My Plan">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`tab-btn ${t.id === "log" ? "tab-primary" : ""} ${tab === t.id ? "active" : ""}`}
          onClick={() => onGo(t.id)}
          data-testid={`tab-${t.id}`}
        >
          {t.id === "log" ? "Log a payment" : t.label}
        </button>
      ))}
    </nav>
  );
}

function PlanHome({
  state,
  journey,
  budget,
  onGo,
}: {
  state: AppState;
  journey: ReturnType<typeof deriveJourney>;
  budget: ReturnType<typeof summarizeBudget>;
  onGo: (t: Tab) => void;
}) {
  const totals = progressTotals(state.debts);
  return (
    <div className="panel">
      <h1>Your plan</h1>
      <div className="stat-row">
        <div className="card solid">
          <p className="eyebrow">Paid down</p>
          <p className="stat-num" data-testid="amount-paid">
            {formatCents(journey.paidDownCents)}
          </p>
          <p className="muted">{totals.percent.toFixed(0)}% of your starting total</p>
        </div>
        <div className="card solid">
          <p className="eyebrow">Debt-free date</p>
          <p className="stat-num" data-testid="plan-debt-free">
            {journey.projectedDebtFreeDate
              ? formatYearMonth(journey.projectedDebtFreeDate)
              : "Let’s add a little extra"}
          </p>
        </div>
      </div>
      {budget.monthlyIncomeCents > 0 ? (
        <p className="muted">
          Remaining to assign this month:{" "}
          <strong>{formatCents(budget.remainingToAssignCents)}</strong>
        </p>
      ) : null}
      {journey.next ? (
        <button type="button" className="card solid next-card" onClick={() => onGo("journey")}>
          <p className="eyebrow">Next milestone</p>
          <p>
            {journey.next.remainingCents > 0
              ? `${formatCents(journey.next.remainingCents)} to ${journey.next.station.label}`
              : journey.next.station.label}
            {journey.next.projectedDate
              ? ` — about ${formatYearMonth(journey.next.projectedDate)} on your plan`
              : ""}
          </p>
        </button>
      ) : null}
      <h2>Debts</h2>
      <ul className="debt-list">
        {state.debts.map((d) => {
          const cur = currentBalanceCents(d);
          const pct = d.startingCents ? Math.max(0, Math.min(100, ((d.startingCents - cur) / d.startingCents) * 100)) : 0;
          return (
            <li key={d.id} className="card solid">
              <div className="debt-head">
                <strong>{d.name}</strong>
                <span>{formatCents(cur)}</span>
              </div>
              <div className="bar" aria-hidden="true">
                <span style={{ width: `${pct}%` }} />
              </div>
              <p className="muted">{pct.toFixed(0)}% paid down · min {formatCents(d.minimumPaymentCents)}</p>
            </li>
          );
        })}
      </ul>
      {!state.debts.length ? (
        <p>
          <Link href="/calculator" className="text-link">
            Add debts in the calculator
          </Link>
        </p>
      ) : null}
      <button type="button" className="btn" onClick={() => onGo("log")} data-testid="log-cta">
        Log a payment
      </button>
    </div>
  );
}

function JourneyView({
  state,
  journey,
  onHideStory,
}: {
  state: AppState;
  journey: ReturnType<typeof deriveJourney>;
  onHideStory: () => void;
}) {
  return (
    <div className="panel" data-testid="journey-panel">
      <h1>Your road to debt-free</h1>
      <div className="stat-row">
        <div className="card solid">
          <p className="eyebrow">Paid down</p>
          <p className="stat-num">{formatCents(journey.paidDownCents)}</p>
          <p className="muted">{journey.percentPaid.toFixed(0)}%</p>
        </div>
        {journey.next ? (
          <div className="card solid">
            <p className="eyebrow">Next</p>
            <p>
              {journey.next.remainingCents > 0
                ? `${formatCents(journey.next.remainingCents)} to ${journey.next.station.label}`
                : journey.next.station.label}
              {journey.next.projectedDate
                ? `, about ${formatYearMonth(journey.next.projectedDate)} on your plan`
                : ""}
            </p>
          </div>
        ) : null}
      </div>
      <div className="streak-row">
        <span className="chip">
          On-plan months: {journey.streaks.onPlanMonths}
          {journey.streaks.onPlanMonthsBest ? ` · best ${journey.streaks.onPlanMonthsBest}` : ""}
        </span>
        <span className="chip">
          Check-in weeks: {journey.streaks.checkInWeeks}
          {journey.streaks.checkInWeeksBest ? ` · best ${journey.streaks.checkInWeeksBest}` : ""}
        </span>
      </div>
      <div className="plus-row">
        <span>
          Streak reminders <PlusBadge />
        </span>
        <span>
          Shareable milestone cards <PlusBadge />
        </span>
      </div>
      <JourneyPath stations={journey.stations} />
      {journey.interestAvoidedCents != null && journey.interestAvoidedCents > 0 ? (
        <p className="muted">
          Interest you&apos;ve avoided (estimate): {formatCents(journey.interestAvoidedCents)} versus
          paying minimums only.
        </p>
      ) : null}
      <h2>Badges</h2>
      <ul className="badge-shelf">
        {journey.badges.map((b) => (
          <li key={b.id} className={b.earned ? "earned" : ""}>
            <strong>{b.label}</strong>
            {b.earnedOn ? <span className="muted"> · {b.earnedOn}</span> : null}
          </li>
        ))}
      </ul>
      {!state.hideDanielStory ? <DanielStory onHide={onHideStory} /> : null}
    </div>
  );
}

function LogPayment({
  state,
  persist,
  today,
}: {
  state: AppState;
  persist: (s: AppState, msg?: string) => boolean;
  today: string;
}) {
  const [debtId, setDebtId] = useState(state.debts[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState("");
  const [date, setDate] = useState(today);
  const [error, setError] = useState<string | null>(null);
  const debt = state.debts.find((d) => d.id === debtId);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!debt) {
      setError("Add a debt first.");
      return;
    }
    const paymentCents = parseMoneyInput(amount);
    const balanceCents = balance.trim()
      ? parseMoneyInput(balance)
      : currentBalanceCents(debt) - (paymentCents ?? 0);
    if (paymentCents === null || paymentCents < 0) {
      setError("Enter the payment amount.");
      return;
    }
    if (balanceCents === null || balanceCents < 0) {
      setError("Enter the remaining balance after this payment.");
      return;
    }
    try {
      const next = addPaymentEntry(
        state,
        debt.id,
        { id: newId(), date, paymentCents, balanceCents },
        today
      );
      persist(next, pickLine("paymentLogged", date).text);
      setAmount("");
      setBalance("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not log that payment.");
    }
  }

  return (
    <div className="panel">
      <h1>Log a payment</h1>
      <p className="muted">Record what you actually paid and the balance that&apos;s left. We won&apos;t invent numbers.</p>
      <form className="card solid form-stack" onSubmit={submit}>
        <label>
          Debt
          <select value={debtId} onChange={(e) => setDebtId(e.target.value)} data-testid="log-debt">
            {state.debts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} · {formatCents(currentBalanceCents(d))}
              </option>
            ))}
          </select>
        </label>
        <label>
          Date
          <input type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label>
          Amount paid
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="50"
            data-testid="log-amount"
          />
        </label>
        <label>
          Balance after this payment
          <input
            inputMode="decimal"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            placeholder="Optional — we’ll subtract the payment if you leave this blank"
            data-testid="log-balance"
          />
        </label>
        {error ? (
          <p className="field-errors" role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" className="btn" data-testid="log-save">
          Save payment
        </button>
      </form>
    </div>
  );
}

function BudgetView({
  state,
  budget,
  persist,
}: {
  state: AppState;
  budget: ReturnType<typeof summarizeBudget>;
  persist: (s: AppState, msg?: string) => boolean;
}) {
  function setLine(id: string, planned: string) {
    const cents = parseMoneyInput(planned);
    if (cents === null && planned.trim()) return;
    persist({
      ...state,
      categories: state.categories.map((c) =>
        c.id === id ? { ...c, plannedCents: cents ?? 0 } : c
      ),
    });
  }
  return (
    <div className="panel">
      <h1>Budget</h1>
      <p>
        Monthly income: <strong>{formatCents(budget.monthlyIncomeCents)}</strong>
        <br />
        Remaining to assign: <strong>{formatCents(budget.remainingToAssignCents)}</strong>
        {budget.isZeroBased ? " · This month is zero-based." : null}
      </p>
      <p className="muted">
        Suggested extra toward debt: {formatCents(budget.suggestedExtraTowardDebtCents)}
      </p>
      <ul className="debt-list">
        {state.categories.map((c) => (
          <li key={c.id} className="card solid">
            <label>
              {c.name} <span className="muted">({c.group})</span>
              <input
                inputMode="decimal"
                defaultValue={(c.plannedCents / 100).toFixed(2)}
                onBlur={(e) => setLine(c.id, e.target.value)}
              />
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MoreView({
  state,
  persist,
  today,
  raw,
  setNotice,
}: {
  state: AppState;
  persist: (s: AppState, msg?: string) => boolean;
  today: string;
  raw: string | null;
  setNotice: (s: string | null) => void;
}) {
  function download() {
    const blob = new Blob([raw ?? JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "budget-app-plan.json";
    a.click();
    URL.revokeObjectURL(url);
  }
  function onImport(file: File) {
    if (!confirm("Replace the plan on this device with this backup?")) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const next = parseAppState(String(reader.result), today);
        persist(next, "Backup imported.");
      } catch (e) {
        setNotice(e instanceof Error ? e.message : "Could not import that file.");
      }
    };
    reader.readAsText(file);
  }
  return (
    <div className="panel">
      <h1>More</h1>
      <div className="cta-row">
        <button
          type="button"
          className="btn ghost"
          onClick={() => {
            try {
              const next = undoLatestEntry(state, today);
              persist(next, "Last entry undone.");
            } catch (e) {
              setNotice(e instanceof Error ? e.message : "Nothing to undo.");
            }
          }}
        >
          Undo last entry
        </button>
        <button type="button" className="btn ghost" onClick={download}>
          Download backup
        </button>
        <label className="btn ghost">
          Import backup
          <input
            type="file"
            accept="application/json"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImport(f);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      <h2>Coming later</h2>
      <ul className="plus-list">
        <li>
          PDF progress report <PlusBadge />
        </li>
        <li>
          Monthly check-in reminders <PlusBadge />
        </li>
        <li>
          Accountability partner <PlusBadge />
        </li>
        <li>
          Full payment timeline <PlusBadge />
        </li>
        <li>
          Shareable milestone cards <PlusBadge />
        </li>
      </ul>
      <p className="muted">These will be easy to offer as Plus later. Nothing is locked today — and there are no prices yet.</p>
      <p>
        <Link href="/calculator" className="text-link">
          Open the calculator
        </Link>
        {" · "}
        <Link href="/" className="text-link">
          Home
        </Link>
      </p>
    </div>
  );
}

function Onboarding({
  state,
  persist,
}: {
  state: AppState;
  persist: (s: AppState, msg?: string) => boolean;
}) {
  const step = state.onboardingStep ?? 1;
  const [incomeName, setIncomeName] = useState(state.incomes[0]?.name ?? "Primary income");
  const [incomeAmt, setIncomeAmt] = useState(
    state.incomes[0] ? (state.incomes[0].amountCents / 100).toString() : ""
  );
  const [freq, setFreq] = useState<IncomeSource["frequency"]>(state.incomes[0]?.frequency ?? "monthly");

  function nextIncome(e: React.FormEvent) {
    e.preventDefault();
    const amountCents = parseMoneyInput(incomeAmt);
    if (amountCents === null || amountCents <= 0) return;
    const incomes: IncomeSource[] = [
      { id: state.incomes[0]?.id ?? newId(), name: incomeName.trim() || "Income", amountCents, frequency: freq },
    ];
    const categories =
      state.categories.length > 0
        ? state.categories
        : DEFAULT_CATEGORIES.map((c) => ({
            id: newId(),
            name: c.name,
            group: c.group,
            plannedCents: 0,
            actualCents: 0,
          }));
    persist({ ...state, incomes, categories, onboardingStep: 2 });
  }

  return (
    <div className="panel onboarding" data-testid="onboarding">
      <p className="eyebrow">Step {step} of 4</p>
      {step === 1 && (
        <form className="card solid form-stack" onSubmit={nextIncome}>
          <h1>What do you bring in?</h1>
          <p className="muted">Just one income is enough to start. You can add more later.</p>
          <label>
            Name
            <input value={incomeName} onChange={(e) => setIncomeName(e.target.value)} />
          </label>
          <label>
            Amount
            <input
              inputMode="decimal"
              value={incomeAmt}
              onChange={(e) => setIncomeAmt(e.target.value)}
              data-testid="income-amount"
              required
            />
          </label>
          <label>
            How often
            <select value={freq} onChange={(e) => setFreq(e.target.value as IncomeSource["frequency"])}>
              <option value="monthly">Monthly</option>
              <option value="semimonthly">Twice a month</option>
              <option value="biweekly">Every two weeks</option>
              <option value="weekly">Weekly</option>
            </select>
          </label>
          <button type="submit" className="btn" data-testid="onboard-next">
            Next
          </button>
        </form>
      )}
      {step === 2 && (
        <div className="card solid">
          <h1>Where does it go?</h1>
          <p className="muted">Give every dollar a job. Start simple — zeros are fine.</p>
          {state.categories.map((c) => (
            <label key={c.id} className="form-stack">
              {c.name}
              <input
                inputMode="decimal"
                defaultValue={c.plannedCents ? (c.plannedCents / 100).toString() : ""}
                onBlur={(e) => {
                  const cents = parseMoneyInput(e.target.value) ?? 0;
                  persist({
                    ...state,
                    categories: state.categories.map((x) =>
                      x.id === c.id ? { ...x, plannedCents: cents } : x
                    ),
                  });
                }}
              />
            </label>
          ))}
          <button type="button" className="btn" onClick={() => persist({ ...state, onboardingStep: 3 })}>
            Next
          </button>
        </div>
      )}
      {step === 3 && (
        <div className="card solid">
          <h1>Your debts</h1>
          {state.debts.length ? (
            <ul>
              {state.debts.map((d: TrackedDebt) => (
                <li key={d.id}>
                  {d.name} — {formatCents(d.openingCents)}
                </li>
              ))}
            </ul>
          ) : (
            <p>
              No debts yet.{" "}
              <Link href="/calculator" className="text-link">
                Add them in the calculator
              </Link>{" "}
              and choose “Save this as my plan.”
            </p>
          )}
          <button type="button" className="btn" onClick={() => persist({ ...state, onboardingStep: 4 })}>
            Next
          </button>
        </div>
      )}
      {step === 4 && (
        <div className="card solid">
          <h1>Choose your plan</h1>
          <p className="muted">Snowball pays the smallest balance first. Avalanche attacks the highest interest.</p>
          <fieldset className="seg">
            <legend>Order</legend>
            <label>
              <input
                type="radio"
                name="st"
                checked={state.plan.strategy === "snowball"}
                onChange={() =>
                  persist({ ...state, plan: { ...state.plan, strategy: "snowball" } })
                }
              />
              Snowball
            </label>
            <label>
              <input
                type="radio"
                name="st"
                checked={state.plan.strategy === "avalanche"}
                onChange={() =>
                  persist({ ...state, plan: { ...state.plan, strategy: "avalanche" } })
                }
              />
              Avalanche
            </label>
          </fieldset>
          <label>
            Extra each month
            <input
              inputMode="decimal"
              defaultValue={state.plan.extraMonthlyCents ? String(state.plan.extraMonthlyCents / 100) : ""}
              onBlur={(e) => {
                const cents = parseMoneyInput(e.target.value) ?? 0;
                persist({ ...state, plan: { ...state.plan, extraMonthlyCents: cents } });
              }}
            />
          </label>
          <button
            type="button"
            className="btn"
            data-testid="onboard-finish"
            onClick={() => persist({ ...state, onboardingComplete: true, onboardingStep: 4 })}
          >
            See my plan
          </button>
        </div>
      )}
    </div>
  );
}
