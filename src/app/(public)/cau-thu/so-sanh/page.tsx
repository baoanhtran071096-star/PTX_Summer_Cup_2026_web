import { getPlayersForCompare } from '@/features/players/queries';
import { PlayerCompare } from '@/features/players/components/PlayerCompare';

export const metadata = { title: 'So sánh cầu thủ — PTX Summer Cup 2026' };
export const dynamic = 'force-dynamic';

type PageProps = { searchParams: Promise<{ a?: string; b?: string }> };

export default async function ComparePlayersPage({ searchParams }: PageProps) {
  const { a, b } = await searchParams;
  const slugs = [a, b].filter((s): s is string => Boolean(s));
  const players = await getPlayersForCompare(slugs);

  return (
    <main style={{ padding: 'var(--ptx-space-8)' }}>
      <h1 style={{ fontFamily: 'var(--ptx-font-logo)' }}>So sánh cầu thủ</h1>
      <PlayerCompare players={players} />
    </main>
  );
}
