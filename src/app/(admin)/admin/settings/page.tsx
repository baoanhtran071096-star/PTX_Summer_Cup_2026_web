import { getCurrentTournamentSettings } from '@/features/admin/queries';
import { updateTournamentSettingsAction } from '@/features/admin/actions';
import { AdminForm } from '@/features/admin/components/AdminForm';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const settings = await getCurrentTournamentSettings();

  return (
    <div>
      <h1>Cài đặt giải đấu</h1>
      <AdminForm
        action={updateTournamentSettingsAction}
        style={{ display: 'grid', gap: 'var(--ptx-space-4)', maxWidth: '480px' }}
        submitLabel="Lưu"
        submitStyle={{ justifySelf: 'start' }}
      >
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
      </AdminForm>
    </div>
  );
}
