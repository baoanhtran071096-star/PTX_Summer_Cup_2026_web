import type { PlayerPerformanceStats } from '@/domain/player/player.entity';

const STAT_LABELS: { key: keyof PlayerPerformanceStats; label: string }[] = [
  { key: 'goals', label: 'Bàn thắng' },
  { key: 'assists', label: 'Kiến tạo' },
  { key: 'mvpCount', label: 'MVP' },
  { key: 'yellowCards', label: 'Thẻ vàng' },
  { key: 'redCards', label: 'Thẻ đỏ' },
];

export function PlayerStats({ stats }: { stats: PlayerPerformanceStats }) {
  return (
    <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 'var(--ptx-space-4)', margin: 0 }}>
      {STAT_LABELS.map(({ key, label }) => (
        <div key={key} style={{ textAlign: 'center' }}>
          <dt style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{label}</dt>
          <dd style={{ margin: 0, fontFamily: 'var(--ptx-font-title)', fontSize: '1.5rem' }}>{stats[key]}</dd>
        </div>
      ))}
    </dl>
  );
}
