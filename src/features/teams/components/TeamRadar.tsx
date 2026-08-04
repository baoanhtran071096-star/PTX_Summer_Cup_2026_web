import { RadarChart } from '@/components/ui/RadarChart';
import type { TeamAttributes } from '@/domain/team/team.entity';

const MAX_ATTRIBUTE = 99;

export function TeamRadar({ stats, color }: { stats: TeamAttributes; color: string }) {
  return (
    <RadarChart
      max={MAX_ATTRIBUTE}
      color={color}
      ariaLabel="Biểu đồ chỉ số đội"
      axes={[
        { key: 'attack', label: 'Tấn công', value: stats.attack },
        { key: 'defense', label: 'Phòng ngự', value: stats.defense },
        { key: 'speed', label: 'Tốc độ', value: stats.speed },
        { key: 'power', label: 'Thể lực', value: stats.power },
      ]}
    />
  );
}
