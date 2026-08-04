import { createSupabaseServerClient } from '@/services/database/client-server';
import { listProfiles } from '@/services/database/profiles.db';
import { listAuditLog } from '@/services/database/audit.db';
import { getTournamentSettings } from '@/services/database/settings.db';
import type { ProfileRow, AuditLogRow, TournamentSettingsRow } from '@/services/database/types';

export async function getAllProfiles(): Promise<ProfileRow[]> {
  const supabase = await createSupabaseServerClient();
  return listProfiles(supabase);
}

export async function getRecentAuditLog(): Promise<AuditLogRow[]> {
  const supabase = await createSupabaseServerClient();
  return listAuditLog(supabase);
}

export async function getCurrentTournamentSettings(): Promise<TournamentSettingsRow | null> {
  const supabase = await createSupabaseServerClient();
  return getTournamentSettings(supabase);
}
