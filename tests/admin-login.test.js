const { withPage, assert, BASE_URL } = require('./test-utils');

module.exports = async function runAdminLoginTests(browser) {
    console.log('\n🔐 [Nhóm] Đăng nhập Admin & khóa tạm thời');

    await withPage(browser, async (page, { pageErrors }) => {
        await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForTimeout(1000);
        await page.evaluate(() => localStorage.clear());
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);
        await page.evaluate(() => window.openLogin());
        await page.waitForTimeout(200);

        // Chỉ còn ĐÚNG 1 định nghĩa changeAdminPassword, và phải dùng hash (không dùng prompt/plaintext)
        const fnSource = await page.evaluate(() => window.changeAdminPassword.toString());
        assert(!fnSource.includes('prompt('), 'changeAdminPassword() không dùng prompt() (không an toàn)');
        assert(!fnSource.includes("'ptx_admin_pass'"), 'changeAdminPassword() không lưu vào key plaintext cũ');
        assert(fnSource.includes('hashPassword'), 'changeAdminPassword() dùng hashPassword() (băm SHA-256+salt)');

        // Khóa sau 5 lần sai
        for (let i = 0; i < 5; i++) {
            await page.evaluate((val) => {
                const u = document.getElementById('userInput');
                const p = document.getElementById('passInput');
                if (u) u.value = 'admin';
                if (p) p.value = val;
            }, 'sai-mat-khau-' + i);
            await page.evaluate(() => window.handleLogin());
            await page.waitForTimeout(150);
        }
        const errText = await page.evaluate(() => document.getElementById('loginError').textContent);
        assert(errText.includes('khóa') || errText.includes('Khóa') || errText.includes('⛔'),
            `Bị khóa đúng sau 5 lần sai (thông báo: "${errText}")`);

        // Đúng mật khẩu vẫn bị chặn trong lúc khóa
        await page.evaluate(() => {
            const u = document.getElementById('userInput');
            const p = document.getElementById('passInput');
            if (u) u.value = 'admin';
            if (p) p.value = 'ptx2026';
        });
        await page.evaluate(() => window.handleLogin());
        await page.waitForTimeout(150);
        const loggedIn = await page.evaluate(() => localStorage.getItem('adminLoggedIn'));
        assert(loggedIn !== 'true', 'Không đăng nhập được dù đúng mật khẩu, vì đang bị khóa tạm thời');

        assert(pageErrors.length === 0, `Không có uncaught exception trong luồng login: ${pageErrors.length} lỗi`);
    });
};
