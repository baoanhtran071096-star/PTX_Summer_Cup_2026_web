import { Header } from '@/components/layout/Header';

export default function HomePage() {
  return (
    <>
      <Header />
      <main style={{ padding: 'var(--ptx-space-8)' }}>
        <h1 style={{ fontFamily: 'var(--ptx-font-logo)', color: 'var(--text-primary)' }}>
          PTX Summer Cup 2026
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Giải bóng đá truyền thống do Công đoàn PTX Group Việt Nam tổ chức.
        </p>
      </main>
    </>
  );
}
