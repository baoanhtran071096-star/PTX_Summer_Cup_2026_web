import type { TeamAttributes } from './team.entity';

/**
 * OVR is a deterministic function of the four attributes — never an
 * independently-editable value (same "don't duplicate a source of
 * truth" principle as match/player stats, docs/migration/
 * r25-data-reconciliation-plan.md §3). Verified against the legacy
 * TEAMS_DATA snapshot: round(avg(92,88,90,85)) = 89 (Phoenix),
 * round(avg(88,85,80,90)) = 86 (Tiger), round(avg(85,90,95,82)) = 88
 * (Xiphias) — matches the stored legacy `ovr` values exactly.
 */
export function calculateTeamOvr(stats: TeamAttributes): number {
  const { attack, defense, speed, power } = stats;
  return Math.round((attack + defense + speed + power) / 4);
}

const MIN_ATTRIBUTE = 0;
const MAX_ATTRIBUTE = 99;

export function isValidTeamAttributes(stats: TeamAttributes): boolean {
  return Object.values(stats).every(
    (value) => Number.isInteger(value) && value >= MIN_ATTRIBUTE && value <= MAX_ATTRIBUTE
  );
}
