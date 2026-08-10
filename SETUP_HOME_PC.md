# Đồng bộ hai máy — PTX Summer Cup 2026

Quy trình cho mô hình **PC Công ty ↔ PC Nhà**, cùng một repo GitHub, dùng Claude Code.

> **Bản trước của file này đã sai và bị viết lại.** Nó ghi tên repo là
> `SUMMER-CUP-DEVELOPMENT` (repo thật tên khác nên lệnh clone luôn thất bại), hướng dẫn
> dùng Antigravity thay vì Claude Code, và bảo đọc `context/` cùng `.agents/rules/` —
> hai thư mục chưa từng tồn tại trong repo này.

---

## 1. Cài lần đầu ở máy mới

Ba thứ dưới đây **không đi theo git**, phải làm riêng trên từng máy.

### A. Lấy mã nguồn

```bash
git clone https://github.com/baoanhtran071096-star/PTX_Summer_Cup_2026_web.git
cd PTX_Summer_Cup_2026_web
```

### B. Cài phụ thuộc để chạy được test

```bash
npm ci
npx playwright install chromium
```

Thiếu bước này thì `npm test` không chạy, và `sync.ps1` sẽ dừng ngay ở bước 2.

### C. Đăng nhập hai dịch vụ deploy

```bash
firebase login
npx wrangler login
```

Token đăng nhập nằm trong hồ sơ người dùng của máy, **không nằm trong repo**. Máy mới
chưa đăng nhập thì pull code về vẫn không deploy được.

Cả hai đều dùng tài khoản Google sở hữu project. Kiểm tra bằng `firebase projects:list`
và `npx wrangler whoami`.

---

## 2. Quy trình hằng ngày

**Chỉ cần một lệnh, ở cả hai máy:**

```powershell
.\sync.ps1
```

Script chạy đúng thứ tự và dừng ngay khi có lỗi:

| Bước | Việc | Dừng khi |
|---|---|---|
| 1 | `git pull --ff-only origin main` | Hai máy đi lệch nhau |
| 2 | `npm test` (97 test) | Test đỏ |
| 3 | Commit (hỏi nội dung, không có mặc định) | Nội dung dưới 10 ký tự |
| 4 | `git push origin main` | Máy kia vừa đẩy lên trước |
| 5 | `firebase deploy --only hosting` | Chưa đăng nhập Firebase |
| 6 | `npx wrangler deploy` — **chỉ khi** `cloudflare-worker/` đổi | Chưa đăng nhập Wrangler |

Tuỳ chọn:

```powershell
.\sync.ps1 -Message "Sửa lỗi X"   # đưa sẵn nội dung commit
.\sync.ps1 -NoDeploy              # chỉ lên GitHub, chưa lên production
.\sync.ps1 -NoTest                # bỏ qua test (chỉ khi thật sự gấp)
```

**Bắt đầu ca làm ở máy kia:** chạy `.\sync.ps1` là đủ — bước 1 đã kéo về rồi. Nếu chỉ
muốn kéo mà chưa làm gì:

```bash
git pull --ff-only origin main
```

---

## 3. Ba quy tắc

### ① Không sửa cùng lúc trên hai máy

Toàn bộ trang nằm trong **một file `index.html` khoảng 16.700 dòng**. Hai máy cùng sửa
thì git buộc phải merge, và bản merge tự động của một file như vậy có thể chạy được về
cú pháp nhưng sai về logic — không ai phát hiện cho tới khi người xem gặp lỗi.

Đúng thứ tự: **Máy A push → GitHub → Máy B pull → làm → push.**

### ② Không bao giờ `git push -f`

Nếu bước 1 báo không fast-forward được, nghĩa là máy kia có commit mà máy này chưa có.
`push -f` sẽ **xoá vĩnh viễn công của máy kia**. Xử lý:

```bash
git log --oneline HEAD..origin/main      # xem máy kia đã làm gì
git pull --rebase origin main            # xếp commit của mình lên trên
```

Giải quyết xung đột xong mới chạy lại `.\sync.ps1`.

### ③ Đã push thì phải deploy

Đẩy lên GitHub **không** làm trang web đổi. Dự án có **hai đích deploy độc lập**:
Firebase Hosting (trang web) và Cloudflare Worker (proxy AI). `sync.ps1` lo cả hai; nếu
chạy tay thì đừng quên, không thì GitHub và production lệch nhau mà không có dấu hiệu gì.

---

## 4. Kiểm tra nhanh khi nghi ngờ

```bash
git status                    # còn gì chưa lưu
git log --oneline -5          # 5 commit gần nhất
git log origin/main..HEAD     # commit đã tạo nhưng CHƯA đẩy lên
npm test                      # 97 test
```

Kiểm tra bản trên web có đúng bản mới nhất không: mở
https://ptx-summer-cup-2026.web.app và nhấn **Ctrl+F5** (service worker của trang ưu
tiên mạng cho HTML, nhưng trình duyệt vẫn có thể giữ bản cũ trong bộ nhớ đệm).
