import { describe, it, expect } from 'vitest';
import { updateTeamSchema, updatePlayerSchema, updateUserRoleSchema } from '@/features/admin/schemas';

describe('updateTeamSchema', () => {
  it('coerces string form-data values into numbers', () => {
    const result = updateTeamSchema.parse({
      teamId: 'p',
      captainName: 'Anh Trương',
      attack: '92',
      defense: '88',
      speed: '90',
      power: '85',
    });
    expect(result).toEqual({ teamId: 'p', captainName: 'Anh Trương', attack: 92, defense: 88, speed: 90, power: 85 });
  });

  it('rejects an out-of-range attribute even as a string', () => {
    expect(() =>
      updateTeamSchema.parse({ teamId: 'p', captainName: '', attack: '150', defense: '88', speed: '90', power: '85' })
    ).toThrow();
  });
});

describe('updatePlayerSchema', () => {
  it('rejects an invalid position', () => {
    const result = updatePlayerSchema.safeParse({
      playerId: '11111111-1111-1111-1111-111111111111',
      name: 'Test',
      teamId: 'p',
      position: 'ST',
    });
    expect(result.success).toBe(false);
  });
});

describe('updateUserRoleSchema', () => {
  it('rejects a role outside admin/viewer', () => {
    const result = updateUserRoleSchema.safeParse({
      profileId: '11111111-1111-1111-1111-111111111111',
      role: 'superadmin',
    });
    expect(result.success).toBe(false);
  });
});
