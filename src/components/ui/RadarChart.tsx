export type RadarAxis = { key: string; label: string; value: number };

const SIZE = 200;
const CENTER = SIZE / 2;
const RADIUS = 80;

function pointOnAxis(index: number, total: number, value: number, max: number) {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
  const r = (Math.max(0, Math.min(value, max)) / max) * RADIUS;
  return { x: CENTER + r * Math.cos(angle), y: CENTER + r * Math.sin(angle) };
}

/**
 * Generic radar/spider chart — static SVG, no interactivity needed,
 * renders server-side. Used for both team attributes (real legacy
 * data) and player performance stats (derived from match_events);
 * `max` sets the outer ring for whatever scale the caller's axes use.
 */
export function RadarChart({
  axes,
  max,
  color,
  ariaLabel,
}: {
  axes: RadarAxis[];
  max: number;
  color: string;
  ariaLabel: string;
}) {
  const points = axes.map((axis, i) => pointOnAxis(i, axes.length, axis.value, max));
  const polygon = points.map((p) => `${p.x},${p.y}`).join(' ');
  const gridPolygon = axes
    .map((_, i) => pointOnAxis(i, axes.length, max, max))
    .map((p) => `${p.x},${p.y}`)
    .join(' ');

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE} role="img" aria-label={ariaLabel}>
      <polygon points={gridPolygon} fill="none" stroke="var(--border-color)" strokeWidth={1} />
      <polygon points={polygon} fill={color} fillOpacity={0.35} stroke={color} strokeWidth={2} />
      {axes.map((axis, i) => {
        const labelPoint = pointOnAxis(i, axes.length, max * 1.18, max);
        return (
          <text
            key={axis.key}
            x={labelPoint.x}
            y={labelPoint.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={10}
            fill="var(--text-muted)"
          >
            {axis.label}
          </text>
        );
      })}
    </svg>
  );
}
