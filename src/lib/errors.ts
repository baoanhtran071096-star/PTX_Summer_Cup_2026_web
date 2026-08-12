/**
 * Error contract (docs/architecture §10). Four categories, one base class,
 * so route error boundaries / Server Action callers can discriminate via
 * `instanceof` without parsing strings.
 */

export abstract class PtxError extends Error {
  abstract readonly category: 'validation' | 'business' | 'infrastructure' | 'unexpected';

  constructor(message: string, override readonly cause?: unknown) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends PtxError {
  readonly category = 'validation' as const;
}

export class BusinessError extends PtxError {
  readonly category = 'business' as const;
}

export class InfrastructureError extends PtxError {
  readonly category = 'infrastructure' as const;
}

export class UnexpectedError extends PtxError {
  readonly category = 'unexpected' as const;
}

export function toPtxError(err: unknown): PtxError {
  if (err instanceof PtxError) return err;
  return new UnexpectedError(err instanceof Error ? err.message : String(err), err);
}
