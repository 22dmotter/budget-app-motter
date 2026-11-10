"use client";

import { pickLine, verseForStation, type JourneyStation } from "@motter/core";

export function Celebration({
  station,
  onDone,
}: {
  station: JourneyStation;
  onDone: () => void;
}) {
  const kind =
    station.id === "percent-50"
      ? "percent-50"
      : station.id.startsWith("debt-closed") || station.id === "first-debt-paid"
        ? "debt-closed"
        : undefined;
  const isFree = station.id === "debt-free";
  const line = isFree
    ? pickLine("debtFree", station.id)
    : pickLine("milestone", station.id, kind);
  const verse = verseForStation(station.id);

  return (
    <div className="celebrate-scrim" role="dialog" aria-labelledby="celebrate-title">
      <div className="card solid celebrate-card">
        <div className="confetti" aria-hidden="true" />
        <p className="eyebrow">Milestone</p>
        <h2 id="celebrate-title">{station.label}</h2>
        <p className="lead">{line.text}</p>
        {line.citation ? <p className="muted">{line.citation}</p> : null}
        <blockquote>
          &quot;{verse.text}&quot;
          <cite>{verse.citation}</cite>
        </blockquote>
        <p className="muted">Celebrate in a small way that still fits your budget — a walk, a note, a quiet thank-you.</p>
        <button type="button" className="btn" onClick={onDone} autoFocus>
          Keep going
        </button>
      </div>
    </div>
  );
}
