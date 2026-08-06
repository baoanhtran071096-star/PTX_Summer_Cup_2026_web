# PTX AI Proxy — Cloudflare Worker

Proxy này giấu Gemini API key phía server, cho phép PTX AI Assistant trên
`index.html` trả lời được cả những câu hỏi ngoài 8 nhánh rule-based hiện có.
Hoàn toàn miễn phí (Cloudflare Workers free tier + Gemini free tier), không
cần thẻ thanh toán.

## Bước 1 — Lấy Gemini API key (miễn phí)

1. Vào https://aistudio.google.com/apikey
2. Đăng nhập bằng tài khoản Google, bấm **Create API key**.
3. Copy key lại (dạng `AIzaSy...`) — sẽ dùng ở Bước 3.

## Bước 2 — Cài Wrangler & đăng nhập Cloudflare (miễn phí)

```bash
cd cloudflare-worker
npm install -g wrangler
wrangler login
```

Lệnh `wrangler login` sẽ mở trình duyệt để bạn đăng nhập/đăng ký tài khoản
Cloudflare (free, không cần thẻ).

## Bước 3 — Lưu API key làm secret (không lưu trong code)

```bash
wrangler secret put GEMINI_API_KEY
```

Dán API key từ Bước 1 vào khi được hỏi, nhấn Enter.

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

Lưu file — PTX AI Assistant sẽ tự động gọi Gemini cho mọi câu hỏi không khớp
8 nhánh rule-based có sẵn (bảng xếp hạng, vua phá lưới, thời tiết, lịch thi
đấu, tra cứu cầu thủ, đội bóng, dự đoán vô địch, điều lệ).

## Kiểm tra nhanh (không cần mở web)

```bash
curl -X POST https://ptx-ai-proxy.<your-subdomain>.workers.dev \
  -H "Content-Type: application/json" \
  -H "Origin: https://ptxsummercup.vn" \
  -d '{"message":"Cho tôi lời khuyên chiến thuật","grounding":{}}'
```

Nếu thấy `{"reply": "..."}` là proxy đã hoạt động.

## Giới hạn free tier (tham khảo)

- **Cloudflare Workers free**: 100.000 request/ngày.
- **Gemini free tier**: có giới hạn request/phút tùy model, đủ dùng cho quy
  mô 1 giải đấu nội bộ. Nếu vượt giới hạn, Gemini trả lỗi và bot sẽ tự động
  fallback về câu "chưa có dữ liệu" — trang web không bao giờ bị lỗi.

## Cập nhật / rollback

Sửa `worker.js` xong chạy lại `wrangler deploy` là cập nhật. Muốn gỡ hoàn
toàn: `wrangler delete` rồi xóa `PTX_AI_PROXY_URL` trong `index.html`.
