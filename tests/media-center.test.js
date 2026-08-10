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

        // Media Center là khu vực Ban tổ chức: mỗi lần bấm là một lượt gọi worker AI với
        // hạn mức dài hơn hẳn nhánh chat, để công khai thì bào hết quota miễn phí của cả
        // trang. Kiểm cửa khoá TRƯỚC, rồi mới đăng nhập để kiểm phần còn lại.
        const gate = await page.evaluate(() => {
            localStorage.removeItem('adminLoggedIn');
            openAiMediaCenterModal();
            return document.getElementById('aiMediaCenterModal').style.display;
        });
        assert(gate !== 'flex',
            `Chưa đăng nhập BTC thì không mở được AI Media Center (display = "${gate}")`);

        const modalState = await page.evaluate(ids => {
            localStorage.setItem('adminLoggedIn', 'true');
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

        // ----------------------------------------------------------
        // Bản tin tự động — máy kiểm thay cho người duyệt
        // ----------------------------------------------------------
        // Bài AI được đăng thẳng lên trang chủ, không ai đọc trước, nên bộ kiểm là lớp
        // bảo vệ duy nhất. Nó phải chặn được số liệu bịa mà KHÔNG bác nhầm bài đúng —
        // bác nhầm hết thì bản AI không bao giờ lên trang và tính năng thành vô dụng.
        const guard = await page.evaluate(() => {
            const draft = buildMediaDraft('match_report', 3);
            const run = t => verifyArticleAgainstFacts(t, draft);
            return {
                baiThat: run("TEAM X đã có 2 bàn thắng do công của Đình Huy ở phút 25' và 28'. Hoàng Nam ghi 4 bàn ở các phút 2', 5', 14' và 16'.").ok,
                tySoNguoc: run('TEAM T thắng 9-2 trước TEAM X.').ok,
                soSuyRa: run('Hoàng Nam ghi 4 bàn, TEAM T bỏ túi 3 điểm.').ok,
                tySoBia: run('TEAM T thắng 5-1 trước TEAM X.').ok,
                phutBia: run("Minh Thế ghi bàn ở phút 88'.").ok,
                nguoiLa: run('Phan Hiền toả sáng trong trận.').ok,
                soLa: run('Trận đấu thu hút 4500 khán giả.').ok
            };
        });
        assert(guard.baiThat && guard.tySoNguoc && guard.soSuyRa,
            `Bộ kiểm KHÔNG bác nhầm bài đúng (bài thật, tỷ số nói ngược chiều, số suy ra như "4 bàn")`);
        assert(!guard.tySoBia && !guard.phutBia && !guard.nguoiLa && !guard.soLa,
            `Bộ kiểm chặn tỷ số bịa, phút bịa, cầu thủ không đá trận, và số liệu bịa`);

        // ------------------------------------------------------------
        // Bản tin AI phải qua người duyệt mới lên trang chủ
        // ------------------------------------------------------------
        // Trước đây lưu tỷ số là bài AI đăng thẳng, không ai đọc trước. Bộ kiểm ở trên chặn
        // được số liệu bịa nhưng không chặn được văn sai giọng hay sai trọng tâm. Các test
        // dưới đây khoá ranh giới: sinh bản nháp KHÔNG được chạm vào ptx_news, và chỉ
        // approveNewsArticle() — tức một cú bấm của con người — mới đưa bài ra trang.
        const nhap = await page.evaluate(async () => {
            localStorage.removeItem('ptx_news');
            localStorage.removeItem('ptx_news_pending');
            localStorage.setItem('adminLoggedIn', 'true');
            renderNewsFeed();
            const anTrangTrong = document.getElementById('newsFeedSection').style.display === 'none';

            const a = await generateMatchNewsDraft(3);
            const b = await generateMatchNewsDraft(3); // soạn lại cùng trận
            return {
                anTrangTrong,
                title: a.title,
                source: a.source,
                trungTitle: a.title === b.title,
                soNhap: getPendingNews().length,
                daDang: getNewsArticles().length,
                soTheChoDuyet: document.querySelectorAll('#newsFeedList article').length,
                coNutDang: /✓ Đăng/.test(document.getElementById('newsFeedList').innerHTML)
            };
        });
        assert(nhap.anTrangTrong, `Chưa có bản tin nào thì mục Bản tin ẩn hẳn, không để khung trống`);
        assert(nhap.daDang === 0,
            `Soạn bản tin KHÔNG tự đăng lên trang chủ (${nhap.daDang} bài đã đăng)`);
        assert(nhap.soNhap === 1 && nhap.trungTitle,
            `Soạn hai lần cho một trận chỉ ra MỘT bản nháp, không nhân đôi (${nhap.soNhap} nháp)`);
        assert(nhap.soTheChoDuyet === 1 && nhap.coNutDang,
            `Admin thấy bản nháp kèm nút Đăng ngay trong mục Bản tin`);
        assert(/2 - 9|9 - 2/.test(nhap.title),
            `Tiêu đề bản tin lấy đúng tỷ số thật ("${nhap.title}")`);
        // Test chặn mọi request ra ngoài nên AI luôn hỏng — phải rơi về bản dữ liệu.
        assert(nhap.source === 'data',
            `Mô hình AI hỏng thì vẫn soạn được bản dựng từ dữ liệu (nguồn: ${nhap.source})`);

        // Khách chưa đăng nhập tuyệt đối không được thấy bản nháp.
        const khach = await page.evaluate(() => {
            localStorage.setItem('adminLoggedIn', 'false');
            renderNewsFeed();
            return {
                an: document.getElementById('newsFeedSection').style.display === 'none',
                soThe: document.querySelectorAll('#newsFeedList article').length
            };
        });
        assert(khach.an && khach.soThe === 0,
            `Khách chưa đăng nhập không thấy bản nháp, cũng không thấy khung rỗng`);

        // Bấm Đăng: bản nháp chuyển sang kho bài đã đăng, hàng chờ rỗng đi.
        const duyet = await page.evaluate(() => {
            localStorage.setItem('adminLoggedIn', 'true');
            const id = getPendingNews()[0].id;
            const kq = approveNewsArticle(id);
            return {
                daDang: getNewsArticles().length,
                conNhap: getPendingNews().length,
                coNguoiDuyet: !!(kq && kq.approvedBy),
                hienVoiKhach: (localStorage.setItem('adminLoggedIn', 'false'), renderNewsFeed(),
                               document.querySelectorAll('#newsFeedList article').length)
            };
        });
        assert(duyet.daDang === 1 && duyet.conNhap === 0,
            `Bấm Đăng thì bài ra trang chủ và rời hàng chờ (${duyet.daDang} đã đăng, ${duyet.conNhap} còn chờ)`);
        assert(duyet.coNguoiDuyet, `Bài đã đăng có ghi lại ai là người duyệt`);
        assert(duyet.hienVoiKhach === 1, `Sau khi duyệt thì khách mới đọc được bài`);

        // ------------------------------------------------------------
        // "AI" chỉ được dùng cho thứ thật sự gọi mô hình
        // ------------------------------------------------------------
        // Ba tính năng từng mang nhãn AI thực ra là số học hoặc chuỗi ghi cứng. Cái giá không
        // chỉ là tên gọi: bài thông cáo ghi cứng giữ nguyên giờ khai mạc SAI (07:30 AM) rất
        // lâu sau khi cả trang đã sửa sang 16:00, vì nội dung trông như do máy sinh thì không
        // ai đi soi như soi dữ liệu. Nay nó dựng từ buildMediaDraft() nên không thể lệch nữa.
        const baoChi = await page.evaluate(() => {
            buildPressRelease('PRE_MATCH');
            const truocGiai = document.getElementById('aiPressReleaseContent').innerText;
            buildPressRelease('MATCH_REVIEW');
            const tongKet = document.getElementById('aiPressReleaseContent').innerText;
            return { truocGiai, tongKet };
        });
        assert(!/07:30/.test(baoChi.truocGiai + baoChi.tongKet),
            `Bài truyền thông không còn giờ khai mạc sai 07:30`);
        assert(/đã kết thúc/i.test(baoChi.truocGiai),
            `Bài truyền thông nêu đúng trạng thái giải đã kết thúc, không mời "tới sân cổ vũ" nữa`);
        assert(/Hoàng Nam/.test(baoChi.tongKet) && /TIGER|TEAM T/.test(baoChi.tongKet),
            `Bài tổng kết lấy vua phá lưới và nhà vô địch từ dữ liệu thật`);

        const nhanAI = await page.evaluate(() => ({
            // Hàm số học phải mang tên số học, và tên cũ phải biến mất hẳn.
            coTenMoi: typeof computeTeamStrengthAnalysis === 'function'
                      && typeof showTeamStrengthComparison === 'function'
                      && typeof buildPressRelease === 'function',
            conTenCu: typeof window.runAITacticalAnalysis !== 'undefined'
                      || typeof window.runAiPredictionDemo !== 'undefined'
                      || typeof window.generateAIPressRelease !== 'undefined'
                      || typeof window.autoPublishMatchNews !== 'undefined',
            // Chỉ soi nhãn của BA tính năng số học. Cố ý KHÔNG cấm chữ "AI" nói chung:
            // AI Media Center thật sự gọi mô hình nên nhãn AI của nó là đúng, và một test
            // cấm bừa sẽ ép người sau gỡ mất nhãn đáng có.
            chuAItrenTrang: /AI TACTICAL|AI PHÂN TÍCH|AI Match Result/i
                            .test(document.body.innerHTML)
        }));
        assert(nhanAI.coTenMoi, `Ba tính năng số học đã mang tên đúng bản chất`);
        assert(!nhanAI.conTenCu, `Tên cũ mang nhãn AI đã bị gỡ hẳn, không còn alias`);
        assert(!nhanAI.chuAItrenTrang,
            `Giao diện không gán nhãn AI cho ba tính năng chỉ tính chỉ số`);

        // Ngược lại: nhãn AI của Media Center PHẢI còn, vì nó gọi mô hình thật. Test này giữ
        // cho lần dọn dẹp sau không quét sạch cả nhãn đúng lẫn nhãn sai.
        const nhanDung = await page.evaluate(() =>
            /Tạo nội dung truyền thông AI/i.test(document.body.innerHTML));
        assert(nhanDung, `AI Media Center — thứ thật sự gọi mô hình — vẫn giữ nhãn AI`);

        assert(pageErrors.length === 0, `Không có uncaught exception trong Media Center: ${pageErrors.length} lỗi`);
    });
};
