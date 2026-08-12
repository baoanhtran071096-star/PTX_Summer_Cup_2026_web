import { getCurrentTournamentSettings } from '@/features/admin/queries';
import { updateTournamentSettingsAction } from '@/features/admin/actions';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const settings = await getCurrentTournamentSettings();

  return (
    <div>
      <h1>Cài đặt giải đấu</h1>
      <form action={updateTournamentSettingsAction} style={{ display: 'grid', gap: 'var(--ptx-space-4)', maxWidth: '480px' }}>
        <label>
          Khẩu hiệu
          <input name="slogan" defaultValue={settings?.slogan ?? ''} style={{ display: 'block', width: '100%', padding: 'var(--ptx-space-2)' }} />
        </label>
        <label>
          Thông điệp
          <textarea name="message" defaultValue={settings?.message ?? ''} style={{ display: 'block', width: '100%', padding: 'var(--ptx-space-2)' }} />
        </label>
        <label>
          Ngày diễn ra
          <input name="eventDate" defaultValue={settings?.event_date ?? ''} style={{ display: 'block', width: '100%', padding: 'var(--ptx-space-2)' }} />
        </label>
        <label>
          Địa điểm
          <input name="location" defaultValue={settings?.location ?? ''} style={{ display: 'block', width: '100%', padding: 'var(--ptx-space-2)' }} />
        </label>
        <button
          type="submit"
          style={{ background: 'var(--interactive-primary)', color: 'var(--text-on-interactive-primary)', border: 'none', borderRadius: 'var(--ptx-radius-sm)', padding: 'var(--ptx-space-2) var(--ptx-space-4)' }}
        >
          Lưu
        </button>
      </form>
    </div>
  );
}
