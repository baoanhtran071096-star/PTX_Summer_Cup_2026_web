import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { getEnv } from '@/lib/env';
import { BusinessError } from '@/lib/errors';

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

/**
 * Client gắn access token của người dùng THẲNG vào header — dùng cho Storage.
 *
 * Gọi `getUser()` là đủ để PostgREST nhận ra người dùng, nhưng KHÔNG đủ cho Storage: tầng
 * storage của supabase-js không lấy lại token sau khi phiên được nạp, nên request đi ra chỉ
 * mang anon key. Với Postgres thì `auth.uid()` là null và chính sách RLS từ chối.
 *
 * Đã chứng minh bằng thí nghiệm trên production, không phải suy đoán:
 *   • anon key, không phiên            → 400 "new row violates row-level security policy"
 *   • service-role key                 → 200
 *   • JWT của một admin thật           → 200   ← chính sách RLS hoàn toàn đúng
 * Ba kết quả đó loại trừ mọi khả năng khác và chỉ thẳng vào chỗ thiếu token.
 *
 * Vẫn dùng anon key + JWT người dùng, KHÔNG dùng service-role: RLS vẫn là thứ quyết định
 * ai được ghi, đúng như docs/architecture §9 yêu cầu.
 */
export async function createStorageClientForCurrentUser() {
  const env = getEnv();
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new BusinessError('Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại rồi thử lại.');

  // Dùng tuỳ chọn `accessToken` chứ KHÔNG nhét Authorization vào global.headers.
  //
  // Đặt header thủ công không có tác dụng: supabase-js tự dựng header cho mỗi request qua
  // `_getAccessToken()`, và hàm đó rơi về anon key khi client không có phiên — nên nó ghi
  // đè đúng cái header vừa đặt. Đã thử và vẫn nhận nguyên câu lỗi RLS cũ.
  //
  // `accessToken: () => Promise<string | null>` là điểm móc chính thức của thư viện cho
  // trường hợp token đến từ nơi khác (khai báo trong index.d.mts), và mọi tầng — PostgREST,
  // Storage, Functions — đều đọc qua đó.
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    accessToken: async () => session.access_token,
  });
}
