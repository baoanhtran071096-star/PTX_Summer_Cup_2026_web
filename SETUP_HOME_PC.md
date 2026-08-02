# 🚀 HƯỚNG DẪN ĐỒNG BỘ & SETUP PC NHÀ (HOME PC)

---

## 1️⃣ BƯỚC THỰC HIỆN TẠI PC CÔNG TY (Hiện tại)

Chạy 1 lệnh duy nhất trong Terminal của PC Công ty để đẩy toàn bộ code + AI context lên GitHub:

```bash
git push -u origin main
```

*(Nếu có cửa sổ hỏi xác thực GitHub, bạn chỉ cần bấm **Sign in** để đồng ý)*

---

## 2️⃣ BƯỚC SETUP TẠI PC NHÀ (Thực hiện lần đầu ở nhà)

### Bước A: Clone project từ GitHub về PC Nhà
Mở **Terminal** (hoặc Git Bash / Command Prompt) trên PC Nhà tại vị trí bạn muốn lưu project (ví dụ: `Desktop`), chạy lệnh:

```bash
git clone https://github.com/baoanhtran071096-star/SUMMER-CUP-DEVELOPMENT.git
```

### Bước B: Mở Project trong Antigravity ở PC Nhà
1. Mở ứng dụng **Antigravity**.
2. Chọn **Projects** ➔ **Add Folder**.
3. Chọn thư mục `SUMMER CUP DEVELOPMENT` vừa clone về.

### Bước C: Kích hoạt Agent tại PC Nhà
Nhập câu Prompt sau gửi cho Agent trong Antigravity ở PC Nhà:

> *"Tôi vừa chuyển từ PC Công ty sang PC Nhà. Hãy đọc các file trong thư mục `context/` (PROJECT_CONTEXT.md, CURRENT_STATUS.md, LAST_SESSION.md) và `.agents/rules/workspace_rules.md` để cập nhật trạng thái dự án và tiếp tục công việc."*

---

## 3️⃣ QUY TRÌNH ĐỒNG BỘ HÀNG NGÀY (PC CÔNG TY ↔ PC NHÀ)

Để giữ code và AI Context luôn mới nhất ở cả 2 máy:

### 📤 Khi kết thúc ca làm việc (Tại Công ty hoặc Tại Nhà):
Chạy trong Terminal:
```bash
git add .
git commit -m "Cập nhật tiến độ & context"
git push
```

### 📥 Khi bắt đầu ca làm việc (Tại Máy còn lại):
Chạy trong Terminal trước khi bắt đầu làm:
```bash
git pull
```
