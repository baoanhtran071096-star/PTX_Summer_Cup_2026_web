import Link from 'next/link';
import { ROUTES } from '@/constants/routes';
import { ThemeSwitcher } from './ThemeSwitcher';

const NAV_ITEMS: { href: string; label: string }[] = [
  { href: ROUTES.home, label: 'Trang chủ' },
  { href: ROUTES.teams, label: 'Đội bóng' },
  { href: ROUTES.players, label: 'Cầu thủ' },
  { href: ROUTES.schedule, label: 'Lịch thi đấu' },
  { href: ROUTES.results, label: 'Kết quả' },
  { href: ROUTES.standings, label: 'BXH' },
  { href: ROUTES.statistics, label: 'Thống kê' },
  { href: ROUTES.predictions, label: 'Dự đoán' },
];

export function Header() {
  return (
    <header
      style={{
        background: 'var(--surface-nav)',
        color: 'var(--text-on-navy)',
        padding: 'var(--ptx-space-3) var(--ptx-space-6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 'var(--ptx-space-3)',
      }}
    >
      <Link href={ROUTES.home} style={{ color: 'inherit', textDecoration: 'none', fontFamily: 'var(--ptx-font-logo)' }}>
        PTX Summer Cup
      </Link>
      <nav aria-label="Điều hướng chính" style={{ display: 'flex', gap: 'var(--ptx-space-4)', flexWrap: 'wrap' }}>
        {NAV_ITEMS.map((item) => (
          <Link key={item.href} href={item.href} style={{ color: 'inherit', textDecoration: 'none' }}>
            {item.label}
          </Link>
        ))}
      </nav>
      <ThemeSwitcher />
    </header>
  );
}
