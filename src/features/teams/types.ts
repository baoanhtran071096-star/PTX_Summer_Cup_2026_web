import type { Team } from '@/domain/team/team.entity';

export type SquadMember = {
  id: string;
  legacyId: number | null;
  name: string;
  position: 'FW' | 'MF' | 'DF' | 'GK';
  avatarPath: string | null;
};

export type TeamWithSquad = Team & {
  squad: SquadMember[];
};
