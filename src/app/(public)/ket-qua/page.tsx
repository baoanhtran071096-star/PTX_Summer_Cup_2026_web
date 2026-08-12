import { getFinishedMatches } from '@/features/matches/queries';
import { MatchCard } from '@/features/matches/components/MatchCard';
import { LiveRefresher } from '@/components/common/LiveRefresher';

export const metadata = { title: 'Kết quả — PTX Summer Cup 2026' };
export const dynamic = 'force-dynamic';

export default async function ResultsPage() {
  const matches = await getFinishedMatches();

  return (
    <main style={{ padding: 'var(--ptx-space-8)' }}>
      <LiveRefresher />
      <h1 style={{ fontFamily: 'var(--ptx-font-logo)' }}>Kết quả</h1>
      {matches.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>Chưa có trận đấu nào kết thúc.</p>
      ) : (
        <div style={{ display: 'grid', gap: 'var(--ptx-space-4)', maxWidth: '640px' }}>
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </main>
  );
}
