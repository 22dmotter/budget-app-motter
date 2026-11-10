"use client";

import { formatCents } from "@motter/core";
import raw from "@/data/daniel-journey.json";

type Milestone = { id: string; label: string; date: string };
type JourneySnapshot = {
  startingCents: number;
  paidCents: number;
  percent: number;
  dayCount: number;
  contributionsUrl: string;
  youtubeUrl: string;
  milestones: Milestone[];
};

const journey = raw as JourneySnapshot;

export function DanielStory({ onHide }: { onHide: () => void }) {
  const pct = Math.max(0, Math.min(100, journey.percent));
  return (
    <article className="card solid story-card">
      <h3>Walking this road too</h3>
      <p>
        Daniel is paying off {formatCents(journey.startingCents)} and has logged{" "}
        <strong>{formatCents(journey.paidCents)}</strong> so far ({pct.toFixed(1)}%) — day{" "}
        {journey.dayCount} of the journey.
      </p>
      {journey.milestones.length ? (
        <ul>
          {journey.milestones.map((m) => (
            <li key={m.id}>
              {m.label} — {m.date}
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">His public ledger is just getting started — no later milestone dates yet.</p>
      )}
      <p>
        <a className="text-link" href={journey.contributionsUrl} target="_blank" rel="noreferrer">
          Daily contributions
        </a>
        {" · "}
        <a className="text-link" href={journey.youtubeUrl} target="_blank" rel="noreferrer">
          YouTube
        </a>
      </p>
      <button type="button" className="linkish" onClick={onHide}>
        Hide this card
      </button>
    </article>
  );
}
