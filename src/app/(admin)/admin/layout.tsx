import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/services/auth/session';
import { signOutAction } from '@/features/auth/actions';
import { ROUTES } from '@/constants/routes';
import { isSupabaseConfigured } from '@/lib/env';

// Every admin route is per-request/authenticated — never statically
// prerenderable, regardless of whether env vars happen to be present
// at build time.
export const dynamic = 'force-dynamic';

/**
 * Defense in depth: middleware.ts already redirects unauthenticated
 * requests to /admin/* away from here, but this layout re-checks and
 * additionally enforces the `admin` role (middleware only confirms
 * "signed in", not "is admin" — RLS is the real data-access gate,
 * this is just the UX-level guard, docs/architecture §9).
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) {
    return (
      <main style={{ padding: 'var(--ptx-space-8)' }}>
        <h1>Chưa cấu hình Supabase</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Đặt <code>NEXT_PUBLIC_SUPABASE_URL</code> và <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> trong{' '}
          <code>.env</code> (xem <code>.env.example</code>) rồi khởi động lại server để dùng Admin Control Center.
        </p>
      </main>
    );
  }

  const profile = await getCurrentProfile();

  if (!profile) {
    redirect(ROUTES.login);
  }

  if (profile.role !== 'admin') {
    return (
      <main style={{ padding: 'var(--ptx-space-8)' }}>
        <h1>Không đủ quyền truy cập</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Tài khoản của bạn không có quyền quản trị.
        </p>
        <form action={signOutAction}>
          <button type="submit">Đăng xuất</button>
        </form>
      </main>
    );
  }

  return (
    <div>
      <header
        style={{
          background: 'var(--surface-nav)',
          color: 'var(--text-on-navy)',
          padding: 'var(--ptx-space-4)',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontFamily: 'var(--ptx-font-title)' }}>PTX Admin Control Center</span>
        <form action={signOutAction}>
          <button type="submit" style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}>
            Đăng xuất ({profile.display_name ?? profile.username ?? 'admin'})
          </button>
        </form>
      </header>
      <main style={{ padding: 'var(--ptx-space-8)' }}>{children}</main>
    </div>
  );
}
