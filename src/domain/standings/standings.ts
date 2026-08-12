/** Pure TypeScript — no React/Next.js/Supabase/browser APIs (Architecture v1.3 §3). */

export type FinishedMatchResult = {
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
};

export type StandingsRow = {
  teamId: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};
