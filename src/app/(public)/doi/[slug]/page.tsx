import { getTeamBySlug } from '@/features/teams/queries';
import { TeamProfile } from '@/features/teams/components/TeamProfile';

type PageProps = { params: Promise<{ slug: string }> };

// Live tournament data — never statically cached against a running tournament.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const team = await getTeamBySlug(slug);
  return { title: `${team.name} — PTX Summer Cup 2026` };
}

export default async function TeamDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const team = await getTeamBySlug(slug);

  return (
    <main style={{ padding: 'var(--ptx-space-8)' }}>
      <TeamProfile team={team} />
    </main>
  );
}
