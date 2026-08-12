import { getAllMatches } from '@/features/matches/queries';
import { getAllPlayersWithStats } from '@/features/players/queries';
import { getPredictionLeaderboard } from '@/features/predictions/queries';
import { PredictionForm } from '@/features/predictions/components/PredictionForm';
import { PredictionLeaderboard } from '@/features/predictions/components/PredictionLeaderboard';

export const metadata = { title: 'Dự đoán — PTX Summer Cup 2026' };
export const dynamic = 'force-dynamic';

export default async function PredictionsPage() {
  const [matches, players, leaderboard] = await Promise.all([
    getAllMatches(),
    getAllPlayersWithStats(),
    getPredictionLeaderboard(),
  ]);

  const matchOptions = matches
    .filter((m): m is typeof m & { legacyId: number } => m.legacyId != null)
    .map((m) => ({ legacyId: m.legacyId, homeTeamName: m.homeTeamName, awayTeamName: m.awayTeamName }));
  const playerOptions = players.map((p) => ({ id: p.id, name: p.name }));

  return (
    <main style={{ padding: 'var(--ptx-space-8)', display: 'grid', gap: 'var(--ptx-space-8)', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
      <section>
        <h1 style={{ fontFamily: 'var(--ptx-font-logo)' }}>Dự đoán kết quả</h1>
        <PredictionForm matches={matchOptions} players={playerOptions} />
      </section>
      <section>
        <h2 style={{ fontFamily: 'var(--ptx-font-title)' }}>Bảng xếp hạng dự đoán</h2>
        <PredictionLeaderboard entries={leaderboard} />
      </section>
    </main>
  );
}
