/** Pure TypeScript — no React/Next.js/Supabase/browser APIs (Architecture v1.3 §3). */

export type MatchStatus = 'scheduled' | 'live' | 'finished' | 'postponed';

export type Match = {
  id: string;
  legacyId: number | null;
  homeTeamId: string;
  awayTeamId: string;
  matchDate: string;
  startTime: string;
  endTime: string;
  status: MatchStatus;
  homeScore: number;
  awayScore: number;
};

export type MatchEventType = 'goal' | 'own_goal' | 'assist' | 'yellow_card' | 'red_card' | 'mvp';

export type MatchEvent = {
  id: string;
  matchId: string;
  teamId: string;
  playerId: string | null;
  eventType: MatchEventType;
  minute: number;
};
