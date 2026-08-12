'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/services/database/client-server';
import { getMatchById } from '@/services/database/matches.db';
import { requireAdminUserId } from '@/services/auth/session';
import { recordAuditLog } from '@/services/database/audit.db';
import { isValidEventMinute, eventTypeRequiresPlayer } from '@/domain/match/match-event';
import { canTransitionMatchStatus } from '@/domain/match/match-status';
import { BusinessError, ValidationError } from '@/lib/errors';
import { recordMatchEventSchema, setMatchStatusSchema } from './schemas';
import { ROUTES } from '@/constants/routes';

/**
 * Core match-engine write capability. The admin UI that calls this
 * (forms, quick-goal buttons, etc.) is M11's responsibility — this
 * function is the actual engine logic, reusable from any admin
 * surface. RLS (M01) is the real enforcement layer; requireAdminUserId()
 * here only exists to fail with a clear message instead of a raw
 * Postgres RLS error (defense in depth, docs/architecture §9).
 */
export async function recordMatchEventAction(formData: FormData) {
  const actorId = await requireAdminUserId('Chỉ quản trị viên mới có thể ghi nhận sự kiện trận đấu.');

  const parsed = recordMatchEventSchema.parse(Object.fromEntries(formData.entries()));

  if (!isValidEventMinute(parsed.minute)) {
    throw new ValidationError('Phút ghi nhận không hợp lệ (0-120).');
  }
  if (eventTypeRequiresPlayer(parsed.eventType) && !parsed.playerId) {
    throw new ValidationError(`Sự kiện "${parsed.eventType}" cần chọn cầu thủ.`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('match_events').insert({
    match_id: parsed.matchId,
    team_id: parsed.teamId,
    player_id: parsed.playerId,
    event_type: parsed.eventType,
    minute: parsed.minute,
    created_by: actorId,
  });
  if (error) throw new BusinessError(`Không thể ghi nhận sự kiện: ${error.message}`, error);

  await recordAuditLog(supabase, {
    actorId,
    action: 'record_event',
    entityType: 'match_event',
    entityId: parsed.matchId,
    metadata: { eventType: parsed.eventType, minute: parsed.minute, playerId: parsed.playerId },
  });

  revalidatePath(ROUTES.schedule);
  revalidatePath(ROUTES.results);
}

export async function setMatchStatusAction(formData: FormData) {
  const actorId = await requireAdminUserId('Chỉ quản trị viên mới có thể thay đổi trạng thái trận đấu.');

  const parsed = setMatchStatusSchema.parse(Object.fromEntries(formData.entries()));
  const supabase = await createSupabaseServerClient();

  const current = await getMatchById(supabase, parsed.matchId);
  if (!current) throw new BusinessError(`Không tìm thấy trận đấu ${parsed.matchId}`);
  if (!canTransitionMatchStatus(current.status, parsed.status)) {
    throw new ValidationError(`Không thể chuyển trạng thái từ "${current.status}" sang "${parsed.status}".`);
  }

  const { error } = await supabase
    .from('matches')
    .update({ status: parsed.status })
    .eq('id', parsed.matchId);
  if (error) throw new BusinessError(`Không thể cập nhật trạng thái: ${error.message}`, error);

  await recordAuditLog(supabase, {
    actorId,
    action: 'set_status',
    entityType: 'match',
    entityId: parsed.matchId,
    metadata: { from: current.status, to: parsed.status },
  });

  revalidatePath(ROUTES.schedule);
  revalidatePath(ROUTES.results);
}
