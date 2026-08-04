import { Card } from '@/components/ui/Card';
import { Scoreboard } from './Scoreboard';
import type { MatchWithTeams } from '../types';

export function MatchHeader({ match }: { match: MatchWithTeams }) {
  return (
    <Card>
      <p style={{ margin: '0 0 var(--ptx-space-4)', textAlign: 'center', color: 'var(--text-muted)' }}>
        {match.matchDate} · {match.startTime.slice(0, 5)}–{match.endTime.slice(0, 5)}
      </p>
      <Scoreboard match={match} />
    </Card>
  );
}
