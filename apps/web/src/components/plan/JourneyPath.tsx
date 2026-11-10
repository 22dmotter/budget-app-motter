"use client";

import type { JourneyStation } from "@motter/core";

export function JourneyPath({ stations }: { stations: JourneyStation[] }) {
  const n = Math.max(stations.length, 1);
  const height = Math.max(280, n * 56);
  const xOf = (i: number) => {
    const t = n === 1 ? 0 : i / (n - 1);
    return 50 + Math.sin(t * Math.PI * 2.2) * 28;
  };
  const yOf = (i: number) => 24 + (i / Math.max(n - 1, 1)) * (height - 48);
  const d = stations
    .map((_, i) => `${i === 0 ? "M" : "L"} ${xOf(i)} ${yOf(i)}`)
    .join(" ");
  const current = stations.findIndex((s) => !s.achieved);
  const markerIndex = current === -1 ? n - 1 : Math.max(0, current);

  return (
    <svg
      className="journey-svg"
      viewBox={`0 0 100 ${height}`}
      role="img"
      aria-label="Your road to debt-free"
      preserveAspectRatio="xMidYMin meet"
    >
      <path d={d} fill="none" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
      {stations.map((s, i) => {
        const x = xOf(i);
        const y = yOf(i);
        const state = s.achieved ? "done" : i === current ? "next" : "later";
        return (
          <g key={s.id}>
            <circle
              cx={x}
              cy={y}
              r={state === "next" ? 5.5 : 4.5}
              className={`station station-${state}`}
            />
            <text
              x={x + (x < 50 ? 8 : -8)}
              y={y + 1.5}
              textAnchor={x < 50 ? "start" : "end"}
              className="station-label"
            >
              {s.label}
            </text>
          </g>
        );
      })}
      <circle
        cx={xOf(markerIndex)}
        cy={yOf(markerIndex)}
        r="2.2"
        fill="#0F1E3D"
        className="you-are-here"
      />
    </svg>
  );
}
