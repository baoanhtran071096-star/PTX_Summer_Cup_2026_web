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

        // Máy sạch thì KHÔNG được có sẵn tài khoản nào. Trước đây trang tự gieo
        // admin/ptx2026 — mật khẩu nằm nguyên văn trong repo công khai, và ai xoá dữ liệu
        // site trên máy mình cũng được gieo lại đúng mật khẩu đó rồi vào thẳng trang Admin.
        const chuaCoTaiKhoan = await page.evaluate(() =>
            !localStorage.getItem('ptx_admin_hash') && !localStorage.getItem('ptx_admin_user'));
        assert(chuaCoTaiKhoan, 'Máy chưa thiết lập thì không có tài khoản admin nào được tạo sẵn');

        await page.evaluate(() => { window.handleLogin(); });
        await page.waitForTimeout(200);
        const huongDan = await page.evaluate(() => document.getElementById('loginError').textContent);
        assert(/reset-admin/i.test(huongDan),
            `Chưa có tài khoản thì báo rõ cách thiết lập lần đầu ("${huongDan.trim().slice(0, 70)}…")`);

        // Tự dựng tài khoản cho phần test khóa bên dưới, thay vì dựa vào mật khẩu
        // mặc định nào đó của sản phẩm.
        const MAT_KHAU_TEST = 'mat-khau-kiem-thu-2026';
        await page.evaluate(async (pw) => {
            localStorage.setItem('ptx_admin_user', 'admin');
            localStorage.setItem('ptx_admin_hash', await window.hashPassword(pw));
        }, MAT_KHAU_TEST);

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
        await page.evaluate((pw) => {
            const u = document.getElementById('userInput');
            const p = document.getElementById('passInput');
            if (u) u.value = 'admin';
            if (p) p.value = pw;
        }, MAT_KHAU_TEST);
        await page.evaluate(() => window.handleLogin());
        await page.waitForTimeout(150);
        const loggedIn = await page.evaluate(() => localStorage.getItem('adminLoggedIn'));
        assert(loggedIn !== 'true', 'Không đăng nhập được dù đúng mật khẩu, vì đang bị khóa tạm thời');

        assert(pageErrors.length === 0, `Không có uncaught exception trong luồng login: ${pageErrors.length} lỗi`);
    });
};
