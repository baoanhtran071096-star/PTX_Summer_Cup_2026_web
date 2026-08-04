import type { SupabaseClient } from '@supabase/supabase-js';
import { InfrastructureError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import type { AuditLogRow } from './types';

export async function listAuditLog(client: SupabaseClient, limit = 50): Promise<AuditLogRow[]> {
  const { data, error } = await client
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new InfrastructureError(`Failed to list audit log: ${error.message}`, error);
  return data as AuditLogRow[];
}

/** Best-effort — an audit-log write failure must never block the admin action it's recording. */
export async function recordAuditLog(
  client: SupabaseClient,
  entry: { actorId: string | null; action: string; entityType: string; entityId?: string; metadata?: Record<string, unknown> }
): Promise<void> {
  try {
    const { error } = await client.from('audit_log').insert({
      actor_id: entry.actorId,
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId ?? null,
      metadata: entry.metadata ?? null,
    });
    if (error) {
      logger.error('Audit log write failed', { action: entry.action, entityType: entry.entityType, error: error.message });
    }
  } catch (err) {
    logger.error('Audit log write threw', { err: err instanceof Error ? err.message : String(err) });
  }
}
