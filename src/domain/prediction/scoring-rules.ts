/**
 * R25 never actually computed real prediction scoring — predictions
 * were client-only and never server-validated against results
 * (r25-data-inventory.md §1.8); `SAMPLE_PREDICTIONS.points` was fake
 * demo data, not a real scoring engine. This is genuinely new domain
 * logic, not a port — documented as a transparent v1 ruleset.
 */
export type MatchPrediction = { homeScore: number; awayScore: number };
export type MatchResult = { homeScore: number; awayScore: number };

const POINTS_EXACT_SCORE = 5;
const POINTS_CORRECT_OUTCOME = 2;
const POINTS_MVP_CORRECT = 3;
const POINTS_GOLDEN_BOOT_CORRECT = 3;

function outcome(homeScore: number, awayScore: number): 'home' | 'away' | 'draw' {
  if (homeScore > awayScore) return 'home';
  if (homeScore < awayScore) return 'away';
  return 'draw';
}

export function scoreMatchPrediction(prediction: MatchPrediction, result: MatchResult): number {
  if (prediction.homeScore === result.homeScore && prediction.awayScore === result.awayScore) {
    return POINTS_EXACT_SCORE;
  }
  if (outcome(prediction.homeScore, prediction.awayScore) === outcome(result.homeScore, result.awayScore)) {
    return POINTS_CORRECT_OUTCOME;
  }
  return 0;
}

export function scorePrediction(params: {
  matchPredictions: MatchPrediction[];
  matchResults: MatchResult[];
  predictedMvpId: string | null;
  actualMvpId: string | null;
  predictedGoldenBootId: string | null;
  actualGoldenBootId: string | null;
}): number {
  const { matchPredictions, matchResults, predictedMvpId, actualMvpId, predictedGoldenBootId, actualGoldenBootId } =
    params;

  let total = 0;
  const count = Math.min(matchPredictions.length, matchResults.length);
  for (let i = 0; i < count; i++) {
    total += scoreMatchPrediction(matchPredictions[i]!, matchResults[i]!);
  }

  if (predictedMvpId && actualMvpId && predictedMvpId === actualMvpId) total += POINTS_MVP_CORRECT;
  if (predictedGoldenBootId && actualGoldenBootId && predictedGoldenBootId === actualGoldenBootId) {
    total += POINTS_GOLDEN_BOOT_CORRECT;
  }

  return total;
}
