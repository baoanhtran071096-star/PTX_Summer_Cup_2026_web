import { getStandings } from '@/features/standings/queries';
import { getTopScorers, getTopAssists } from '@/features/statistics/queries';
import { getAllMatches } from '@/features/matches/queries';

/**
 * Builds a system-prompt context string from VERIFIED domain data only.
 * The AI explains this — it never generates or overrides standings,
 * scores, or ratings itself (docs/architecture §15/§16).
 */
export async function buildTournamentContext(): Promise<string> {
  const [standings, topScorers, topAssists, matches] = await Promise.all([
    getStandings(),
    getTopScorers(),
    getTopAssists(),
    getAllMatches(),
  ]);

  const standingsText = standings
    .map((r, i) => `${i + 1}. ${r.teamName}: ${r.points} điểm (${r.wins}T-${r.draws}H-${r.losses}B, HS ${r.goalDifference})`)
    .join('\n');

  const scorersText = topScorers.slice(0, 5).map((s) => `${s.playerName} (${s.teamName}): ${s.value} bàn`).join('\n');
  const assistsText = topAssists.slice(0, 5).map((s) => `${s.playerName} (${s.teamName}): ${s.value} kiến tạo`).join('\n');
  const matchesText = matches
    .map((m) => `${m.homeTeamName} vs ${m.awayTeamName}: ${m.status === 'scheduled' ? 'chưa đá' : `${m.homeScore}-${m.awayScore} (${m.status})`}`)
    .join('\n');

  return [
    'Bạn là trợ lý AI của PTX Summer Cup 2026, một giải bóng đá nội bộ.',
    'CHỈ được sử dụng dữ liệu xác thực dưới đây để trả lời — không được tự bịa thêm tỉ số, cầu thủ, hay thứ hạng không có trong dữ liệu.',
    'Nếu không có đủ dữ liệu để trả lời, hãy nói rõ là chưa có thông tin, đừng đoán.',
    '',
    '## Bảng xếp hạng hiện tại',
    standingsText || '(chưa có dữ liệu)',
    '',
    '## Vua phá lưới',
    scorersText || '(chưa có dữ liệu)',
    '',
    '## Vua kiến tạo',
    assistsText || '(chưa có dữ liệu)',
    '',
    '## Lịch thi đấu / kết quả',
    matchesText || '(chưa có dữ liệu)',
  ].join('\n');
}
