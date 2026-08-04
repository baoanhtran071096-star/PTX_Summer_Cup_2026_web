import { describe, it, expect } from 'vitest';
import { calculateTeamOvr, isValidTeamAttributes } from '@/domain/team/rules';

describe('calculateTeamOvr', () => {
  it('matches the legacy R25 snapshot exactly for all 3 teams', () => {
    // docs/legacy/r25-data-inventory.md §1.1 — TEAMS_DATA (index.html:6302-6309)
    expect(calculateTeamOvr({ attack: 92, defense: 88, speed: 90, power: 85 })).toBe(89); // Phoenix
    expect(calculateTeamOvr({ attack: 88, defense: 85, speed: 80, power: 90 })).toBe(86); // Tiger
    expect(calculateTeamOvr({ attack: 85, defense: 90, speed: 95, power: 82 })).toBe(88); // Xiphias
  });

  it('rounds to the nearest integer', () => {
    expect(calculateTeamOvr({ attack: 100, defense: 100, speed: 100, power: 99 })).toBe(100);
  });
});

describe('isValidTeamAttributes', () => {
  it('accepts attributes within 0-99', () => {
    expect(isValidTeamAttributes({ attack: 92, defense: 88, speed: 90, power: 85 })).toBe(true);
  });

  it('rejects an out-of-range attribute', () => {
    expect(isValidTeamAttributes({ attack: 150, defense: 88, speed: 90, power: 85 })).toBe(false);
  });

  it('rejects a non-integer attribute', () => {
    expect(isValidTeamAttributes({ attack: 92.5, defense: 88, speed: 90, power: 85 })).toBe(false);
  });
});
