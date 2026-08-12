import { createSupabaseServerClient } from '@/services/database/client-server';
import { listPredictions, getPredictionByTicketCode } from '@/services/database/predictions.db';
import { listMatches, listMatchScores } from '@/services/database/matches.db';
import { listPlayerStats } from '@/services/database/players.db';
import { scorePrediction } from '@/domain/prediction/scoring-rules';
import type { PredictionRow } from '@/services/database/types';

export type LeaderboardEntry = {
  id: string;
  displayName: string;
  ticketCode: string;
  points: number;
};

async function getActualResultsContext() {
  const supabase = await createSupabaseServerClient();
  const [matches, scores, playerStats] = await Promise.all([
    listMatches(supabase),
    listMatchScores(supabase),
    listPlayerStats(supabase),
  ]);

  const scoresByMatchId = new Map(scores.map((s) => [s.match_id, s]));
  // Only finished matches have a meaningful "actual result" to score against.
  const resultsByLegacyId = new Map(
    matches
      .filter((m) => m.status === 'finished' && m.legacy_id != null)
      .map((m) => {
        const score = scoresByMatchId.get(m.id);
        return [String(m.legacy_id), { homeScore: score?.home_score ?? 0, awayScore: score?.away_score ?? 0 }] as const;
      })
  );

  const topScorer = [...playerStats].sort((a, b) => b.goals - a.goals)[0];
  const topMvp = [...playerStats].sort((a, b) => b.mvp_count - a.mvp_count)[0];

  return {
    resultsByLegacyId,
    actualGoldenBootId: topScorer && topScorer.goals > 0 ? topScorer.player_id : null,
    actualMvpId: topMvp && topMvp.mvp_count > 0 ? topMvp.player_id : null,
  };
}

function calculatePoints(
  prediction: PredictionRow,
  resultsByLegacyId: Map<string, { homeScore: number; awayScore: number }>,
  actualGoldenBootId: string | null,
  actualMvpId: string | null
): number {
  const matchedEntries = Object.entries(prediction.picks).filter(([legacyId]) => resultsByLegacyId.has(legacyId));

  return scorePrediction({
    matchPredictions: matchedEntries.map(([, guess]) => guess),
    matchResults: matchedEntries.map(([legacyId]) => resultsByLegacyId.get(legacyId)!),
    predictedMvpId: prediction.mvp_player_id,
    actualMvpId,
    predictedGoldenBootId: prediction.golden_boot_player_id,
    actualGoldenBootId,
  });
}

export async function getPredictionLeaderboard(): Promise<LeaderboardEntry[]> {
  const supabase = await createSupabaseServerClient();
  const [predictions, { resultsByLegacyId, actualGoldenBootId, actualMvpId }] = await Promise.all([
    listPredictions(supabase),
    getActualResultsContext(),
  ]);

  return predictions
    .map((p) => ({
      id: p.id,
      displayName: p.display_name,
      ticketCode: p.ticket_code,
      points: calculatePoints(p, resultsByLegacyId, actualGoldenBootId, actualMvpId),
    }))
    .sort((a, b) => b.points - a.points);
}

export async function getPredictionByTicket(ticketCode: string): Promise<{ prediction: PredictionRow; points: number } | null> {
  const supabase = await createSupabaseServerClient();
  const [prediction, { resultsByLegacyId, actualGoldenBootId, actualMvpId }] = await Promise.all([
    getPredictionByTicketCode(supabase, ticketCode),
    getActualResultsContext(),
  ]);
  if (!prediction) return null;

  return { prediction, points: calculatePoints(prediction, resultsByLegacyId, actualGoldenBootId, actualMvpId) };
}
