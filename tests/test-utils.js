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

async function withServer(fn) {
    const server = spawn('python3', ['-m', 'http.server', String(PORT)], {
        cwd: PROJECT_ROOT,
        stdio: 'ignore',
    });
    // Đợi server sẵn sàng
    await new Promise(resolve => setTimeout(resolve, 800));
    try {
        await fn();
    } finally {
        server.kill();
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
