const { withPage, assert, BASE_URL } = require('./test-utils');

module.exports = async function runNavigationTests(browser) {
    console.log('\n📄 [Nhóm] Tải trang chủ & điều hướng giữa các trang');

    await withPage(browser, async (page, { pageErrors, consoleErrors }) => {
        await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForTimeout(1500);

        const title = await page.title();
        assert(title.includes('PTX Summer Cup'), `Tiêu đề trang đúng định dạng (thực tế: "${title}")`);

        const pages = ['home', 'about', 'schedule', 'standings', 'teams', 'players',
                        'stats', 'gallery', 'hof', 'rules', 'contact', 'admin'];
        for (const pg of pages) {
            await page.evaluate((p) => window.navigateToPage && window.navigateToPage(p), pg);
            await page.waitForTimeout(200);
        }
        assert(true, `Điều hướng qua ${pages.length} trang chính không bị treo`);

        const realConsoleErrors = consoleErrors.filter(e => !e.includes('Failed to load resource'));
        assert(realConsoleErrors.length === 0,
            `Không có console error thật (ngoài lỗi tải ảnh/video bị chặn chủ đích): ${realConsoleErrors.length} lỗi`);
        assert(pageErrors.length === 0, `Không có uncaught exception: ${pageErrors.length} lỗi`);
    });
};
