import type { MatchEventWithPlayer } from '../types';

const EVENT_ICONS: Record<MatchEventWithPlayer['eventType'], string> = {
  goal: '⚽',
  own_goal: '⚽ (phản lưới)',
  assist: '🎯',
  yellow_card: '🟨',
  red_card: '🟥',
  mvp: '⭐',
};

const EVENT_LABELS: Record<MatchEventWithPlayer['eventType'], string> = {
  goal: 'Bàn thắng',
  own_goal: 'Phản lưới nhà',
  assist: 'Kiến tạo',
  yellow_card: 'Thẻ vàng',
  red_card: 'Thẻ đỏ',
  mvp: 'Cầu thủ xuất sắc',
};

export function MatchTimeline({ events }: { events: MatchEventWithPlayer[] }) {
  if (events.length === 0) {
    return <p style={{ color: 'var(--text-muted)' }}>Chưa có sự kiện nào được ghi nhận.</p>;
  }

  return (
    <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 'var(--ptx-space-2)' }}>
      {events.map((event) => (
        <li
          key={event.id}
          style={{
            display: 'flex',
            gap: 'var(--ptx-space-3)',
            padding: 'var(--ptx-space-2) var(--ptx-space-3)',
            borderRadius: 'var(--ptx-radius-sm)',
            background: 'var(--surface-page)',
          }}
        >
          <span style={{ fontFamily: 'var(--ptx-font-title)', minWidth: '3rem' }}>{event.minute}&apos;</span>
          <span>{EVENT_ICONS[event.eventType]}</span>
          <span>
            {EVENT_LABELS[event.eventType]}
            {event.playerName ? ` — ${event.playerName}` : ''}
          </span>
        </li>
      ))}
    </ol>
  );
}
