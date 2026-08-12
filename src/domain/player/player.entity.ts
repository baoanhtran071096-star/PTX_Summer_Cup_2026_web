/** Pure TypeScript — no React/Next.js/Supabase/browser APIs (Architecture v1.3 §3). */

export type PlayerPosition = 'FW' | 'MF' | 'DF' | 'GK';

export type Player = {
  id: string;
  /** Stable, human-readable public identifier (used as the URL slug). */
  legacyId: number | null;
  name: string;
  teamId: string;
  position: PlayerPosition;
  avatarPath: string | null;
};

/** Always derived from match_events — never an independently-stored counter. */
export type PlayerPerformanceStats = {
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  mvpCount: number;
};
