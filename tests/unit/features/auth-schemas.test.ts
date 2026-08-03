import { describe, it, expect } from 'vitest';
import { loginSchema } from '@/features/auth/schemas';

describe('loginSchema', () => {
  it('accepts a valid email + password', () => {
    const result = loginSchema.safeParse({ email: 'admin@ptxsummercup.example', password: 'strongpass' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'strongpass' });
    expect(result.success).toBe(false);
  });

  it('rejects a password shorter than 6 characters', () => {
    const result = loginSchema.safeParse({ email: 'admin@ptxsummercup.example', password: '123' });
    expect(result.success).toBe(false);
  });
});
