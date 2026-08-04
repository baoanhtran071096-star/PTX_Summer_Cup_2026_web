import { getAllTeamsWithSquads } from '@/features/teams/queries';
import { TeamCard } from '@/features/teams/components/TeamCard';

export const metadata = { title: 'Đội bóng — PTX Summer Cup 2026' };
// Live tournament data — never statically cached against a running tournament.
export const dynamic = 'force-dynamic';

export default async function TeamsPage() {
  const teams = await getAllTeamsWithSquads();

  return (
    <main style={{ padding: 'var(--ptx-space-8)' }}>
      <h1 style={{ fontFamily: 'var(--ptx-font-logo)' }}>Đội bóng</h1>
      <div style={{ display: 'grid', gap: 'var(--ptx-space-4)', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {teams.map((team) => (
          <TeamCard key={team.id} team={team} />
        ))}
      </div>
    </main>
  );
}
