import type { Metadata } from 'next';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'PTX Summer Cup 2026',
  description:
    'Giải bóng đá truyền thống do Công đoàn PTX Group Việt Nam tổ chức.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
