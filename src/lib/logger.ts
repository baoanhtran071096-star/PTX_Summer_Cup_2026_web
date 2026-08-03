type Level = 'debug' | 'info' | 'warn' | 'error';

/**
 * Never log secrets, auth tokens, or credentials (docs/architecture §11).
 * Dev: writes to console. Production: swap the `write` implementation for
 * a real observability sink when one is provisioned (M13) — call sites
 * never need to change.
 */
function write(level: Level, message: string, meta?: Record<string, unknown>) {
  const line = { level, message, ...meta, timestamp: new Date().toISOString() };
  if (process.env.NODE_ENV === 'production' && level === 'debug') return;
  console[level === 'debug' ? 'log' : level](line);
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => write('debug', message, meta),
  info: (message: string, meta?: Record<string, unknown>) => write('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => write('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => write('error', message, meta),
};
