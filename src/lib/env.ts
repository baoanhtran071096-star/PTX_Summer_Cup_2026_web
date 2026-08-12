import { z } from 'zod';

/**
 * Environment contract. Fails fast at boot with a clear message rather
 * than surfacing a confusing runtime error deep in a Supabase call.
 */
const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  // AI Experience (M10) — optional. Provider-agnostic: any
  // OpenAI-chat-completions-compatible endpoint. AI is a capability,
  // not an architecture owner (docs/architecture §15) — the app must
  // function fully with this unset; only the assistant widget degrades.
  AI_PROVIDER_API_KEY: z.string().min(1).optional(),
  AI_PROVIDER_API_URL: z.string().url().optional(),
  AI_PROVIDER_MODEL: z.string().min(1).optional(),
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

export function isAiConfigured(): boolean {
  return Boolean(process.env.AI_PROVIDER_API_KEY && process.env.AI_PROVIDER_API_URL);
}

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    AI_PROVIDER_API_KEY: process.env.AI_PROVIDER_API_KEY,
    AI_PROVIDER_API_URL: process.env.AI_PROVIDER_API_URL,
    AI_PROVIDER_MODEL: process.env.AI_PROVIDER_MODEL,
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
