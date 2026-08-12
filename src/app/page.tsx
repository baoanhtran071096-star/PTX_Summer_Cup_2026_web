import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { StandingsTable } from '@/features/standings/components/StandingsTable';
import { MatchCard } from '@/features/matches/components/MatchCard';
import { getStandings } from '@/features/standings/queries';
import { getFinishedMatches, getAllMatches } from '@/features/matches/queries';
import { getAllPlayersWithStats } from '@/features/players/queries';
import { ROUTES } from '@/constants/routes';

export const dynamic = 'force-dynamic';

/**
 * Trang chủ dựng hoàn toàn từ dữ liệu thật, không có chuỗi ghi cứng nào.
 *
 * Mọi con số ở đây đều suy ra từ `match_events` qua các query đã có sẵn — cùng nguồn với
 * trang BXH và trang Thống kê. Đó là chủ ý: bản trước của dự án này từng có trang chủ và
 * trang BXH nói hai con số khác nhau vì mỗi nơi tự tính một kiểu.
 */
export default async function HomePage() {
  const [standings, finishedMatches, allMatches, players] = await Promise.all([
    getStandings(),
    getFinishedMatches(),
    getAllMatches(),
    getAllPlayersWithStats(),
  ]);

  const champion = standings[0] ?? null;
  const totalGoals = standings.reduce((sum, row) => sum + row.goalsFor, 0);
  const topScorer = [...players].sort((a, b) => b.stats.goals - a.stats.goals)[0] ?? null;
  const isFinished = allMatches.length > 0 && finishedMatches.length === allMatches.length;

  return (
    <>
      <Header />
      <main style={{ padding: 'var(--ptx-space-8)', display: 'grid', gap: 'var(--ptx-space-8)' }}>
        {/* ---------- Hero ---------- */}
        <section
          style={{
            padding: 'var(--ptx-space-8)',
            borderRadius: 'var(--radius-card)',
            background: 'var(--surface-elevated)',
            border: '1px solid var(--border-color)',
            display: 'grid',
            gap: 'var(--ptx-space-4)',
          }}
        >
          <p
            style={{
              margin: 0,
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            {isFinished ? '🏁 Giải đấu đã kết thúc' : `Đã đấu ${finishedMatches.length}/${allMatches.length} trận`}
          </p>

          <h1 style={{ margin: 0, fontFamily: 'var(--ptx-font-logo)', color: 'var(--text-primary)' }}>
            PTX Summer Cup 2026
          </h1>

          {/* Nhà vô địch chỉ hiện khi giải đã xong. Trước đó, đội đứng đầu mới là "dẫn
              đầu" — gọi sớm là nói sai kết quả cho người đọc. */}
          {champion && (
            <p style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>
              {isFinished ? '🏆 Vô địch: ' : '⚡ Dẫn đầu: '}
              <strong style={{ color: `var(--ptx-team-${champion.teamId === 'p' ? 'phoenix' : champion.teamId === 't' ? 'tiger' : 'xiphias'})` }}>
                {champion.teamName}
              </strong>{' '}
              <span style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
                — {champion.points} điểm
              </span>
            </p>
          )}

          <dl
            style={{
              margin: 0,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: 'var(--ptx-space-4)',
            }}
          >
            <Stat label="Trận đã đấu" value={`${finishedMatches.length}/${allMatches.length}`} />
            <Stat label="Bàn thắng" value={String(totalGoals)} />
            <Stat label="Đội tham dự" value={String(standings.length)} />
            <Stat
              label="Vua phá lưới"
              value={topScorer ? `${topScorer.name} (${topScorer.stats.goals})` : '—'}
            />
          </dl>
        </section>

        {/* ---------- Bảng xếp hạng ---------- */}
        <section style={{ display: 'grid', gap: 'var(--ptx-space-4)' }}>
          <SectionHead title="Bảng xếp hạng" href={ROUTES.standings} />
          <StandingsTable rows={standings} />
        </section>

        {/* ---------- Kết quả ---------- */}
        {finishedMatches.length > 0 && (
          <section style={{ display: 'grid', gap: 'var(--ptx-space-4)' }}>
            <SectionHead title="Kết quả" href={ROUTES.results} />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 'var(--ptx-space-4)',
              }}
            >
              {finishedMatches.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <dt style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>{label}</dt>
      <dd
        style={{
          margin: 'var(--ptx-space-1) 0 0',
          fontSize: '1.35rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
        }}
      >
        {value}
      </dd>
    </Card>
  );
}

function SectionHead({ title, href }: { title: string; href: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 'var(--ptx-space-4)' }}>
      <h2 style={{ margin: 0, fontFamily: 'var(--ptx-font-logo)', color: 'var(--text-primary)' }}>{title}</h2>
      <Link href={href} style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        Xem đầy đủ →
      </Link>
    </div>
  );
}
