import type { SupabaseClient } from '@supabase/supabase-js';
import { InfrastructureError } from '@/lib/errors';
import type { ProfileRow, ProfileRole } from './types';

export async function listProfiles(client: SupabaseClient): Promise<ProfileRow[]> {
  const { data, error } = await client.from('profiles').select('*').order('created_at');
  if (error) throw new InfrastructureError(`Failed to list profiles: ${error.message}`, error);
  return data as ProfileRow[];
}

export async function updateProfileRole(client: SupabaseClient, profileId: string, role: ProfileRole): Promise<void> {
  const { error } = await client.from('profiles').update({ role }).eq('id', profileId);
  if (error) throw new InfrastructureError(`Failed to update role for ${profileId}: ${error.message}`, error);
}
