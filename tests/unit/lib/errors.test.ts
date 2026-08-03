import { describe, it, expect } from 'vitest';
import { ValidationError, BusinessError, InfrastructureError, UnexpectedError, toPtxError } from '@/lib/errors';

describe('error contract', () => {
  it('assigns the correct category per subclass', () => {
    expect(new ValidationError('bad input').category).toBe('validation');
    expect(new BusinessError('rule violated').category).toBe('business');
    expect(new InfrastructureError('db down').category).toBe('infrastructure');
    expect(new UnexpectedError('???').category).toBe('unexpected');
  });

  it('toPtxError passes through existing PtxError instances unchanged', () => {
    const original = new BusinessError('already typed');
    expect(toPtxError(original)).toBe(original);
  });

  it('toPtxError wraps a plain Error as UnexpectedError', () => {
    const wrapped = toPtxError(new Error('native failure'));
    expect(wrapped).toBeInstanceOf(UnexpectedError);
    expect(wrapped.message).toBe('native failure');
  });

  it('toPtxError wraps a non-Error thrown value', () => {
    const wrapped = toPtxError('a thrown string');
    expect(wrapped).toBeInstanceOf(UnexpectedError);
    expect(wrapped.message).toBe('a thrown string');
  });
});
