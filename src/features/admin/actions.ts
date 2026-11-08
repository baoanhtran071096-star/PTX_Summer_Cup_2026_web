'use server';

import { revalidatePath } from 'next/cache';
import { createUserScopedSupabaseClient } from '@/services/database/client-server';
import { requireAdminUserId } from '@/services/auth/session';
import { recordAuditLog } from '@/services/database/audit.db';
import { updateTournamentSettings } from '@/services/database/settings.db';
import { updateTeam } from '@/services/database/teams.db';
import { updatePlayer } from '@/services/database/players.db';
import { deletePrediction } from '@/services/database/predictions.db';
import { updateProfileRole } from '@/services/database/profiles.db';
import { uploadMedia, type MediaBucket } from '@/services/storage/media';
import { isValidTeamAttributes } from '@/domain/team/rules';
import { ValidationError, PtxError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import {
  updateTournamentSettingsSchema,
  updateTeamSchema,
  updatePlayerSchema,
  deletePredictionSchema,
  updateUserRoleSchema,
  uploadMediaSchema,
} from './schemas';
import { ROUTES } from '@/constants/routes';
import type { AdminActionState } from './action-state';

function formEntries(formData: FormData): Record<string, FormDataEntryValue> {
  return Object.fromEntries(formData.entries());
}

/**
 * Gói một thao tác quản trị thành trạng thái hiển thị được.
 *
 * Đặt ở MỘT chỗ để không action nào có thể "quên" báo kết quả — chính chỗ quên đó là thứ
 * khiến cả khu quản trị im lặng.
 */
async function runAdminAction(what: string, fn: () => Promise<string>): Promise<AdminActionState> {
  try {
    return { error: null, ok: await fn() };
  } catch (err) {
    const message = err instanceof PtxError ? err.message : `Không lưu được ${what}. Vui lòng thử lại.`;
    logger.warn('Admin action failed', { what, reason: err instanceof Error ? err.message : String(err) });
    return { error: message, ok: null };
  }
}

export async function updateTournamentSettingsAction(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  return runAdminAction('cài đặt giải đấu', async () => {
    const actorId = await requireAdminUserId();
    const parsed = updateTournamentSettingsSchema.parse(formEntries(formData));

    const supabase = await createUserScopedSupabaseClient();
    await updateTournamentSettings(supabase, parsed);
    await recordAuditLog(supabase, { actorId, action: 'update', entityType: 'tournament_settings' });

    revalidatePath(ROUTES.home);
    revalidatePath(ROUTES.admin);
    return 'Đã lưu cài đặt giải đấu.';
  });
}

export async function updateTeamAction(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  return runAdminAction('thông tin đội', async () => {
    const actorId = await requireAdminUserId();
    const parsed = updateTeamSchema.parse(formEntries(formData));

    const stats = { attack: parsed.attack, defense: parsed.defense, speed: parsed.speed, power: parsed.power };
    if (!isValidTeamAttributes(stats)) {
      throw new ValidationError('Chỉ số đội phải nằm trong khoảng 0-99.');
    }

    const supabase = await createUserScopedSupabaseClient();
    await updateTeam(supabase, parsed.teamId, { captainName: parsed.captainName || null, stats });
    await recordAuditLog(supabase, { actorId, action: 'update', entityType: 'team', entityId: parsed.teamId, metadata: stats });

    revalidatePath(ROUTES.teams);
    revalidatePath(ROUTES.team(parsed.teamId));
    revalidatePath('/admin/teams');
    return `Đã lưu đội ${parsed.teamId.toUpperCase()}.`;
  });
}

export async function updatePlayerAction(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  return runAdminAction('thông tin cầu thủ', async () => {
    const actorId = await requireAdminUserId();
    const parsed = updatePlayerSchema.parse(formEntries(formData));

    const supabase = await createUserScopedSupabaseClient();
    await updatePlayer(supabase, parsed.playerId, { name: parsed.name, teamId: parsed.teamId, position: parsed.position });
    await recordAuditLog(supabase, { actorId, action: 'update', entityType: 'player', entityId: parsed.playerId });

    revalidatePath(ROUTES.players);
    revalidatePath('/admin/players');
    return `Đã lưu cầu thủ ${parsed.name}.`;
  });
}

export async function deletePredictionAction(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  return runAdminAction('xoá phiếu dự đoán', async () => {
    const actorId = await requireAdminUserId();
    const parsed = deletePredictionSchema.parse(formEntries(formData));

    const supabase = await createUserScopedSupabaseClient();
    await deletePrediction(supabase, parsed.predictionId);
    await recordAuditLog(supabase, { actorId, action: 'delete', entityType: 'prediction', entityId: parsed.predictionId });

    revalidatePath(ROUTES.predictions);
    revalidatePath('/admin/predictions');
    return 'Đã xoá phiếu dự đoán.';
  });
}

export type UploadMediaState = { error: string | null; uploaded: string | null };

/** Khớp với serverActions.bodySizeLimit trong next.config.ts. */
const MAX_UPLOAD_MB = 10;

/**
 * Trả về trạng thái thay vì ném lỗi.
 *
 * Bản trước ném `ValidationError` và để lỗi hạ tầng nổi lên, nhưng form gọi nó không có
 * chỗ nào bắt và hiển thị. Hậu quả đo được: bấm "Tải lên" và KHÔNG có gì xảy ra — không
 * báo lỗi, không báo thành công, không cách nào biết vì sao. Mọi kiểu thất bại trông hệt
 * nhau: tệp quá lớn, sai định dạng, thiếu quyền, mạng hỏng.
 *
 * Đúng lớp lỗi đã dọn khỏi bản web cũ, chỉ khác chiều: bên kia là "báo thành công cho việc
 * chưa làm", bên này là "làm hỏng mà không báo gì".
 */
export async function uploadMediaAction(
  _prevState: UploadMediaState,
  formData: FormData
): Promise<UploadMediaState> {
  try {
    const actorId = await requireAdminUserId();

    const file = formData.get('file');
    if (!(file instanceof File) || file.size === 0) {
      return { error: 'Vui lòng chọn một tệp.', uploaded: null };
    }

    const parsed = uploadMediaSchema.safeParse({
      bucket: formData.get('bucket'),
      targetKey: formData.get('targetKey'),
    });
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ.', uploaded: null };
    }

    // Kiểm cỡ tệp ở đây để câu báo nói đúng nguyên nhân, thay vì trả về một lỗi hạ tầng
    // khó hiểu. Vượt hẳn bodySizeLimit thì request còn không tới được hàm này — đó là lý
    // do ngưỡng hai nơi phải bằng nhau.
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      return {
        error: `Tệp ${(file.size / 1024 / 1024).toFixed(1)} MB, vượt giới hạn ${MAX_UPLOAD_MB} MB. Hãy nén ảnh nhỏ lại rồi thử lại.`,
        uploaded: null,
      };
    }

    const supabase = await createUserScopedSupabaseClient();

    await uploadMedia(
      supabase,
      parsed.data.bucket as MediaBucket,
      parsed.data.targetKey,
      file,
      file.type || 'application/octet-stream'
    );
    await recordAuditLog(supabase, {
      actorId,
      action: 'upload',
      entityType: 'media',
      entityId: `${parsed.data.bucket}/${parsed.data.targetKey}`,
    });

    revalidatePath('/admin/media');
    return { error: null, uploaded: `${parsed.data.bucket}/${parsed.data.targetKey}` };
  } catch (err) {
    // Lỗi hạ tầng — Supabase từ chối kiểu tệp, thiếu quyền, mạng hỏng — cũng phải tới
    // được màn hình, không được chết lặng trong log máy chủ.
    const message = err instanceof PtxError ? err.message : 'Tải lên thất bại. Vui lòng thử lại.';
    logger.warn('Media upload failed', { reason: message });
    return { error: message, uploaded: null };
  }
}

export async function updateUserRoleAction(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  return runAdminAction('vai trò người dùng', async () => {
    const actorId = await requireAdminUserId();
    const parsed = updateUserRoleSchema.parse(formEntries(formData));

    const supabase = await createUserScopedSupabaseClient();
    await updateProfileRole(supabase, parsed.profileId, parsed.role);
    await recordAuditLog(supabase, {
      actorId,
      action: 'update_role',
      entityType: 'profile',
      entityId: parsed.profileId,
      metadata: { role: parsed.role },
    });

    revalidatePath('/admin/users');
    return `Đã đổi vai trò thành ${parsed.role}.`;
  });
}
