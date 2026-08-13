import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getEnv } from '@/lib/env';

/**
 * Server client for Server Components / Server Actions / Route Handlers.
 * Still uses the anon key + the request's auth cookie, so it still
 * operates under RLS — this is NOT the service-role client
 * (docs/architecture §9: service role is not the default admin path).
 *
 * Kept in its own file (not alongside the browser client) since it
 * imports `next/headers`, which cannot appear in any module reachable
 * from a Client Component bundle.
 */
export async function createSupabaseServerClient() {
  const env = getEnv();
  const cookieStore = await cookies();
  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component render — cookie writes are a no-op there;
          // the middleware refresh path handles session persistence instead.
        }
      },
    },
  });
}

/**
 * Client đã NẠP SẴN phiên đăng nhập — dùng cho mọi thao tác ghi cần RLS nhận ra người dùng.
 *
 * Client của @supabase/ssr chỉ đọc phiên từ cookie khi có ai gọi một hàm auth trên CHÍNH
 * thể hiện đó. Các Server Action thường gọi requireAdminUserId() trước — hàm đó tạo và nạp
 * phiên cho MỘT client riêng — rồi tạo client thứ hai để ghi. Client thứ hai chưa nạp gì
 * nên gửi request bằng mỗi anon key; trong Postgres `auth.uid()` thành null và mọi chính
 * sách RLS dựa trên danh tính đều từ chối.
 *
 * Đã đo trên production: tải ảnh lên Storage nhận về "new row violates row-level security
 * policy" — đúng câu mà một request nặc danh thật sự nhận được. Chính sách RLS không sai;
 * nó chặn đúng một request mà nó nhìn thấy là nặc danh.
 */
export async function createAuthedSupabaseServerClient() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.getUser();
  return supabase;
}
