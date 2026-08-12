import type { Match, MatchEvent } from '@/domain/match/match.entity';

export type MatchWithTeams = Match & {
  homeTeamName: string;
  homeTeamColor: string;
  awayTeamName: string;
  awayTeamColor: string;
};

export type MatchEventWithPlayer = MatchEvent & {
  playerName: string | null;
};

export type MatchDetail = MatchWithTeams & {
  events: MatchEventWithPlayer[];
};
