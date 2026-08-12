import { getPlayerByLegacySlug, getAllPlayersWithStats } from '@/features/players/queries';
import { PlayerProfile } from '@/features/players/components/PlayerProfile';
import { calculateStatsMaxScale } from '@/domain/player/rules';

type PageProps = { params: Promise<{ slug: string }> };
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const player = await getPlayerByLegacySlug(slug);
  return { title: `${player.name} — PTX Summer Cup 2026` };
}

export default async function PlayerDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const [player, allPlayers] = await Promise.all([getPlayerByLegacySlug(slug), getAllPlayersWithStats()]);
  const maxScale = calculateStatsMaxScale(allPlayers.map((p) => p.stats));

  return (
    <main style={{ padding: 'var(--ptx-space-8)' }}>
      <PlayerProfile player={player} maxScale={maxScale} />
    </main>
  );
}
