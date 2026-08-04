import type { MatchStatus } from './match.entity';

/**
 * Status is admin/referee-controlled, NOT derived from a client clock
 * — this is a deliberate MODERNIZE over R25, which computed live/
 * upcoming/finished purely from `Date.now()` vs. fixed kickoff times
 * with no persisted status and no server-authoritative clock
 * (docs/legacy/r25-state-inventory.md §3, r25-parity-matrix.md §2).
 */
const VALID_TRANSITIONS: Record<MatchStatus, MatchStatus[]> = {
  scheduled: ['live', 'postponed'],
  live: ['finished', 'postponed'],
  finished: [],
  postponed: ['scheduled'],
};

export function canTransitionMatchStatus(from: MatchStatus, to: MatchStatus): boolean {
  if (from === to) return false;
  return VALID_TRANSITIONS[from].includes(to);
}

export const MATCH_STATUS_LABELS: Record<MatchStatus, string> = {
  scheduled: 'Sắp diễn ra',
  live: 'Đang diễn ra',
  finished: 'Đã kết thúc',
  postponed: 'Hoãn',
};
