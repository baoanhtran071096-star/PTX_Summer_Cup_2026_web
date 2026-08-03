// ============================================================
// PTX Summer Cup 2026 — Bộ chạy test tự động (không phụ thuộc @playwright/test,
// chỉ cần package "playwright" lõi — nhẹ, không cần cấu hình phức tạp)
// ============================================================
// Chạy: npm test  (hoặc: node tests/run-tests.js)
// Yêu cầu: đã chạy `npx playwright install chromium` ít nhất 1 lần trước đó.

const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8123;
const BASE_URL = `http://localhost:${PORT}`;
const PROJECT_ROOT = path.resolve(__dirname, '..');

let passCount = 0;
let failCount = 0;
const failures = [];

function assert(condition, message) {
    if (condition) {
        passCount++;
        console.log(`  ✅ ${message}`);
    } else {
        failCount++;
        failures.push(message);
        console.log(`  ❌ ${message}`);
    }
}

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
};

// Minimal static file server standing in for `python3 -m http.server`,
// which relies on a `python3` binary that is not a working interpreter in
// every environment (e.g. an unconfigured Windows App Execution Alias
// stub) — this removes that external dependency entirely.
function createStaticServer(rootDir) {
    return http.createServer((req, res) => {
        try {
            const urlPath = decodeURIComponent(req.url.split('?')[0]);
            let relPath = urlPath === '/' ? '/index.html' : urlPath;
            const filePath = path.join(rootDir, relPath);
            if (!filePath.startsWith(rootDir)) {
                res.writeHead(403);
                res.end('Forbidden');
                return;
            }
            if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
                res.writeHead(404);
                res.end('Not found');
                return;
            }
            const ext = path.extname(filePath).toLowerCase();
            res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
            fs.createReadStream(filePath).pipe(res);
        } catch (err) {
            res.writeHead(500);
            res.end(String(err));
        }
    });
}

async function withServer(fn) {
    const server = createStaticServer(PROJECT_ROOT);
    await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(PORT, resolve);
    });
    try {
        await fn();
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
}

async function withPage(browser, fn, { blockMedia = true } = {}) {
    const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    const page = await context.newPage();
    const pageErrors = [];
    const consoleErrors = [];
    page.on('pageerror', (err) => pageErrors.push(String(err)));
    page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.route('**/*', (route) => {
        const req = route.request();
        if (!req.url().startsWith(BASE_URL)) return route.abort();
        if (blockMedia && ['image', 'media', 'font'].includes(req.resourceType())) return route.abort();
        return route.continue();
    });

    try {
        await fn(page, { pageErrors, consoleErrors });
    } finally {
        await context.close();
    }
}

module.exports = { chromium, withServer, withPage, assert, BASE_URL, PROJECT_ROOT,
    getSummary: () => ({ passCount, failCount, failures }) };
