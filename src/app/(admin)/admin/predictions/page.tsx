import { getPredictionLeaderboard } from '@/features/predictions/queries';
import { deletePredictionAction } from '@/features/admin/actions';
import { AdminForm } from '@/features/admin/components/AdminForm';

export const dynamic = 'force-dynamic';

export default async function AdminPredictionsPage() {
  const entries = await getPredictionLeaderboard();

  return (
    <div>
      <h1>Dự đoán</h1>
      {entries.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>Chưa có dự đoán nào.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', maxWidth: '640px' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border-color)' }}>
              <th>Tên</th>
              <th>Mã vé</th>
              <th>Điểm</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td>{entry.displayName}</td>
                <td>{entry.ticketCode}</td>
                <td>{entry.points}</td>
                <td>
                  <AdminForm
                    action={deletePredictionAction}
                    submitLabel="Xóa"
                    pendingLabel="Đang xoá…"
                    submitStyle={{ background: 'var(--status-danger)' }}
                  >
                    <input type="hidden" name="predictionId" value={entry.id} />
                  </AdminForm>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
