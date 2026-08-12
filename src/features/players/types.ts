import type { Player, PlayerPerformanceStats } from '@/domain/player/player.entity';

export type PlayerWithStats = Player & {
  teamName: string;
  stats: PlayerPerformanceStats;
  rating: number;
  /** Resolved Supabase Storage public URL — null until M09 upload runs. */
  avatarUrl: string | null;
};
