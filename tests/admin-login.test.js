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

        // ------------------------------------------------------------
        // Mật khẩu admin phải đổi ĐỒNG THỜI ở hai nơi
        // ------------------------------------------------------------
        // Mật khẩu này vừa mở trang Admin (hash trong localStorage) vừa là mật khẩu tài
        // khoản Firebase Auth mà signInAdmin() dùng để được phép GHI lên Firestore. Bản
        // trước chỉ ghi localStorage: lần đăng nhập sau vào được trang Admin nhưng Firebase
        // trượt, auth.currentUser rỗng, push() bỏ qua mọi thay đổi — người dùng sửa tỉ số,
        // thấy giao diện đổi, tưởng xong, mà không có gì lên cloud và máy kia không thấy.
        // Các test dưới đây khoá đúng bất biến: KHÔNG bao giờ để hai bên lệch nhau trong
        // im lặng.
        const coApiCloud = await page.evaluate(() => typeof ptxCloudSync.changeAdminCloudPassword === 'function');
        assert(coApiCloud, 'ptxCloudSync có API đổi mật khẩu Firebase (changeAdminCloudPassword)');

        // Thay showToast và lớp cloud bằng bản giả để chạy được mà không cần Firebase thật.
        const thuDoiMatKhau = (matKhau, ketQuaCloud) => page.evaluate(async ({ pw, kq }) => {
            window.__toasts = [];
            window.showToast = (m, t) => window.__toasts.push({ m, t });
            ptxCloudSync.changeAdminCloudPassword = async () => kq;
            document.getElementById('admin-new-pass').value = pw;
            const truoc = localStorage.getItem('ptx_admin_hash');
            await window.changeAdminPassword();
            const sau = localStorage.getItem('ptx_admin_hash');
            return {
                giuNguyen: truoc === sau,
                // Chặt hơn "có đổi không": hash phải bằng ĐÚNG hash của mật khẩu mới.
                khopMatKhauMoi: sau === await window.hashPassword(pw),
                toasts: window.__toasts,
                oConTrong: document.getElementById('admin-new-pass').value === ''
            };
        }, { pw: matKhau, kq: ketQuaCloud });

        // Mỗi ca dùng một mật khẩu riêng. Dùng chung một chuỗi thì hash mới trùng hash cũ,
        // và phép kiểm "hash có đổi không" luôn báo sai dù hàm chạy đúng.

        const hashGoc = await page.evaluate(() => localStorage.getItem('ptx_admin_hash'));

        // Firebase Auth từ chối mật khẩu dưới 6 ký tự, nên UI cũng phải chặn từ 6 —
        // cho qua 4 ký tự là đổi được cục bộ mà Firebase từ chối, tức lệch ngay.
        const quaNgan = await thuDoiMatKhau('abc12', { ok: true });
        assert(quaNgan.giuNguyen, 'Mật khẩu dưới 6 ký tự bị từ chối, hash cục bộ không đổi');
        assert(/6 ký tự/.test((quaNgan.toasts[0] || {}).m || ''),
            `Báo rõ yêu cầu tối thiểu 6 ký tự ("${((quaNgan.toasts[0] || {}).m || '').slice(0, 45)}")`);

        // Trường hợp cốt lõi: Firebase từ chối vì lý do sửa được → tuyệt đối KHÔNG đổi cục bộ.
        const phienQuaCu = await thuDoiMatKhau('mat-khau-ca-A-2026', { ok: false, reason: 'auth/requires-recent-login' });
        assert(phienQuaCu.giuNguyen,
            'Firebase từ chối (phiên quá cũ) thì hash cục bộ GIỮ NGUYÊN — hai bên không lệch');
        assert(/đăng nhập lại/i.test((phienQuaCu.toasts[0] || {}).m || ''),
            'Báo cho người dùng cách xử lý khi phiên quá cũ (đăng nhập lại)');
        assert(((phienQuaCu.toasts[0] || {}).t) !== 'success',
            'Firebase lỗi thì KHÔNG báo thành công');

        const loiKhac = await thuDoiMatKhau('mat-khau-ca-B-2026', { ok: false, reason: 'auth/network-request-failed' });
        assert(loiKhac.giuNguyen, 'Lỗi Firebase khác cũng giữ nguyên hash cục bộ');

        // Chưa nối Firebase thì không có gì để lệch — không được chặn oan.
        const khongCoFirebase = await thuDoiMatKhau('mat-khau-ca-C-2026', { ok: false, reason: 'not-configured' });
        assert(khongCoFirebase.khopMatKhauMoi, 'Máy chưa nối Firebase thì vẫn đổi được mật khẩu cục bộ');
        assert(((khongCoFirebase.toasts[0] || {}).t) === 'success', 'Trường hợp không có Firebase báo thành công');

        // Chưa đăng nhập Firebase: vẫn đổi cục bộ (đó là cửa vào trang Admin) nhưng phải
        // nói thẳng là đồng bộ cloud sẽ tắt — im lặng ở đây chính là lỗi cũ.
        const chuaDangNhap = await thuDoiMatKhau('mat-khau-ca-D-2026', { ok: false, reason: 'not-signed-in' });
        assert(chuaDangNhap.khopMatKhauMoi, 'Chưa đăng nhập Firebase thì vẫn đổi được mật khẩu cục bộ');
        assert(((chuaDangNhap.toasts[0] || {}).t) === 'warning',
            'Chưa đăng nhập Firebase thì CẢNH BÁO chứ không báo thành công');
        assert(/cũ/i.test((chuaDangNhap.toasts[0] || {}).m || ''),
            'Cảnh báo nói rõ tài khoản Firebase vẫn giữ mật khẩu cũ');

        // Đường thành công: đổi cả hai nơi.
        const thanhCong = await thuDoiMatKhau('mat-khau-ca-E-2026', { ok: true });
        assert(thanhCong.khopMatKhauMoi, 'Firebase đổi được thì hash cục bộ cũng đổi theo, đúng mật khẩu mới');
        assert(((thanhCong.toasts[0] || {}).t) === 'success' && /Firebase/.test((thanhCong.toasts[0] || {}).m || ''),
            'Báo rõ đã đổi ở CẢ hai nơi');
        assert(thanhCong.oConTrong, 'Đổi xong thì xoá ô nhập, không để mật khẩu nằm lại trên màn hình');

        // Trả lại hash gốc cho các test bên dưới (chúng đăng nhập bằng MAT_KHAU_TEST).
        // Cố ý KHÔNG reload trang: các test khóa bên dưới dựa vào trạng thái modal đã mở từ
        // đầu, reload sẽ đóng nó lại. Bản giả showToast/changeAdminCloudPassword còn sót lại
        // cũng vô hại — luồng khóa chỉ đọc #loginError chứ không đọc toast.
        await page.evaluate((h) => localStorage.setItem('ptx_admin_hash', h), hashGoc);

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
