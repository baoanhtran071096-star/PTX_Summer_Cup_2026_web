import { z } from 'zod';
import { ValidationError } from './errors';

/**
 * Boundary validation helper. Use at Server Action / Route Handler
 * entry points — throws a typed ValidationError (not a raw ZodError)
 * so callers only ever need to handle PtxError subclasses.
 */
export function parseOrThrow<T extends z.ZodTypeAny>(schema: T, input: unknown): z.infer<T> {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new ValidationError(
      result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      result.error
    );
  }
  return result.data;
}

export { z };
