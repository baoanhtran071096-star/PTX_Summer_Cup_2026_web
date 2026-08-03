# 🔥 Hướng dẫn kích hoạt Firebase (Phase 2 — Đồng bộ dữ liệu real-time)

Toàn bộ code đã được viết sẵn trong `index.html` (module `ptxCloudSync`). Bạn chỉ cần làm 5 bước dưới đây (~10-15 phút, không cần biết code) để bật đồng bộ real-time thật giữa mọi người xem.

**Nếu bạn chưa làm các bước này, website vẫn chạy bình thường 100% như cũ** — chỉ là chưa đồng bộ giữa các thiết bị (an toàn, không có gì bị hỏng).

---

## Bước 1 — Tạo Firebase Project (miễn phí)

1. Vào https://console.firebase.google.com
2. Đăng nhập bằng tài khoản Google
3. Bấm **"Add project"** → đặt tên (ví dụ `ptx-summer-cup-2026`) → bấm Continue vài lần → **Create project**
4. Đợi ~30 giây, bấm **Continue**

---

## Bước 2 — Bật Firestore Database

1. Trong menu bên trái, chọn **Build > Firestore Database**
2. Bấm **Create database**
3. Chọn **Start in production mode** → Next
4. Chọn khu vực gần Việt Nam nhất, ví dụ `asia-southeast1 (Singapore)` → **Enable**

---

## Bước 3 — Bật Authentication (Email/Password) + tạo tài khoản Admin

1. Trong menu bên trái, chọn **Build > Authentication** → **Get started**
2. Tab **Sign-in method** → chọn **Email/Password** → bật (Enable) → **Save**
3. Tab **Users** → **Add user**
   - Email: `admin@ptxsummercup.internal` (hoặc theo đúng username admin bạn đang dùng trên web, viết liền không dấu + `@ptxsummercup.internal`)
   - Password: **đặt giống với mật khẩu admin bạn đang dùng trên web** để không phải nhớ 2 mật khẩu khác nhau
   - Bấm **Add user**

> ⚠️ Nếu username admin trên web của bạn khác `admin`, hãy đổi phần trước dấu `@` cho khớp (chỉ giữ chữ + số, bỏ dấu/ký tự đặc biệt). Ví dụ username `BanToChuc` → email `bantochuc@ptxsummercup.internal`.

---

## Bước 4 — Dán Firestore Rules

1. Quay lại **Firestore Database** → tab **Rules**
2. Xóa hết nội dung mặc định, dán toàn bộ nội dung file **`firestore.rules`** (đi kèm trong gói này) vào
3. Bấm **Publish**

---

## Bước 5 — Lấy Config & dán vào `index.html`

1. Bấm biểu tượng **⚙️ (Project settings)** ở góc trên bên trái → **Project settings**
2. Kéo xuống mục **"Your apps"** → bấm biểu tượng **`</>`** (Web)
3. Đặt tên app (ví dụ `ptx-web`) → **Register app** (không cần tick Firebase Hosting)
4. Firebase sẽ hiện ra 1 đoạn code dạng:
   ```js
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "ptx-summer-cup-2026.firebaseapp.com",
     projectId: "ptx-summer-cup-2026",
     storageBucket: "ptx-summer-cup-2026.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef123456"
   };
   ```
5. Mở file `index.html`, tìm dòng `const PTX_FIREBASE_CONFIG = {` (dùng Ctrl+F), thay 6 giá trị `"DÁN_..."` bằng đúng 6 giá trị Firebase vừa cho ở bước 4.
6. Lưu file, tải `index.html` lên chỗ đang host website (hoặc mở lại bằng trình duyệt nếu test local).

---

## ✅ Cách kiểm tra đã chạy đúng chưa

1. Mở website bằng **2 trình duyệt khác nhau** (hoặc 1 trình duyệt + 1 điện thoại)
2. Đăng nhập Admin ở trình duyệt A → vào Tab "BXH & Kết quả" → sửa tỷ số 1 trận → Lưu
3. Nhìn sang trình duyệt B (KHÔNG cần F5) → tỷ số phải tự động cập nhật trong vài giây
4. Mở Console (F12) ở trình duyệt A, gõ: `ptxCloudSync.isEnabled()` → phải trả về `true`

Nếu bước 3 không tự cập nhật: kiểm tra lại Bước 4 (Rules đã Publish chưa) và Bước 3 (tài khoản Auth + mật khẩu có khớp không).

---

## 📌 Những gì đã được đồng bộ real-time (Phase 2 hiện tại)

| Dữ liệu | Đồng bộ? |
|---|---|
| Tỷ số 3 trận đấu (`ptx_result_1/2/3`) | ✅ |
| Thống kê tổng (bàn thắng, số trận, thẻ vàng/đỏ) | ✅ |
| Thông tin sự kiện (slogan, thông điệp, ngày, địa điểm) | ✅ |
| Chỉ số cầu thủ (bàn thắng, kiến tạo, MVP, tên, vị trí) | ✅ |
| Dự đoán tỷ số của người xem (`ptx_user_prediction`) | ❌ Cố ý KHÔNG đồng bộ — đây là dữ liệu cá nhân từng người, không cần chia sẻ |
| Ngôn ngữ / theme sáng-tối / trang đang xem | ❌ Cố ý KHÔNG đồng bộ — đây là tùy chọn riêng từng thiết bị |
| Thư viện ảnh (lượt thích), Hall of Fame theo năm | ❌ Chưa đồng bộ (có thể mở rộng thêm sau nếu cần) |

## 🔒 Về bảo mật đăng nhập Admin (đã giải quyết dứt điểm)

Trước đây (Phase 0), việc "đăng nhập admin" chỉ kiểm tra phía trình duyệt — ai rành kỹ thuật vẫn có thể sửa `localStorage` để tự cấp quyền cho mình. Giờ với Firestore Rules ở Bước 4, **Firebase server sẽ tự chặn** mọi yêu cầu ghi dữ liệu nếu không có token đăng nhập Firebase Auth hợp lệ — không phụ thuộc vào việc client có bị can thiệp hay không. Đây là bảo mật thật, không còn là "an toàn nhờ che giấu" như trước.
