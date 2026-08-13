import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Server Action mặc định chỉ nhận body 1 MB. Trang Media tải ảnh qua Server Action,
    // nên gần như mọi ảnh chụp đều vượt ngưỡng — request bị chặn TRƯỚC khi hàm xử lý
    // chạy, không lỗi nào tới được ứng dụng, và nút "Tải lên" trông như bị hỏng.
    //
    // Đã gặp thật: chọn một tệp .jpg cho bucket team-logos, bấm nút, không có gì xảy ra.
    //
    // 10 MB đủ cho ảnh chụp điện thoại. Ngưỡng này phải khớp MAX_UPLOAD_MB trong
    // src/features/admin/actions.ts — nếu lệch, tệp nằm giữa hai mức sẽ bị chặn ở tầng
    // Next.js với đúng triệu chứng câm lặng mà thay đổi này sinh ra để loại bỏ.
    serverActions: { bodySizeLimit: '10mb' },
  },
  images: {
    // Next's image optimizer has a hard SSRF guard that rejects any
    // upstream URL resolving to a private IP (node_modules/next/dist/server
    // /image-optimizer.js, isPrivateIp check) — this fires unconditionally,
    // even when the host matches remotePatterns below. The local Supabase
    // CLI stack serves Storage from 127.0.0.1, a private/loopback address,
    // so every avatar/logo 400s in local dev regardless of config (found
    // via M12.5 live browser verification). Real Supabase Storage (staging/
    // production) is always a public hostname, never a private IP, so this
    // only disables optimization for the local-dev case — production
    // keeps full image optimization.
    unoptimized: (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').includes('127.0.0.1'),
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // Local Supabase dev stack (`supabase start`) serves Storage from
      // 127.0.0.1:54321, not *.supabase.co — found via real browser
      // testing against local Storage in M12.5 (the hosted-only pattern
      // above crashed every page rendering a real image). Dev-only:
      // production never resolves to 127.0.0.1.
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '54321',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
