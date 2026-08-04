'use server';

import { createSupabaseServerClient } from '@/services/database/client-server';
import { insertPrediction } from '@/services/database/predictions.db';
import { submitPredictionSchema } from './schemas';

export type SubmitPredictionState = { error: string | null; ticketCode: string | null };

function generateTicketCode(): string {
  return `PTX-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

/**
 * Anonymous submission — preserves the legacy "no login required, just
 * enter your name" UX (a confirmed deliberate design choice, not an
 * oversight: PHASE2_FIREBASE_SETUP.md explicitly scoped predictions as
 * intentionally unauthenticated). The ticket code is the retrieval
 * mechanism instead of an account.
 */
export async function submitPredictionAction(
  _prevState: SubmitPredictionState,
  formData: FormData
): Promise<SubmitPredictionState> {
  const rawPicks = formData.get('picks');
  let picks: unknown;
  try {
    picks = JSON.parse(String(rawPicks ?? '{}'));
  } catch {
    return { error: 'Dữ liệu dự đoán không hợp lệ.', ticketCode: null };
  }

  const parsed = submitPredictionSchema.safeParse({
    displayName: formData.get('displayName'),
    picks,
    mvpPlayerId: formData.get('mvpPlayerId') || null,
    goldenBootPlayerId: formData.get('goldenBootPlayerId') || null,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ.', ticketCode: null };
  }
  if (Object.keys(parsed.data.picks).length === 0) {
    return { error: 'Vui lòng dự đoán tỉ số cho ít nhất 1 trận.', ticketCode: null };
  }

  const ticketCode = generateTicketCode();
  const supabase = await createSupabaseServerClient();

  try {
    await insertPrediction(supabase, {
      displayName: parsed.data.displayName,
      ticketCode,
      picks: parsed.data.picks,
      mvpPlayerId: parsed.data.mvpPlayerId,
      goldenBootPlayerId: parsed.data.goldenBootPlayerId,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Không thể gửi dự đoán.', ticketCode: null };
  }

  return { error: null, ticketCode };
}
