import { getStandings } from '@/features/standings/queries';
import { StandingsTable } from '@/features/standings/components/StandingsTable';
import { LiveRefresher } from '@/components/common/LiveRefresher';

export const metadata = { title: 'Bảng xếp hạng — PTX Summer Cup 2026' };
export const dynamic = 'force-dynamic';

export default async function StandingsPage() {
  const rows = await getStandings();

  return (
    <main style={{ padding: 'var(--ptx-space-8)' }}>
      <LiveRefresher />
      <h1 style={{ fontFamily: 'var(--ptx-font-logo)' }}>Bảng xếp hạng</h1>
      <StandingsTable rows={rows} />
    </main>
  );
}
