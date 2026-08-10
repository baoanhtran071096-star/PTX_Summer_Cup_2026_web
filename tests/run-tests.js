// ============================================================
// PTX Summer Cup 2026 — Chạy toàn bộ test tự động
// Dùng: npm test
// ============================================================
const { chromium, withServer, getSummary } = require('./test-utils');

const runSyntaxTests = require('./syntax-check.test.js');
const runMediaIntegrityTests = require('./media-integrity.test.js');
const runNavigationTests = require('./navigation.test.js');
const runMatchDataTests = require('./match-data.test.js');
const runAdminLoginTests = require('./admin-login.test.js');
const runResetAdminTests = require('./reset-admin.test.js');
const runWeatherCardTests = require('./weather-card.test.js');

async function main() {
    console.log('🧪 PTX Summer Cup 2026 — Bộ test tự động\n' + '='.repeat(50));

    // Các test không cần trình duyệt / server
    await runSyntaxTests();
    await runMediaIntegrityTests();

    // Các test cần server tĩnh + trình duyệt thật
    await withServer(async () => {
        const browser = await chromium.launch();
        try {
            await runNavigationTests(browser);
            await runMatchDataTests(browser);
            await runWeatherCardTests(browser);
            await runAdminLoginTests(browser);
            await runResetAdminTests(browser);
        } finally {
            await browser.close();
        }
    });

    const { passCount, failCount, failures } = getSummary();
    console.log('\n' + '='.repeat(50));
    console.log(`📊 KẾT QUẢ: ${passCount} PASS / ${failCount} FAIL (tổng ${passCount + failCount})`);
    if (failCount > 0) {
        console.log('\n❌ Các test thất bại:');
        failures.forEach(f => console.log('  - ' + f));
        process.exitCode = 1;
    } else {
        console.log('✅ Tất cả test đều PASS');
    }
}

main().catch(err => {
    console.error('💥 Lỗi khi chạy test suite:', err);
    process.exitCode = 1;
});
