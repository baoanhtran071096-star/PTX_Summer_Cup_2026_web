import { getMatchDetailByLegacySlug } from '@/features/matches/queries';
import { MatchHeader } from '@/features/matches/components/MatchHeader';
import { MatchTimeline } from '@/features/matches/components/MatchTimeline';
import { Card } from '@/components/ui/Card';
import { LiveRefresher } from '@/components/common/LiveRefresher';

type PageProps = { params: Promise<{ id: string }> };
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const match = await getMatchDetailByLegacySlug(id);
  return { title: `${match.homeTeamName} vs ${match.awayTeamName} — PTX Summer Cup 2026` };
}

export default async function MatchDetailPage({ params }: PageProps) {
  const { id } = await params;
  const match = await getMatchDetailByLegacySlug(id);

  return (
    <main style={{ padding: 'var(--ptx-space-8)', display: 'grid', gap: 'var(--ptx-space-6)', maxWidth: '640px' }}>
      <LiveRefresher matchId={match.id} />
      <MatchHeader match={match} />
      <Card>
        <h2 style={{ fontFamily: 'var(--ptx-font-title)', marginTop: 0 }}>Diễn biến trận đấu</h2>
        <MatchTimeline events={match.events} />
      </Card>
    </main>
  );
}
