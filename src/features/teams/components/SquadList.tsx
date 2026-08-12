import Link from 'next/link';
import { ROUTES } from '@/constants/routes';
import type { SquadMember } from '../types';

const POSITION_LABELS: Record<SquadMember['position'], string> = {
  GK: 'Thủ môn',
  DF: 'Hậu vệ',
  MF: 'Tiền vệ',
  FW: 'Tiền đạo',
};

export function SquadList({ squad }: { squad: SquadMember[] }) {
  if (squad.length === 0) {
    return <p style={{ color: 'var(--text-muted)' }}>Chưa có cầu thủ nào trong đội hình.</p>;
  }

  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 'var(--ptx-space-2)' }}>
      {squad.map((player) => {
        const content = (
          <>
            <span>{player.name}</span>
            <span style={{ color: 'var(--text-muted)' }}>{POSITION_LABELS[player.position]}</span>
          </>
        );
        const itemStyle: React.CSSProperties = {
          display: 'flex',
          justifyContent: 'space-between',
          padding: 'var(--ptx-space-2) var(--ptx-space-3)',
          borderRadius: 'var(--ptx-radius-sm)',
          background: 'var(--surface-page)',
          textDecoration: 'none',
          color: 'inherit',
        };

        return (
          <li key={player.id}>
            {player.legacyId != null ? (
              <Link href={ROUTES.player(player.legacyId)} style={itemStyle}>
                {content}
              </Link>
            ) : (
              <div style={itemStyle}>{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
