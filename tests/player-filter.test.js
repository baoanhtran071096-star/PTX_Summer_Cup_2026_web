// ============================================================
// Trang Thẻ cầu thủ FIFA — lọc theo đội
// ============================================================
// Ba nút "Team P / Team T / Team X" không lọc gì cả: renderPlayerCards() liệt kê
// ba vùng chứa, nhưng vùng thứ ba lại trỏ về đúng #playerGridFifaPage của vùng
// thứ hai với isPage:false. Vùng hai vẽ 8 thẻ đã lọc, vùng ba vẽ đè lại đủ 24 —
// người dùng bấm nút thấy y nguyên 24 thẻ, tưởng nút chết.
//
// Test bấm THẲNG vào nút như người dùng, không gọi hàm lọc, để phủ luôn cả phần
// gắn sự kiện lẫn phần render.

const { withPage, assert, BASE_URL } = require('./test-utils');

module.exports = async function runPlayerFilterTests(browser) {
    console.log('\n🃏 [Nhóm] Thẻ cầu thủ FIFA — lọc theo đội');

    await withPage(browser, async (page, { pageErrors }) => {
        await page.goto(`${BASE_URL}/index.html#players`, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForTimeout(2500);
        await page.evaluate(() => navigateToPage('players'));
        await page.waitForTimeout(800);

        const readGrid = () => page.evaluate(() => {
            const cards = [...document.querySelectorAll('#playerGridFifaPage .player-card-fifa')];
            const teams = cards.map(c => {
                const name = (c.querySelector('.p-name') || {}).textContent || '';
                const p = PLAYERS_DATA.find(x => name.includes(x.name));
                return p ? p.team : '?';
            });
            return {
                count: cards.length,
                teams: [...new Set(teams)].sort().join(','),
                activeBtn: (document.querySelector('.fifa-team-btn.active') || {}).textContent || '',
                homeCount: document.querySelectorAll('#playerGridFifaHome .player-card-fifa').length
            };
        });

        const clickTeam = label => page.evaluate(text => {
            const btn = [...document.querySelectorAll('.fifa-team-btn')].find(b => b.textContent.includes(text));
            if (btn) btn.click();
            return !!btn;
        }, label);

        const all = await readGrid();
        assert(all.count === 24 && all.teams === 'p,t,x',
            `Mặc định hiện đủ 24 thẻ của cả 3 đội (${all.count} thẻ)`);

        for (const [label, teamId] of [['Team P', 'p'], ['Team T', 't'], ['Team X', 'x']]) {
            const found = await clickTeam(label);
            await page.waitForTimeout(300);
            const g = await readGrid();
            const expected = await page.evaluate(id => PLAYERS_DATA.filter(p => p.team === id).length, teamId);
            assert(found && g.count === expected && g.teams === teamId,
                `Bấm "${label}" chỉ còn ${g.count} thẻ của đúng đội đó (kỳ vọng ${expected}, thấy đội: ${g.teams})`);
            assert(g.activeBtn.includes(label),
                `Nút "${label}" được đánh dấu đang chọn`);
            // Lưới ở Trang chủ dùng chung hàm render nhưng KHÔNG được lọc theo bộ lọc
            // của trang Cầu thủ — nó luôn giới thiệu đủ đội hình.
            assert(g.homeCount === 24,
                `Lưới thẻ ở Trang chủ vẫn đủ 24 thẻ khi lọc ở trang Cầu thủ (${g.homeCount})`);
        }

        await clickTeam('Tất cả Đội');
        await page.waitForTimeout(300);
        const back = await readGrid();
        assert(back.count === 24 && back.teams === 'p,t,x',
            `Bấm "Tất cả Đội" quay lại đủ 24 thẻ (${back.count} thẻ)`);

        assert(pageErrors.length === 0, `Không có uncaught exception khi lọc: ${pageErrors.length} lỗi`);
    });
};
