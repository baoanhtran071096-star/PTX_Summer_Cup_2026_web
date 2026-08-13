import { MediaUploadForm } from '@/features/admin/components/MediaUploadForm';

export const dynamic = 'force-dynamic';

export default function AdminMediaPage() {
  return (
    <div>
      <h1>Media</h1>
      <p style={{ color: 'var(--text-muted)', maxWidth: '60ch' }}>
        Tải lên logo đội, ảnh cầu thủ, hoặc ảnh thư viện. Ảnh trong bucket <code>gallery</code> hiển thị công khai
        ngay sau khi tải lên; ảnh đội và cầu thủ cần cập nhật thêm đường dẫn ở trang Đội bóng/Cầu thủ.
      </p>
      <MediaUploadForm />
    </div>
  );
}
