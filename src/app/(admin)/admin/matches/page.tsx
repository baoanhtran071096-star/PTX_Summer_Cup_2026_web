import { getAllMatches, getMatchDetailByLegacySlug } from '@/features/matches/queries';
import { getAllPlayersWithStats } from '@/features/players/queries';
import { recordMatchEventAction, setMatchStatusAction } from '@/features/matches/actions';
import { MATCH_STATUS_LABELS } from '@/domain/match/match-status';
import { MatchTimeline } from '@/features/matches/components/MatchTimeline';

export const dynamic = 'force-dynamic';

const EVENT_TYPES = ['goal', 'own_goal', 'assist', 'yellow_card', 'red_card', 'mvp'] as const;
const NEXT_STATUS: Record<string, string | null> = { scheduled: 'live', live: 'finished', finished: null, postponed: 'scheduled' };

export default async function AdminMatchesPage() {
  const [matches, players] = await Promise.all([getAllMatches(), getAllPlayersWithStats()]);
  const details = await Promise.all(
    matches.filter((m) => m.legacyId != null).map((m) => getMatchDetailByLegacySlug(String(m.legacyId)))
  );

  return (
    <div style={{ display: 'grid', gap: 'var(--ptx-space-8)' }}>
      <h1>Điều khiển trận đấu</h1>
      {details.map((match) => {
        const nextStatus = NEXT_STATUS[match.status];
        return (
          <div key={match.id} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--ptx-radius-md)', padding: 'var(--ptx-space-4)', maxWidth: '640px' }}>
            <h2 style={{ margin: 0 }}>
              {match.homeTeamName} vs {match.awayTeamName} — {MATCH_STATUS_LABELS[match.status]}
            </h2>

            {nextStatus ? (
              <form action={setMatchStatusAction} style={{ margin: 'var(--ptx-space-2) 0' }}>
                <input type="hidden" name="matchId" value={match.id} />
                <input type="hidden" name="status" value={nextStatus} />
                <button type="submit">Chuyển sang &quot;{MATCH_STATUS_LABELS[nextStatus as keyof typeof MATCH_STATUS_LABELS]}&quot;</button>
              </form>
            ) : null}

            <form action={recordMatchEventAction} style={{ display: 'flex', gap: 'var(--ptx-space-2)', flexWrap: 'wrap', alignItems: 'center', margin: 'var(--ptx-space-3) 0' }}>
              <input type="hidden" name="matchId" value={match.id} />
              <select name="teamId" required defaultValue="">
                <option value="" disabled>
                  Đội
                </option>
                <option value={match.homeTeamId}>{match.homeTeamName}</option>
                <option value={match.awayTeamId}>{match.awayTeamName}</option>
              </select>
              <select name="eventType" required defaultValue="">
                <option value="" disabled>
                  Sự kiện
                </option>
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <select name="playerId" defaultValue="">
                <option value="">(không có cầu thủ)</option>
                {players
                  .filter((p) => p.teamId === match.homeTeamId || p.teamId === match.awayTeamId)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
              <input type="number" name="minute" min={0} max={120} placeholder="Phút" required style={{ width: '4rem' }} />
              <button type="submit">Ghi nhận</button>
            </form>

            <MatchTimeline events={match.events} />
          </div>
        );
      })}
    </div>
  );
}
