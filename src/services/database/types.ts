/**
 * Hand-authored to match supabase/migrations/*.sql exactly.
 *
 * TODO(M01 follow-up): regenerate via
 *   `npx supabase gen types typescript --local`
 * once a local/linked Supabase instance is reachable (this session's
 * Docker Desktop did not finish initializing in time — see M01 gate
 * report for details) and diff against this file before trusting it
 * as the canonical source over the hand-authored version.
 */

export type ProfileRole = 'admin' | 'viewer';

export type ProfileRow = {
  id: string;
  username: string | null;
  display_name: string | null;
  role: ProfileRole;
  created_at: string;
};

export type TeamRow = {
  id: string;
  name: string;
  full_name: string;
  icon: string | null;
  color: string;
  captain_name: string | null;
  stats: { attack: number; defense: number; speed: number; power: number };
  ovr: number;
  logo_path: string | null;
  created_at: string;
  updated_at: string;
};

export type PlayerPosition = 'FW' | 'MF' | 'DF' | 'GK';

export type PlayerRow = {
  id: string;
  legacy_id: number | null;
  name: string;
  team_id: string;
  position: PlayerPosition;
  avatar_path: string | null;
  created_at: string;
  updated_at: string;
};

export type MatchStatus = 'scheduled' | 'live' | 'finished' | 'postponed';

export type MatchRow = {
  id: string;
  legacy_id: number | null;
  home_team_id: string;
  away_team_id: string;
  match_date: string;
  start_time: string;
  end_time: string;
  status: MatchStatus;
  created_at: string;
  updated_at: string;
};

export type MatchEventType = 'goal' | 'own_goal' | 'assist' | 'yellow_card' | 'red_card' | 'mvp';

export type MatchEventRow = {
  id: string;
  match_id: string;
  team_id: string;
  player_id: string | null;
  event_type: MatchEventType;
  minute: number;
  metadata: Record<string, unknown> | null;
  created_by: string | null;
  created_at: string;
};

export type MatchScoreRow = {
  match_id: string;
  home_score: number;
  away_score: number;
};

export type PlayerStatsRow = {
  player_id: string;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  mvp_count: number;
};

export type HallOfFameRow = {
  id: string;
  year: number;
  champion_team_id: string | null;
  runner_up_team_id: string | null;
  third_place_team_id: string | null;
  golden_boot_player_id: string | null;
  mvp_player_id: string | null;
};

export type PredictionPicks = Record<string, { homeScore: number; awayScore: number }>;

export type PredictionRow = {
  id: string;
  display_name: string;
  ticket_code: string;
  picks: PredictionPicks;
  mvp_player_id: string | null;
  golden_boot_player_id: string | null;
  submitted_by: string | null;
  created_at: string;
};

export type AuditLogRow = {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type TournamentSettingsRow = {
  slogan: string | null;
  message: string | null;
  event_date: string | null;
  location: string | null;
};
