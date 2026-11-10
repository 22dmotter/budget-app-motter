"use client";

import type { JourneyStation } from "@motter/core";

export function JourneyPath({ stations }: { stations: JourneyStation[] }) {
  const n = Math.max(stations.length, 1);
  const width = 400;
  const height = Math.max(360, n * 52);
  const xOf = (i: number) => {
    const t = n === 1 ? 0 : i / (n - 1);
    return width / 2 + Math.sin(t * Math.PI * 2.2) * 72;
  };
  const yOf = (i: number) => 28 + (i / Math.max(n - 1, 1)) * (height - 56);
  const d = stations
    .map((_, i) => `${i === 0 ? "M" : "L"} ${xOf(i)} ${yOf(i)}`)
    .join(" ");
  const current = stations.findIndex((s) => !s.achieved);
  const markerIndex = current === -1 ? n - 1 : Math.max(0, current);

  return (
    <svg
      className="journey-svg"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Your road to debt-free"
      preserveAspectRatio="xMidYMin meet"
    >
      <path d={d} fill="none" stroke="#334155" strokeWidth="4" strokeLinecap="round" />
      {stations.map((s, i) => {
        const x = xOf(i);
        const y = yOf(i);
        const state = s.achieved ? "done" : i === current ? "next" : "later";
        const labelRight = x < width / 2;
        return (
          <g key={s.id}>
            <circle
              cx={x}
              cy={y}
              r={state === "next" ? 9 : 7}
              className={`station station-${state}`}
            />
            <text
              x={x + (labelRight ? 16 : -16)}
              y={y + 4}
              textAnchor={labelRight ? "start" : "end"}
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
        r="3.5"
        fill="#f1f5f9"
        className="you-are-here"
      />
    </svg>
  );
}
