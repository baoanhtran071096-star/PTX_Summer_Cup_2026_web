const { withPage, assert, BASE_URL } = require('./test-utils');

module.exports = async function runResetAdminTests(browser) {
    console.log('\n🔑 [Nhóm] reset-admin.html — cổng Mã khôi phục');

    await withPage(browser, async (page, { pageErrors }) => {
        await page.goto(`${BASE_URL}/reset-admin.html`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(500);

        // Gọi thẳng resetAdmin() qua console (mô phỏng hacker) mà chưa nhập mã khôi phục
        await page.evaluate(() => {
            document.getElementById('newUser').value = 'hacker';
            document.getElementById('newPass').value = '1234';
            document.getElementById('confirmPass').value = '1234';
            window.resetAdmin();
        });
        await page.waitForTimeout(200);
        let status = await page.evaluate(() => document.getElementById('status').textContent);
        assert(status.includes('xác thực') || status.includes('❌'),
            `Chặn reset khi gọi thẳng hàm mà chưa qua Mã khôi phục (thông báo: "${status}")`);

        // Sai mã khôi phục
        await page.evaluate(() => {
            const el = document.getElementById('recoveryCode');
            if (el) el.value = 'ma-sai-hoan-toan';
        });
        await page.evaluate(() => window.checkRecoveryCode());
        await page.waitForTimeout(200);
        const resetDisplay = await page.evaluate(() => document.getElementById('resetSection').style.display);
        assert(resetDisplay === 'none', 'Form đặt lại mật khẩu vẫn ẩn khi mã khôi phục sai');

        assert(pageErrors.length === 0, `Không có uncaught exception: ${pageErrors.length} lỗi`);
    });
};
