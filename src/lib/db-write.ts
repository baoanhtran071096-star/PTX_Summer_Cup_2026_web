import { InfrastructureError, BusinessError } from './errors';

/**
 * Bắt buộc một lệnh ghi phải thật sự chạm vào ít nhất một dòng.
 *
 * Vì sao cần: khi RLS chặn một UPDATE/DELETE, Postgres KHÔNG báo lỗi — hàng đơn giản không
 * lọt qua bộ lọc chính sách, nên câu lệnh khớp 0 dòng và trả về thành công. Mọi hàm ghi ở
 * tầng này trước đây chỉ kiểm `error`, nên một thao tác bị chặn hoàn toàn vẫn được coi là
 * đã lưu. Người dùng bấm Lưu, không thấy lỗi, và không có gì thay đổi.
 *
 * Đã đo trên production: một client thiếu token chạy `update teams` → 0 dòng, không lỗi.
 * Đó là lý do lớp kiểm này tồn tại, và vì sao nó phải nằm ở tầng ghi chứ không phải ở từng
 * chỗ gọi — chỗ gọi nào quên kiểm thì lỗi lại trở nên vô hình.
 *
 * `.select()` sau lệnh ghi là thứ khiến PostgREST trả về các dòng đã tác động; không có nó
 * thì `data` luôn null và không có cách nào phân biệt "đã ghi" với "bị chặn".
 */
export function assertWrote(rows: unknown[] | null, error: { message: string } | null, what: string): void {
  if (error) throw new InfrastructureError(`Failed to ${what}: ${error.message}`, error);
  if (!rows || rows.length === 0) {
    throw new BusinessError(
      `Không lưu được (${what}): thao tác không chạm vào dòng nào. ` +
        'Thường là do phiên đăng nhập đã hết hạn hoặc tài khoản không còn quyền quản trị — hãy đăng nhập lại.'
    );
  }
}
