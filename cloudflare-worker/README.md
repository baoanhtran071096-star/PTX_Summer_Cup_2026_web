# PTX AI Proxy — Cloudflare Worker

Proxy này giấu Groq API key phía server, cho phép PTX AI Assistant trên
`index.html` trả lời được cả những câu hỏi ngoài 8 nhánh rule-based hiện có.
Hoàn toàn miễn phí (Cloudflare Workers free tier + Groq free tier), không
cần thẻ thanh toán.

> Ban đầu dự định dùng Gemini, nhưng Google chặn API với lỗi "User location
> is not supported" cho tài khoản/khu vực đang dùng — nên đổi sang Groq
> (free tier chạy các model mã nguồn mở như Llama, không bị giới hạn này).

## Bước 1 — Lấy Groq API key (miễn phí)

1. Vào https://console.groq.com/keys
2. Đăng nhập/đăng ký (free, không cần thẻ).
3. Bấm **Create API Key**, đặt tên tùy ý, copy key lại (dạng `gsk_...`) —
   sẽ dùng ở Bước 3.

## Bước 2 — Cài Wrangler & đăng nhập Cloudflare (miễn phí)

```bash
cd cloudflare-worker
npm install -g wrangler
wrangler login
```

Lệnh `wrangler login` sẽ mở trình duyệt để bạn đăng nhập/đăng ký tài khoản
Cloudflare (free, không cần thẻ).

## Bước 3 — Lưu API key làm secret (không lưu trong code)

Trong PowerShell, dán trực tiếp key vào lệnh sau (tránh dùng ô nhập ẩn từng
ký tự — paste chuỗi dài vào đó dễ bị cắt cụt trên Windows):

```powershell
"gsk_KEY_THẬT_CỦA_BẠN" | wrangler secret put GROQ_API_KEY
```

## Bước 4 — Deploy

```bash
wrangler deploy
```

Sau khi deploy xong, terminal sẽ in ra URL dạng:

```
https://ptx-ai-proxy.<your-subdomain>.workers.dev
```

## Bước 5 — Kết nối vào website

Mở `index.html`, tìm dòng:

```js
const PTX_AI_PROXY_URL = "";
```

Dán URL từ Bước 4 vào giữa hai dấu ngoặc kép, ví dụ:

```js
const PTX_AI_PROXY_URL = "https://ptx-ai-proxy.your-subdomain.workers.dev";
```

Lưu file — PTX AI Assistant sẽ tự động gọi Groq cho mọi câu hỏi không khớp
8 nhánh rule-based có sẵn (bảng xếp hạng, vua phá lưới, thời tiết, lịch thi
đấu, tra cứu cầu thủ, đội bóng, dự đoán vô địch, điều lệ).

## Kiểm tra nhanh (không cần mở web)

```bash
curl -X POST https://ptx-ai-proxy.<your-subdomain>.workers.dev \
  -H "Content-Type: application/json" \
  -H "Origin: https://baoanhtran071096-star.github.io" \
  -d '{"message":"Cho tôi lời khuyên chiến thuật","grounding":{}}'
```

Nếu thấy `{"reply": "..."}` là proxy đã hoạt động.

## ⚠️ Phải khớp Origin với tên miền thật đang chạy

`ALLOWED_ORIGINS` trong `worker.js` quyết định trang nào được gọi proxy. Nếu
tên miền thật của trang KHÔNG có trong danh sách đó, worker trả `403 Origin
không được phép` và trợ lý AI mất hẳn khả năng trả lời ngoài 8 nhánh
rule-based.

Lỗi này đã từng xảy ra thật: danh sách chỉ có `ptxsummercup.vn` (tên miền dự
kiến, chưa mua) trong khi trang chạy trên GitHub Pages, nên fallback Groq chết
trên bản production. Ở localhost vẫn chạy bình thường vì regex localhost luôn
được cho phép — nên thử ở máy dev sẽ không bao giờ lộ ra lỗi này.

Vì vậy khi đổi nơi host hoặc trỏ tên miền mới, phải sửa `ALLOWED_ORIGINS` rồi
`wrangler deploy` lại, và kiểm tra bằng đúng lệnh curl ở trên với `Origin` là
tên miền thật (mong đợi HTTP 200; nếu ra 403 tức chưa khớp).

### Hiện đang cho phép những đâu

| Origin | Dùng cho |
|---|---|
| `https://baoanhtran071096-star.github.io` | Trang thật hiện tại (GitHub Pages) |
| `https://ptx-summer-cup-2026.web.app` | Firebase Hosting (thêm sẵn trước khi deploy) |
| `https://ptx-summer-cup-2026.firebaseapp.com` | Firebase Hosting (tên miền thứ hai) |
| `https://ptx-summer-cup-2026--<kênh>-<hash>.web.app` | Kênh xem trước Firebase, khớp bằng regex |
| `https://ptxsummercup.vn`, `https://www.ptxsummercup.vn` | Tên miền riêng, CHƯA mua/trỏ |
| `http://localhost:PORT`, `http://127.0.0.1:PORT` | Máy dev |

Hai tên miền Firebase được thêm trước khi deploy là cố ý: mỗi project Firebase
luôn có đúng `<project-id>.web.app` và `<project-id>.firebaseapp.com` nên đoán
trước được, không phải chờ deploy xong mới sửa rồi deploy worker lần nữa.

Kênh xem trước (`firebase hosting:channel:deploy`) phải dùng regex vì mỗi lần
tạo lại sinh một hash khác nhau, không liệt kê sẵn được. Regex neo hai đầu
`^...$` và bắt buộc đúng tiền tố project, nên không nhận các tên miền giả kiểu
`...web.app.attacker.com` hay project Firebase khác — đã kiểm tra bằng 15
trường hợp gồm cả các biến thể giả mạo.

## Giới hạn free tier (tham khảo)

- **Cloudflare Workers free**: 100.000 request/ngày.
- **Groq free tier**: có giới hạn request/phút và token/phút tùy model, đủ
  dùng cho quy mô 1 giải đấu nội bộ. Nếu vượt giới hạn, Groq trả lỗi và bot
  sẽ tự động fallback về câu "chưa có dữ liệu" — trang web không bao giờ
  bị lỗi.

## Cập nhật / rollback

Sửa `worker.js` xong chạy lại `wrangler deploy` là cập nhật. Muốn gỡ hoàn
toàn: `wrangler delete` rồi xóa `PTX_AI_PROXY_URL` trong `index.html`.
