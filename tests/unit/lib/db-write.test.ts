import { describe, it, expect } from 'vitest';
import { assertWrote } from '@/lib/db-write';
import { BusinessError, InfrastructureError } from '@/lib/errors';

/**
 * Khoá lại đúng lỗi đã khiến toàn bộ khu quản trị hỏng trong im lặng.
 *
 * Khi RLS chặn một UPDATE/DELETE, Postgres không báo lỗi — hàng chỉ đơn giản không lọt qua
 * bộ lọc chính sách, nên câu lệnh khớp 0 dòng và trả về thành công. Mọi hàm ghi trước đây
 * chỉ kiểm `error`, nên một thao tác bị chặn hoàn toàn vẫn được coi là đã lưu.
 *
 * Đo được trên production: client thiếu token chạy `update teams` → 0 dòng, không lỗi.
 */
describe('assertWrote', () => {
  it('cho qua khi lệnh ghi chạm ít nhất một dòng', () => {
    expect(() => assertWrote([{ id: 'p' }], null, 'update team p')).not.toThrow();
  });

  it('BÁO LỖI khi khớp 0 dòng, dù không có error — đây là ca RLS chặn im lặng', () => {
    expect(() => assertWrote([], null, 'update team p')).toThrow(BusinessError);
  });

  it('coi data null như 0 dòng, không được im lặng cho qua', () => {
    expect(() => assertWrote(null, null, 'update team p')).toThrow(BusinessError);
  });

  it('gợi ý đúng nguyên nhân thường gặp để người dùng tự xử lý', () => {
    expect(() => assertWrote([], null, 'update team p')).toThrow(/đăng nhập lại/);
  });

  it('lỗi thật từ cơ sở dữ liệu vẫn là lỗi hạ tầng, không bị nhầm thành lỗi quyền', () => {
    expect(() => assertWrote(null, { message: 'connection reset' }, 'update team p')).toThrow(
      InfrastructureError
    );
  });

  it('nêu rõ thao tác nào hỏng, để log không phải đoán', () => {
    expect(() => assertWrote([], null, 'delete prediction 42')).toThrow(/delete prediction 42/);
  });
});
