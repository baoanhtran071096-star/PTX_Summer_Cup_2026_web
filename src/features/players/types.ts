import type { Player, PlayerPerformanceStats } from '@/domain/player/player.entity';

export type PlayerWithStats = Player & {
  teamName: string;
  stats: PlayerPerformanceStats;
  rating: number;
};
