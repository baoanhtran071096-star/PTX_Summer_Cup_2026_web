import { getAllMatches } from '@/features/matches/queries';
import { MatchCard } from '@/features/matches/components/MatchCard';
import { LiveRefresher } from '@/components/common/LiveRefresher';

export const metadata = { title: 'Lịch thi đấu — PTX Summer Cup 2026' };
export const dynamic = 'force-dynamic';

export default async function SchedulePage() {
  const matches = await getAllMatches();

  return (
    <main style={{ padding: 'var(--ptx-space-8)' }}>
      <LiveRefresher />
      <h1 style={{ fontFamily: 'var(--ptx-font-logo)' }}>Lịch thi đấu</h1>
      <div style={{ display: 'grid', gap: 'var(--ptx-space-4)', maxWidth: '640px' }}>
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </div>
    </main>
  );
}
