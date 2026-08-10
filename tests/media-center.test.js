// ============================================================
// AI Media Center — nội dung phải dựng từ dữ liệu giải
// ============================================================
// Bốn nút ở đây từng trả về bốn chuỗi ghi cứng, không đọc một byte dữ liệu nào:
// bấm "Báo cáo trận đấu" sau khi cả 3 trận đã đá xong vẫn ra đúng câu "Tổng quan
// trận đấu vừa công bố chính thức từ BTC" — không tỷ số, không người ghi bàn.
//
// Nội dung ở đây được người thật copy đem đăng lên trang cộng đồng của công ty,
// nên phần phải khoá chặt nhất là BẢN NHÁP dựng từ dữ liệu: mọi con số trong đó
// phải suy ra được từ kết quả trận đấu, không phải từ câu chữ viết sẵn.
//
// Test chạy trong môi trường chặn mọi request ra ngoài BASE_URL, nên lời gọi tới
// worker AI luôn thất bại. Đó chính là điều muốn kiểm: khi mô hình không phản hồi,
// người dùng vẫn phải nhận được bản nháp đúng số liệu chứ không phải ô trống.

const { withPage, assert, BASE_URL } = require('./test-utils');

module.exports = async function runMediaCenterTests(browser) {
    console.log('\n📰 [Nhóm] AI Media Center — nội dung dựng từ dữ liệu giải');

    await withPage(browser, async (page, { pageErrors }) => {
        await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForTimeout(2500);

        // --- Bản nháp báo cáo trận phải khớp đúng trận được chọn ---
        const reports = await page.evaluate(() => {
            return MATCHES_CONFIG.map(m => {
                const r = getMatchResult(m.id);
                const events = parseMatchEvents(localStorage.getItem('ptx_result_' + m.id), m);
                return {
                    id: m.id,
                    draft: buildMediaDraft('match_report', m.id),
                    score: `${TEAMS_DATA[m.home].name} ${r.homeScore} - ${r.awayScore} ${TEAMS_DATA[m.away].name}`,
                    scorers: events.filter(e => e.type === 'goal').map(e => `${e.scorer} ${e.minute}'`),
                    cards: events.filter(e => e.type === 'yellow' || e.type === 'red').map(e => `${e.scorer} ${e.minute}'`)
                };
            });
        });
        const badReports = reports.filter(r =>
            !r.draft.includes(r.score) ||
            !r.scorers.every(s => r.draft.includes(s)) ||
            !r.cards.every(c => r.draft.includes(c)));
        assert(badReports.length === 0,
            `Báo cáo trận chứa đúng tỷ số, toàn bộ người ghi bàn và thẻ phạt của cả ${reports.length} trận` +
            (badReports.length ? ` — thiếu ở trận ${badReports.map(r => r.id).join(', ')}` : ''));

        // Chọn trận nào thì ra báo cáo trận đó — không phải lúc nào cũng trận cuối.
        assert(reports[0].draft.includes(reports[0].score) && !reports[0].draft.includes(reports[2].score),
            `Chọn trận 1 ra báo cáo trận 1, không lẫn sang trận khác`);

        // --- Bản nháp danh hiệu phải khớp các hàm danh hiệu ---
        const awards = await page.evaluate(() => {
            const gk = getBestGoalkeeper();
            return {
                draft: buildMediaDraft('mvp_post', null),
                boot: getGoldenBoot().label,
                mvp: (getMostValuablePlayer() || {}).name || '',
                gk: gk ? gk.player.name : '',
                champion: calculateStandings()[0].fullName
            };
        });
        assert(awards.draft.includes(awards.boot) && awards.draft.includes(awards.mvp) &&
            awards.draft.includes(awards.gk) && awards.draft.includes(awards.champion),
            `Bài công bố danh hiệu ghi đúng MVP, vua phá lưới, thủ môn và nhà vô địch`);

        // --- Trạng thái giải phải nằm trong bản nháp ---
        // Thiếu dòng này thì mô hình mặc định viết "giải đang diễn ra" cho một giải
        // đã đá xong — lỗi đã gặp thật khi thử gọi mô hình lần đầu.
        const phase = await page.evaluate(() => ({
            phase: getTournamentStatus().phase,
            drafts: ['preview', 'match_report', 'mvp_post', 'social_caption'].map(t => buildMediaDraft(t, 3))
        }));
        assert(phase.drafts.every(d => /Trạng thái giải:/.test(d)),
            `Mọi bản nháp đều nêu trạng thái giải để mô hình không tự suy diễn`);
        assert(phase.phase !== 'finished' || phase.drafts.every(d => /đã kết thúc/.test(d)),
            `Giải đã xong thì bản nháp nói rõ là đã kết thúc`);

        // --- Mô hình không phản hồi thì vẫn phải có nội dung để đăng ---
        await page.evaluate(() => generateAiContent('match_report'));
        await page.waitForTimeout(1500);
        const afterFail = await page.evaluate(() => ({
            value: (document.getElementById('aiGeneratedOutput') || {}).value || '',
            status: (document.getElementById('aiMediaStatus') || {}).textContent || ''
        }));
        assert(afterFail.value.length > 80 && /BÁO CÁO TRẬN ĐẤU/.test(afterFail.value),
            `Mô hình AI không gọi được vẫn hiện bản nháp đầy đủ (${afterFail.value.length} ký tự)`);
        assert(/bản dựng thẳng từ dữ liệu/i.test(afterFail.status),
            `Có báo cho người dùng biết đang dùng bản dựng từ dữ liệu ("${afterFail.status.trim()}")`);

        // --- Không còn chuỗi ghi cứng cũ ---
        const stale = await page.evaluate(() =>
            ['preview', 'match_report', 'mvp_post', 'social_caption']
                .map(t => buildMediaDraft(t, 3))
                .filter(d => /vừa công bố chính thức từ BTC|Sẵn sàng bùng nổ|Nhấn copy để đăng tin/.test(d)).length);
        assert(stale === 0, `Không còn chuỗi mẫu ghi cứng nào trong nội dung sinh ra`);

        // ----------------------------------------------------------
        // Modal tiện ích phải TỒN TẠI trong DOM
        // ----------------------------------------------------------
        // Năm modal ở menu "Tiện ích" từng bị dán nhầm vào bên trong chuỗi template của
        // exportOfficialMatchReport(), tức chúng chỉ là chữ trong một biến JavaScript chứ
        // không phải phần tử HTML. Hậu quả kép: bấm nút mở thì openXxxModal() nhận null
        // và không làm gì cả — nút chết lặng, không báo lỗi; đồng thời toàn bộ markup đó
        // bị chèn vào file Biên bản giải đấu xuất ra để in.
        const MODALS = ['aiMediaCenterModal', 'audioCenterModal', 'exportCenterModal',
            'sponsorSupportModal', 'varSimulatorModal'];
        const modalState = await page.evaluate(ids => {
            const missing = ids.filter(id => !document.getElementById(id));
            let opened = null;
            if (typeof openAiMediaCenterModal === 'function') {
                openAiMediaCenterModal();
                const m = document.getElementById('aiMediaCenterModal');
                opened = m ? m.style.display : null;
            }
            return { missing, opened, matchOptions: (document.getElementById('aiMediaMatchSelect') || { options: [] }).options.length };
        }, MODALS);
        assert(modalState.missing.length === 0,
            `Cả ${MODALS.length} modal tiện ích đều tồn tại trong DOM` +
            (modalState.missing.length ? ` — thiếu: ${modalState.missing.join(', ')}` : ''));
        assert(modalState.opened === 'flex',
            `Mở được AI Media Center bằng nút (display = "${modalState.opened}")`);
        assert(modalState.matchOptions > 0,
            `Ô chọn trận được nạp danh sách trận (${modalState.matchOptions} lựa chọn)`);

        // Tồn tại trong DOM thôi chưa đủ. Lớp .modal từng không có một dòng CSS nào, nên
        // đặt display:flex chỉ tạo ra một khối position:static nằm lọt ở CUỐI trang: bấm
        // nút xong màn hình không đổi gì, người dùng báo "không thao tác được".
        const overlay = await page.evaluate(ids => ids.map(id => {
            const m = document.getElementById(id);
            m.style.display = 'flex';
            const cs = getComputedStyle(m);
            const r = m.getBoundingClientRect();
            const card = m.querySelector('.modal-content');
            const cardCs = card ? getComputedStyle(card) : null;
            m.style.display = 'none';
            return {
                id,
                fixed: cs.position === 'fixed',
                z: parseInt(cs.zIndex) || 0,
                phuKin: r.width >= window.innerWidth - 2 && r.height >= window.innerHeight - 2,
                // Thẻ phải tối ở CẢ hai giao diện: chữ và nút bên trong đặt cứng màu trắng,
                // nếu nền thẻ lật sang trắng theo giao diện Sáng thì nút "Đóng" tàng hình.
                theToi: cardCs ? cardCs.backgroundColor === 'rgb(17, 24, 39)' : false
            };
        }), MODALS);
        const badOverlay = overlay.filter(o => !o.fixed || o.z < 1000 || !o.phuKin || !o.theToi);
        assert(badOverlay.length === 0,
            `Cả ${MODALS.length} modal mở ra là lớp phủ cố định, phủ kín màn hình, thẻ tối ở mọi giao diện` +
            (badOverlay.length ? ` — sai ở ${badOverlay.map(o => o.id).join(', ')}` : ''));

        // Biên bản giải đấu xuất ra không được dính markup của các modal đó.
        const report = await page.evaluate(ids => {
            let captured = '';
            const realOpen = window.open;
            window.open = () => ({ document: { write: h => { captured = h; }, close() {} } });
            try { exportOfficialMatchReport(); } finally { window.open = realOpen; }
            return {
                leaked: ids.filter(id => captured.includes(id)),
                bodies: (captured.match(/<\/body>/g) || []).length,
                length: captured.length
            };
        }, MODALS);
        assert(report.leaked.length === 0,
            `Biên bản giải đấu xuất ra không lẫn markup modal (${report.length} ký tự)` +
            (report.leaked.length ? ` — lẫn: ${report.leaked.join(', ')}` : ''));
        assert(report.bodies === 1,
            `Biên bản xuất ra có đúng một thẻ </body> (${report.bodies})`);

        assert(pageErrors.length === 0, `Không có uncaught exception trong Media Center: ${pageErrors.length} lỗi`);
    });
};
