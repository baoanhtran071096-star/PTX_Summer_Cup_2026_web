import { getRecentAuditLog } from '@/features/admin/queries';

export const dynamic = 'force-dynamic';

export default async function AdminAuditLogPage() {
  const entries = await getRecentAuditLog();

  return (
    <div>
      <h1>Nhật ký hoạt động</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border-color)' }}>
            <th>Thời gian</th>
            <th>Hành động</th>
            <th>Đối tượng</th>
            <th>Chi tiết</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td>{new Date(entry.created_at).toLocaleString('vi-VN')}</td>
              <td>{entry.action}</td>
              <td>
                {entry.entity_type}
                {entry.entity_id ? ` #${entry.entity_id}` : ''}
              </td>
              <td>{entry.metadata ? JSON.stringify(entry.metadata) : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {entries.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>Chưa có hoạt động nào.</p> : null}
    </div>
  );
}
