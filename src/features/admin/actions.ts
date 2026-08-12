'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/services/database/client-server';
import { requireAdminUserId } from '@/services/auth/session';
import { recordAuditLog } from '@/services/database/audit.db';
import { updateTournamentSettings } from '@/services/database/settings.db';
import { updateTeam } from '@/services/database/teams.db';
import { updatePlayer } from '@/services/database/players.db';
import { deletePrediction } from '@/services/database/predictions.db';
import { updateProfileRole } from '@/services/database/profiles.db';
import { uploadMedia, type MediaBucket } from '@/services/storage/media';
import { isValidTeamAttributes } from '@/domain/team/rules';
import { ValidationError } from '@/lib/errors';
import {
  updateTournamentSettingsSchema,
  updateTeamSchema,
  updatePlayerSchema,
  deletePredictionSchema,
  updateUserRoleSchema,
  uploadMediaSchema,
} from './schemas';
import { ROUTES } from '@/constants/routes';

function formEntries(formData: FormData): Record<string, FormDataEntryValue> {
  return Object.fromEntries(formData.entries());
}

export async function updateTournamentSettingsAction(formData: FormData) {
  const actorId = await requireAdminUserId();
  const parsed = updateTournamentSettingsSchema.parse(formEntries(formData));

  const supabase = await createSupabaseServerClient();
  await updateTournamentSettings(supabase, parsed);
  await recordAuditLog(supabase, { actorId, action: 'update', entityType: 'tournament_settings' });

  revalidatePath(ROUTES.home);
  revalidatePath(ROUTES.admin);
}

export async function updateTeamAction(formData: FormData) {
  const actorId = await requireAdminUserId();
  const parsed = updateTeamSchema.parse(formEntries(formData));

  const stats = { attack: parsed.attack, defense: parsed.defense, speed: parsed.speed, power: parsed.power };
  if (!isValidTeamAttributes(stats)) {
    throw new ValidationError('Chỉ số đội phải nằm trong khoảng 0-99.');
  }

  const supabase = await createSupabaseServerClient();
  await updateTeam(supabase, parsed.teamId, { captainName: parsed.captainName || null, stats });
  await recordAuditLog(supabase, { actorId, action: 'update', entityType: 'team', entityId: parsed.teamId, metadata: stats });

  revalidatePath(ROUTES.teams);
  revalidatePath(ROUTES.team(parsed.teamId));
  revalidatePath('/admin/teams');
}

export async function updatePlayerAction(formData: FormData) {
  const actorId = await requireAdminUserId();
  const parsed = updatePlayerSchema.parse(formEntries(formData));

  const supabase = await createSupabaseServerClient();
  await updatePlayer(supabase, parsed.playerId, { name: parsed.name, teamId: parsed.teamId, position: parsed.position });
  await recordAuditLog(supabase, { actorId, action: 'update', entityType: 'player', entityId: parsed.playerId });

  revalidatePath(ROUTES.players);
  revalidatePath('/admin/players');
}

export async function deletePredictionAction(formData: FormData) {
  const actorId = await requireAdminUserId();
  const parsed = deletePredictionSchema.parse(formEntries(formData));

  const supabase = await createSupabaseServerClient();
  await deletePrediction(supabase, parsed.predictionId);
  await recordAuditLog(supabase, { actorId, action: 'delete', entityType: 'prediction', entityId: parsed.predictionId });

  revalidatePath(ROUTES.predictions);
  revalidatePath('/admin/predictions');
}

export async function uploadMediaAction(formData: FormData) {
  const actorId = await requireAdminUserId();
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    throw new ValidationError('Vui lòng chọn một tệp.');
  }

  const parsed = uploadMediaSchema.parse({ bucket: formData.get('bucket'), targetKey: formData.get('targetKey') });

  const supabase = await createSupabaseServerClient();
  await uploadMedia(supabase, parsed.bucket as MediaBucket, parsed.targetKey, file, file.type || 'application/octet-stream');
  await recordAuditLog(supabase, {
    actorId,
    action: 'upload',
    entityType: 'media',
    entityId: `${parsed.bucket}/${parsed.targetKey}`,
  });

  revalidatePath('/admin/media');
}

export async function updateUserRoleAction(formData: FormData) {
  const actorId = await requireAdminUserId();
  const parsed = updateUserRoleSchema.parse(formEntries(formData));

  const supabase = await createSupabaseServerClient();
  await updateProfileRole(supabase, parsed.profileId, parsed.role);
  await recordAuditLog(supabase, {
    actorId,
    action: 'update_role',
    entityType: 'profile',
    entityId: parsed.profileId,
    metadata: { role: parsed.role },
  });

  revalidatePath('/admin/users');
}
