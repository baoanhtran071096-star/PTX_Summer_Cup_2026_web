import { getAllPlayersWithStats } from '@/features/players/queries';
import { PlayerCard } from '@/features/players/components/PlayerCard';

export const metadata = { title: 'Cầu thủ — PTX Summer Cup 2026' };
export const dynamic = 'force-dynamic';

export default async function PlayersPage() {
  const players = await getAllPlayersWithStats();

  return (
    <main style={{ padding: 'var(--ptx-space-8)' }}>
      <h1 style={{ fontFamily: 'var(--ptx-font-logo)' }}>Cầu thủ</h1>
      <div style={{ display: 'grid', gap: 'var(--ptx-space-4)', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
        {players.map((player) => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </div>
    </main>
  );
}
