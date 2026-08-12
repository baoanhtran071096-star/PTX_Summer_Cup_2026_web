'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/services/database/client-server';
import { logger } from '@/lib/logger';
import { loginSchema } from './schemas';
import { ROUTES } from '@/constants/routes';

export type LoginActionState = { error: string | null };

export async function signInAction(
  _prevState: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    logger.warn('Admin sign-in failed', { email: parsed.data.email, reason: error.message });
    return { error: 'Email hoặc mật khẩu không đúng.' };
  }

  redirect(ROUTES.admin);
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect(ROUTES.home);
}
