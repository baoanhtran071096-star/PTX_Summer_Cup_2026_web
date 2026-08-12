import type { Team } from '@/domain/team/team.entity';

export type SquadMember = {
  id: string;
  legacyId: number | null;
  name: string;
  position: 'FW' | 'MF' | 'DF' | 'GK';
  avatarPath: string | null;
  avatarUrl: string | null;
};

export type TeamWithSquad = Team & {
  /** Resolved Supabase Storage public URL — null until M09 upload runs. */
  logoUrl: string | null;
  squad: SquadMember[];
};
