/**
 * Trạng thái chung cho mọi form quản trị.
 *
 * Trước đây các Server Action ném lỗi và form gọi chúng không có chỗ nào nhận. Kết quả là
 * bấm Lưu thì KHÔNG có thông báo nào — thành công cũng vậy mà thất bại cũng vậy. Không có
 * cách nào biết dữ liệu đã đổi hay chưa ngoài việc tự đi kiểm tra lại.
 *
 * Nằm ở file riêng chứ không nằm trong actions.ts vì file `'use server'` chỉ được phép
 * export hàm async; một hằng số đặt trong đó là lỗi build, không phải lỗi phong cách.
 */
export type AdminActionState = { error: string | null; ok: string | null };

export const emptyAdminActionState: AdminActionState = { error: null, ok: null };
