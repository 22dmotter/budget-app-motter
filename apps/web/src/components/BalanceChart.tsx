import { formatCents } from "@motter/core";

type Point = { month: number; label?: string | null; cents: number };

export function BalanceChart({ points, title }: { points: Point[]; title?: string }) {
  if (points.length < 2) return null;
  const w = 640;
  const h = 220;
  const pad = { l: 78, r: 16, t: 16, b: 28 };
  const max = Math.max(...points.map((p) => p.cents), 1);
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const xy = (i: number, cents: number) => {
    const x = pad.l + (i / (points.length - 1)) * innerW;
    const y = pad.t + (1 - cents / max) * innerH;
    return { x, y, s: `${x},${y}` };
  };
  const coords = points.map((p, i) => xy(i, p.cents));
  const line = coords.map((c) => c.s).join(" ");
  const area = `${xy(0, 0).s} ` + line + ` ${xy(points.length - 1, 0).s}`;
  const last = points[points.length - 1]!;
  const first = points[0]!;

  return (
    <figure className="chart-wrap">
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={title ?? "Balance over time"}>
        <title>{title ?? "Balance over time"}</title>
        <line x1={pad.l} y1={pad.t} x2={pad.l} y2={h - pad.b} stroke="#E2E8F0" />
        <line x1={pad.l} y1={h - pad.b} x2={w - pad.r} y2={h - pad.b} stroke="#E2E8F0" />
        <polygon points={area} fill="rgba(180,35,24,0.08)" />
        <polyline points={line} fill="none" stroke="#B42318" strokeWidth="2.5" />
        {coords.map((c, i) => {
          const p = points[i]!;
          const show = i === 0 || i === points.length - 1 || i % Math.max(1, Math.ceil(points.length / 8)) === 0;
          if (!show) return null;
          return (
            <circle key={`pt-${p.month}-${i}`} cx={c.x} cy={c.y} r="3.5" fill="#B42318">
              <title>
                {p.label ?? `Month ${p.month}`}: {formatCents(p.cents)}
              </title>
            </circle>
          );
        })}
        <text x={pad.l - 8} y={pad.t + 4} textAnchor="end" className="chart-label">
          {formatCents(max)}
        </text>
        <text x={pad.l - 8} y={h - pad.b} textAnchor="end" className="chart-label">
          $0
        </text>
        <text x={pad.l} y={h - 8} className="chart-label">
          {first.month === 0 ? "Start" : first.label || "Start"}
        </text>
        <text x={w - pad.r} y={h - 8} textAnchor="end" className="chart-label">
          {last.label || `Month ${last.month}`}
        </text>
      </svg>
    </figure>
  );
}
