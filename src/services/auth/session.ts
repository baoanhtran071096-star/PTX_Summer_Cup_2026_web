import { createSupabaseServerClient } from '@/services/database/client-server';
import { InfrastructureError, BusinessError } from '@/lib/errors';
import type { ProfileRow } from '@/services/database/types';

/**
 * Server-side only. Returns null when signed out — callers decide
 * whether that's an error (Rule 6: this is low-level data access,
 * not a route guard; route protection lives in middleware.ts / the
 * admin layout).
 */
export async function getCurrentProfile(): Promise<ProfileRow | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  if (error) throw new InfrastructureError(`Failed to load profile for ${user.id}: ${error.message}`, error);
  return data as ProfileRow | null;
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  const profile = await getCurrentProfile();
  return profile?.role === 'admin';
}

/** Throws a clear BusinessError instead of a raw RLS rejection; returns the admin's id for audit logging. */
export async function requireAdminUserId(message = 'Chỉ quản trị viên mới có thể thực hiện thao tác này.'): Promise<string> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') throw new BusinessError(message);
  return profile.id;
}
