// ============================================================
// PTX Summer Cup 2026 — Service Worker v2.0 (Cache-Busted)
// ============================================================

// Đổi tên cache sẽ khiến handler 'activate' xoá sạch các cache cũ. BẮT BUỘC phải
// đổi lần này: mọi khách đã từng mở trang đang giữ bản HTML cũ trong cache
// 'ptx-cup-2026-v2-r13' và sẽ không bao giờ tự thoát ra được (xem ghi chú ở
// handler 'fetch' bên dưới).
const CACHE_NAME = 'ptx-cup-2026-v3-navfix';
const STATIC_ASSETS = [
    './index.html',
    './manifest.json',
    './thư viện/logo biểu tượng 3 đội/Biểu tượng đội P (Phoenix).webp',
    './thư viện/logo biểu tượng 3 đội/Biểu tượng đội T (Tiger).webp',
    './thư viện/logo biểu tượng 3 đội/Biểu tượng đội X (Xiphias Gladius).webp',
    './thư viện/ảnh logo - banner/Logo PTX.webp',
    './thư viện/ảnh logo - banner/icon-192.webp',
    './thư viện/ảnh logo - banner/icon-512.webp',
    './thư viện/ảnh logo - banner/Logo Công Đoàn.webp',
    './thư viện/ảnh logo - banner/banner PTX Summer Cup.webp'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS).catch(() => {}))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log('[SW] Purging old cache:', key);
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    if (event.request.method !== 'GET' || url.origin !== location.origin) return;

    // Ưu tiên mạng cho mọi lần MỞ TRANG, file .html và .js — để khách luôn nhận bản mới.
    //
    // ⚠️ Điều kiện cũ là `url.pathname === '/'`, và đó là một lỗi nặng: nó chỉ đúng khi
    // trang nằm ở GỐC tên miền. Trên GitHub Pages trang nằm trong thư mục con, đường dẫn
    // là '/PTX_Summer_Cup_2026_web/' — không kết thúc bằng .html, không bằng '/', không
    // bằng .js — nên rơi xuống nhánh cache-first phía dưới. Hậu quả: mọi khách đã từng mở
    // trang bị KẸT VĨNH VIỄN ở bản HTML cũ, dù máy chủ đã có bản mới từ lâu. Đã đo thực
    // tế: trang thật trả về bản đã sửa qua curl, nhưng trình duyệt có service worker vẫn
    // hiển thị bản cũ với đúng những lỗi tưởng đã vá xong.
    // Trên Firebase (ptx-summer-cup-2026.web.app) đường dẫn đúng là '/' nên không dính —
    // vì vậy lỗi chỉ xuất hiện ở một trong hai nơi host, càng khó nhận ra.
    //
    // Dùng `request.mode === 'navigate'` thay cho việc đoán theo đường dẫn: trình duyệt
    // đánh dấu như vậy cho MỌI lần điều hướng tới một trang, bất kể URL nằm ở đâu.
    if (event.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('.js')) {
        event.respondWith(
            fetch(event.request).then((response) => {
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                }
                return response;
            }).catch(() => caches.match(event.request))
        );
        return;
    }

    // Cache-first for static images
    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) return cached;
            return fetch(event.request).then((response) => {
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                }
                return response;
            }).catch(() => cached || new Response('', { status: 404 }));
        })
    );
});
