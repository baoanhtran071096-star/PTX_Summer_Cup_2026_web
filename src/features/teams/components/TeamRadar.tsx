import type { TeamAttributes } from '@/domain/team/team.entity';

const AXES: { key: keyof TeamAttributes; label: string }[] = [
  { key: 'attack', label: 'Tấn công' },
  { key: 'defense', label: 'Phòng ngự' },
  { key: 'speed', label: 'Tốc độ' },
  { key: 'power', label: 'Thể lực' },
];

const SIZE = 200;
const CENTER = SIZE / 2;
const RADIUS = 80;
const MAX_VALUE = 99;

function pointOnAxis(index: number, total: number, value: number) {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
  const r = (value / MAX_VALUE) * RADIUS;
  return { x: CENTER + r * Math.cos(angle), y: CENTER + r * Math.sin(angle) };
}

/** Static SVG — no interactivity needed, renders server-side. */
export function TeamRadar({ stats, color }: { stats: TeamAttributes; color: string }) {
  const points = AXES.map((axis, i) => pointOnAxis(i, AXES.length, stats[axis.key]));
  const polygon = points.map((p) => `${p.x},${p.y}`).join(' ');
  const gridPolygon = AXES.map((_, i) => pointOnAxis(i, AXES.length, MAX_VALUE))
    .map((p) => `${p.x},${p.y}`)
    .join(' ');

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE} role="img" aria-label="Biểu đồ chỉ số đội">
      <polygon points={gridPolygon} fill="none" stroke="var(--border-color)" strokeWidth={1} />
      <polygon points={polygon} fill={color} fillOpacity={0.35} stroke={color} strokeWidth={2} />
      {AXES.map((axis, i) => {
        const labelPoint = pointOnAxis(i, AXES.length, MAX_VALUE + 18);
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
