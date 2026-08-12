import { MATCH_STATUS_LABELS } from '@/domain/match/match-status';
import type { MatchWithTeams } from '../types';

export function Scoreboard({ match }: { match: MatchWithTeams }) {
  const isLive = match.status === 'live';

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--ptx-space-4)' }}>
      <div style={{ textAlign: 'center', flex: 1 }}>
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: match.homeTeamColor, margin: '0 auto var(--ptx-space-2)' }} />
        <div style={{ fontFamily: 'var(--ptx-font-title)' }}>{match.homeTeamName}</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--ptx-font-logo)', fontSize: '2.5rem' }}>
          {match.status === 'scheduled' ? '—' : match.homeScore} : {match.status === 'scheduled' ? '—' : match.awayScore}
        </div>
        <div
          style={{
            fontSize: '0.8rem',
            color: isLive ? 'var(--status-live)' : 'var(--text-muted)',
            fontWeight: isLive ? 700 : 400,
          }}
        >
          {isLive ? '● ' : ''}
          {MATCH_STATUS_LABELS[match.status]}
        </div>
      </div>
      <div style={{ textAlign: 'center', flex: 1 }}>
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: match.awayTeamColor, margin: '0 auto var(--ptx-space-2)' }} />
        <div style={{ fontFamily: 'var(--ptx-font-title)' }}>{match.awayTeamName}</div>
      </div>
    </div>
  );
}
