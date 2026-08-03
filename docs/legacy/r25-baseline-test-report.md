# R25 Baseline Test Report

> **Module:** M-01 — Legacy Audit & Freeze
> **Purpose:** Establish a reproducible baseline of legacy test results BEFORE any migration/re-platform work touches the app, so M12's regression check has a known-good reference point.
> **Environment:** Windows, Node v26.5.0, npm 12.0.1, Playwright ^1.56.0 (chromium-headless-shell 1234 installed during this audit).

## Commands run

```bash
npm install
npx playwright install chromium
npm test
```

## Result

**15 PASS / 1 FAIL (16 total)**, test suite `node tests/run-tests.js` (custom lightweight runner, not `@playwright/test`).

```
📝 Kiểm tra cú pháp JavaScript trong index.html
  ✅ Tất cả 9 script block trong index.html hợp lệ về cú pháp

🖼️  Đối chiếu file media (ảnh/video) với tham chiếu trong code
  ✅ 0 link gãy (53 tham chiếu, tìm thấy 0 gãy)
  ✅ 0 file mồ côi (53 file thật, 0 không được dùng)

📄 Tải trang chủ & điều hướng giữa các trang
  ✅ Tiêu đề trang đúng định dạng (thực tế: "PTX Summer Cup 2026 2.0 - Trang chủ")
  ✅ Điều hướng qua 12 trang chính không bị treo
  ❌ Không có console error thật (ngoài lỗi tải ảnh/video bị chặn chủ đích): 1 lỗi
  ✅ Không có uncaught exception: 0 lỗi

🔐 Đăng nhập Admin & khóa tạm thời
  ✅ changeAdminPassword() không dùng prompt() (không an toàn)
  ✅ changeAdminPassword() không lưu vào key plaintext cũ
  ✅ changeAdminPassword() dùng hashPassword() (băm SHA-256+salt)
  ✅ Bị khóa đúng sau 5 lần sai
  ✅ Không đăng nhập được dù đúng mật khẩu, vì đang bị khóa tạm thời
  ✅ Không có uncaught exception trong luồng login: 0 lỗi

🔑 reset-admin.html — cổng Mã khôi phục
  ✅ Chặn reset khi gọi thẳng hàm mà chưa qua Mã khôi phục
  ✅ Form đặt lại mật khẩu vẫn ẩn khi mã khôi phục sai
  ✅ Không có uncaught exception: 0 lỗi
```

## Root cause of the 1 failure (analyzed, not a fixable app bug)

The test harness (`tests/test-utils.js:55-60`) routes all page requests through `page.route('**/*', ...)` and **aborts any request whose URL does not start with the local `http://localhost:8123` base** — this intentionally blocks image/media/font loads for speed, but as a side effect it also blocks the Firebase SDK CDN script (`firebase-app-compat.js` etc., loaded from `gstatic.com`).

`ptxCloudSync.init()` (index.html:6617-6637) checks whether the `firebase` global exists; when the SDK failed to load (blocked by the harness), it logs:
```js
console.error('[PTX Cloud Sync] Không tìm thấy Firebase SDK (kiểm tra kết nối mạng / thẻ <script> firebase).');
```
at index.html:6623. This is the exact "1 lỗi" counted by `navigation.test.js`'s `realConsoleErrors` filter (which excludes `Failed to load resource` messages but does not exclude this specific app-level `console.error`).

**Conclusion: this is a test-harness artifact (external CDN request blocked by design), not a product defect.** It is pre-existing in the current test suite (this is the state of the suite as delivered, not something introduced by this audit) and does not block M-01's Gate. It is documented here as-is per the "preserve R25 as an immutable reference" rule — no attempt was made to alter legacy code or the legacy test suite to make this pass, since M-01 is audit-only.

## Test suite composition (for M12 regression-check reuse)

7 files in `tests/`: `test-utils.js` (harness), `run-tests.js` (orchestrator), `syntax-check.test.js`, `media-integrity.test.js`, `navigation.test.js`, `admin-login.test.js`, `reset-admin.test.js`. `workflows/ci.yml` runs this suite on push/PR via GitHub Actions (Node 18, `deploy-staging`/`deploy-production` jobs are currently no-op placeholders).

`media-integrity.test.js`'s broken-link/orphan-file logic against `thư viện/` is directly reusable as an M-02 asset-migration verification step (same zero-broken/zero-orphan invariant applies to the Supabase Storage destination).

## Baseline invariant for M12

Any dependent module's regression check must show these same 15 passing legacy assertions still conceptually hold in the new stack (adapted to the new architecture — e.g. "admin login locks out after 5 attempts" becomes a Supabase-Auth-backed test, not a literal port of the legacy assertion), and the 1 known non-blocking harness artifact must not be miscounted as a new regression.
