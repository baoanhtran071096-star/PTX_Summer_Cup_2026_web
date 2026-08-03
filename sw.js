// ============================================================
// PTX Summer Cup 2026 — Service Worker v2.0 (Cache-Busted)
// ============================================================

const CACHE_NAME = 'ptx-cup-2026-v2-r13';
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

    // Network-first for all HTML & JS requests to guarantee fresh R11 release
    if (url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname.endsWith('.js')) {
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
