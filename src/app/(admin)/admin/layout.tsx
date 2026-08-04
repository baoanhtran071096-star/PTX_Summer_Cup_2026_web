import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentProfile } from '@/services/auth/session';
import { signOutAction } from '@/features/auth/actions';
import { ROUTES } from '@/constants/routes';
import { isSupabaseConfigured } from '@/lib/env';

const ADMIN_NAV = [
  { href: '/admin', label: 'Tổng quan' },
  { href: '/admin/settings', label: 'Cài đặt giải đấu' },
  { href: '/admin/teams', label: 'Đội bóng' },
  { href: '/admin/players', label: 'Cầu thủ' },
  { href: '/admin/matches', label: 'Trận đấu' },
  { href: '/admin/predictions', label: 'Dự đoán' },
  { href: '/admin/media', label: 'Media' },
  { href: '/admin/users', label: 'Người dùng' },
  { href: '/admin/audit-log', label: 'Nhật ký hoạt động' },
];

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
      <div style={{ display: 'flex' }}>
        <nav
          style={{
            width: '200px',
            padding: 'var(--ptx-space-4)',
            borderRight: '1px solid var(--border-color)',
            display: 'grid',
            gap: 'var(--ptx-space-1)',
            alignContent: 'start',
          }}
        >
          {ADMIN_NAV.map((item) => (
            <Link key={item.href} href={item.href} style={{ color: 'inherit', padding: 'var(--ptx-space-2)' }}>
              {item.label}
            </Link>
          ))}
        </nav>
        <main style={{ padding: 'var(--ptx-space-8)', flex: 1 }}>{children}</main>
      </div>
    </div>
  );
}
