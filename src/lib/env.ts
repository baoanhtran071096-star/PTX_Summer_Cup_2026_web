import { z } from 'zod';

/**
 * Environment contract. Fails fast at boot with a clear message rather
 * than surfacing a confusing runtime error deep in a Supabase call.
 */
const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

/**
 * Non-throwing check for UI code paths that should degrade gracefully
 * (e.g. the admin layout showing a setup message) instead of crashing
 * with a raw stack trace before a Supabase project is provisioned.
 */
export function isSupabaseConfigured(): boolean {
  return envSchema
    .pick({ NEXT_PUBLIC_SUPABASE_URL: true, NEXT_PUBLIC_SUPABASE_ANON_KEY: true })
    .safeParse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    }).success;
}

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
  if (!parsed.success) {
    throw new Error(
      `Invalid/missing environment variables:\n${parsed.error.issues
        .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
        .join('\n')}`
    );
  }
  cached = parsed.data;
  return cached;
}
