// ============================================================
// PTX Summer Cup 2026 — Bộ chạy test tự động (không phụ thuộc @playwright/test,
// chỉ cần package "playwright" lõi — nhẹ, không cần cấu hình phức tạp)
// ============================================================
// Chạy: npm test  (hoặc: node tests/run-tests.js)
// Yêu cầu: đã chạy `npx playwright install chromium` ít nhất 1 lần trước đó.

const { chromium } = require('playwright');
const { spawn } = require('child_process');
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

const http = require('http');
const fs = require('fs');

async function withServer(fn) {
    const server = http.createServer((req, res) => {
        let filePath = path.join(PROJECT_ROOT, decodeURIComponent(req.url.split('?')[0]));
        if (filePath.endsWith('/') || fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
            filePath = path.join(filePath, 'index.html');
        }
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('Not Found');
                return;
            }
            const ext = path.extname(filePath).toLowerCase();
            const mimeTypes = {
                '.html': 'text/html',
                '.js': 'text/javascript',
                '.css': 'text/css',
                '.json': 'application/json',
                '.webp': 'image/webp',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.svg': 'image/svg+xml',
                '.mp4': 'video/mp4'
            };
            res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
            res.end(data);
        });
    });

    let started = false;
    try {
        await new Promise((resolve, reject) => {
            server.on('error', (err) => {
                if (err.code === 'EADDRINUSE') {
                    resolve(); // Port already in use by running server, proceed to test
                } else {
                    reject(err);
                }
            });
            server.listen(PORT, () => {
                started = true;
                resolve();
            });
        });
        await fn();
    } finally {
        if (started) {
            await new Promise(resolve => server.close(resolve));
        }
    }
}

async function withPage(browser, fn, { blockMedia = true } = {}) {
    const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    const page = await context.newPage();
    const pageErrors = [];
    const consoleErrors = [];
    // Giữ cả stack, không chỉ câu thông báo.
    //
    // "TypeError: Cannot set properties of null" mà không có stack thì gần như vô dụng:
    // trong một file 17.000 dòng có hàng chục chỗ có thể sinh ra đúng câu đó, và người
    // đọc log phải đi đoán. Dòng đầu của stack chỉ thẳng ra hàm và số dòng.
    page.on('pageerror', (err) => {
        const noi = (err && err.stack ? String(err.stack).split('\n')[1] : '') || '';
        pageErrors.push(String(err) + (noi ? ` @${noi.trim()}` : ''));
    });
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
