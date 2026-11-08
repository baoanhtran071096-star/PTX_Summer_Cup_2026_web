import { getAllProfiles } from '@/features/admin/queries';
import { updateUserRoleAction } from '@/features/admin/actions';
import { AdminForm } from '@/features/admin/components/AdminForm';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const profiles = await getAllProfiles();

  return (
    <div>
      <h1>Người dùng</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse', maxWidth: '640px' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border-color)' }}>
            <th>Tên hiển thị</th>
            <th>Vai trò</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {profiles.map((profile) => (
            <tr key={profile.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td>{profile.display_name ?? profile.username ?? profile.id}</td>
              <td>{profile.role}</td>
              <td>
                <AdminForm
                  action={updateUserRoleAction}
                  submitLabel={profile.role === 'admin' ? 'Thu hồi quyền admin' : 'Cấp quyền admin'}
                  pendingLabel="Đang đổi…"
                >
                  <input type="hidden" name="profileId" value={profile.id} />
                  <input type="hidden" name="role" value={profile.role === 'admin' ? 'viewer' : 'admin'} />
                </AdminForm>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
