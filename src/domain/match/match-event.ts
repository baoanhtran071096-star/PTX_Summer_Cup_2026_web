import type { MatchEventType } from './match.entity';

const MIN_MINUTE = 0;
const MAX_MINUTE = 120;

export function isValidEventMinute(minute: number): boolean {
  return Number.isInteger(minute) && minute >= MIN_MINUTE && minute <= MAX_MINUTE;
}

/** Events that must reference a specific player — a goal/card without a scorer/offender isn't meaningful. */
const EVENT_TYPES_REQUIRING_PLAYER: MatchEventType[] = ['goal', 'assist', 'yellow_card', 'red_card', 'mvp'];

export function eventTypeRequiresPlayer(eventType: MatchEventType): boolean {
  return EVENT_TYPES_REQUIRING_PLAYER.includes(eventType);
}
