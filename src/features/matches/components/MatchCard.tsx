import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { ROUTES } from '@/constants/routes';
import { Scoreboard } from './Scoreboard';
import type { MatchWithTeams } from '../types';

export function MatchCard({ match }: { match: MatchWithTeams }) {
  if (match.legacyId == null) return null;

  return (
    <Link href={ROUTES.match(match.legacyId)} style={{ textDecoration: 'none', color: 'inherit' }}>
      <Card>
        <p style={{ margin: '0 0 var(--ptx-space-2)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {match.matchDate} · {match.startTime.slice(0, 5)}–{match.endTime.slice(0, 5)}
        </p>
        <Scoreboard match={match} />
      </Card>
    </Link>
  );
}
