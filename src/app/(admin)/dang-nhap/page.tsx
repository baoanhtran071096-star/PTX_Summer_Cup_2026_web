import { LoginForm } from '@/features/auth/components/LoginForm';

export const metadata = { title: 'Đăng nhập quản trị — PTX Summer Cup 2026' };

export default function LoginPage() {
  return (
    <main style={{ padding: 'var(--ptx-space-8)' }}>
      <h1 style={{ fontFamily: 'var(--ptx-font-title)' }}>Đăng nhập quản trị</h1>
      <LoginForm />
    </main>
  );
}
