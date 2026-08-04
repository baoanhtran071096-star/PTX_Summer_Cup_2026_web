import { describe, it, expect } from 'vitest';
import { canTransitionMatchStatus } from '@/domain/match/match-status';
import { isValidEventMinute, eventTypeRequiresPlayer } from '@/domain/match/match-event';

describe('canTransitionMatchStatus', () => {
  it('allows scheduled -> live', () => {
    expect(canTransitionMatchStatus('scheduled', 'live')).toBe(true);
  });

  it('allows live -> finished', () => {
    expect(canTransitionMatchStatus('live', 'finished')).toBe(true);
  });

  it('rejects skipping scheduled -> finished directly', () => {
    expect(canTransitionMatchStatus('scheduled', 'finished')).toBe(false);
  });

  it('rejects going backward from finished', () => {
    expect(canTransitionMatchStatus('finished', 'live')).toBe(false);
  });

  it('rejects a same-state transition', () => {
    expect(canTransitionMatchStatus('live', 'live')).toBe(false);
  });

  it('allows postponed -> scheduled (reschedule)', () => {
    expect(canTransitionMatchStatus('postponed', 'scheduled')).toBe(true);
  });
});

describe('isValidEventMinute', () => {
  it('accepts minutes within 0-120', () => {
    expect(isValidEventMinute(45)).toBe(true);
    expect(isValidEventMinute(0)).toBe(true);
    expect(isValidEventMinute(120)).toBe(true);
  });

  it('rejects negative or out-of-range minutes', () => {
    expect(isValidEventMinute(-1)).toBe(false);
    expect(isValidEventMinute(121)).toBe(false);
  });

  it('rejects non-integer minutes', () => {
    expect(isValidEventMinute(45.5)).toBe(false);
  });
});

describe('eventTypeRequiresPlayer', () => {
  it('requires a player for goal/assist/cards/mvp', () => {
    expect(eventTypeRequiresPlayer('goal')).toBe(true);
    expect(eventTypeRequiresPlayer('assist')).toBe(true);
    expect(eventTypeRequiresPlayer('yellow_card')).toBe(true);
    expect(eventTypeRequiresPlayer('red_card')).toBe(true);
    expect(eventTypeRequiresPlayer('mvp')).toBe(true);
  });

  it('does not require a player for an own goal (scored against the team, not by a specific attributed player)', () => {
    expect(eventTypeRequiresPlayer('own_goal')).toBe(false);
  });
});
