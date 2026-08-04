'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Route error boundary triggered', { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <div style={{ padding: 'var(--ptx-space-8)' }}>
      <h2>Đã có lỗi xảy ra</h2>
      <p style={{ color: 'var(--text-muted)' }}>Vui lòng thử lại.</p>
      <button
        onClick={reset}
        style={{
          background: 'var(--interactive-primary)',
          color: 'var(--text-on-interactive-primary)',
          border: 'none',
          borderRadius: 'var(--ptx-radius-sm)',
          padding: 'var(--ptx-space-2) var(--ptx-space-4)',
          cursor: 'pointer',
        }}
      >
        Thử lại
      </button>
    </div>
  );
}
