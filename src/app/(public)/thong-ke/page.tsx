import { getTopScorers, getTopAssists } from '@/features/statistics/queries';
import { LeaderboardTable } from '@/features/statistics/components/LeaderboardTable';

export const metadata = { title: 'Thống kê — PTX Summer Cup 2026' };
export const dynamic = 'force-dynamic';

export default async function StatisticsPage() {
  const [topScorers, topAssists] = await Promise.all([getTopScorers(), getTopAssists()]);

  return (
    <main style={{ padding: 'var(--ptx-space-8)', display: 'grid', gap: 'var(--ptx-space-8)', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
      <LeaderboardTable title="Vua phá lưới" entries={topScorers} />
      <LeaderboardTable title="Vua kiến tạo" entries={topAssists} />
    </main>
  );
}
