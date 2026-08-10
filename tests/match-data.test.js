// ============================================================
// Dữ liệu trận đấu — nhật ký sự kiện, bảng xếp hạng, vua phá lưới
// ============================================================
// Nhóm test này khoá lại đúng ba lỗi đã khiến kết quả vòng bảng 07/08/2026 hiển
// thị sai, và cả ba đều lọt qua 23 test cũ vì trước đó KHÔNG có test nào chạm
// vào dữ liệu trận đấu:
//
//   1. Thẻ vàng bị đếm thành bàn thắng — bộ phân tích coi mọi mục trong chuỗi
//      kết quả là bàn thắng, nên "🟨 Quang Toàn 17'" hiện ra là "⚽ ... 17'".
//   2. Bàn phản lưới tính cho chính đội của người đá phản, ngược với tỷ số, và
//      còn cộng vào thành tích ghi bàn cá nhân của cầu thủ đó.
//   3. Bảng xếp hạng ghép cứng cặp đấu (P-T, P-X, X-T) trong khi lịch thật là
//      (P-X, P-T, X-T), nên tỷ số trận 1 và 2 bị gán nhầm đội.
//
// Nguyên tắc viết test ở đây: KHÔNG chép lại con số từ OFFICIAL_RESULTS rồi so
// với chính nó — như vậy chỉ chứng minh hằng số bằng chính nó. Thay vào đó mỗi
// test dựng lại con số mong đợi từ một nguồn ĐỘC LẬP (tỷ số trong chuỗi kết
// quả, hoặc MATCHES_CONFIG) rồi đối chiếu với thứ trang thật sự tính ra. Nhờ
// vậy test vẫn còn giá trị khi kết quả giải được cập nhật sang số liệu khác.

const { withPage, assert, BASE_URL } = require('./test-utils');

module.exports = async function runMatchDataTests(browser) {
    console.log('\n⚽ [Nhóm] Dữ liệu trận đấu: nhật ký sự kiện, BXH & vua phá lưới');

    await withPage(browser, async (page, { pageErrors }) => {
        await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForTimeout(2000);

        // ----------------------------------------------------------
        // 1. Nhật ký sự kiện phải khớp tỷ số của chính trận đó
        // ----------------------------------------------------------
        // Đây là ràng buộc mạnh nhất: một thẻ vàng bị tính thành bàn thắng, hay
        // một bàn phản lưới gán nhầm đội, đều làm số bàn đếm được lệch khỏi tỷ số.
        const goalTally = await page.evaluate(() => {
            return MATCHES_CONFIG.map(m => {
                const raw = localStorage.getItem('ptx_result_' + m.id);
                const [scoreHome, scoreAway] = raw.split('|')[0].trim().split('-').map(Number);
                const events = parseMatchEvents(raw, m);
                const goals = events.filter(e => e.type === 'goal');
                return {
                    id: m.id,
                    scoreHome, scoreAway,
                    countedHome: goals.filter(g => g.team === m.home).length,
                    countedAway: goals.filter(g => g.team === m.away).length
                };
            });
        });
        const mismatched = goalTally.filter(r => r.countedHome !== r.scoreHome || r.countedAway !== r.scoreAway);
        assert(mismatched.length === 0,
            `Số bàn trong nhật ký khớp tỷ số ở cả ${goalTally.length} trận` +
            (mismatched.length ? ` — lệch ở trận ${mismatched.map(r => `${r.id} (${r.countedHome}-${r.countedAway} ≠ ${r.scoreHome}-${r.scoreAway})`).join(', ')}` : ''));

        // ----------------------------------------------------------
        // 2. Thẻ phạt KHÔNG được xếp vào danh sách bàn thắng
        // ----------------------------------------------------------
        const cardHandling = await page.evaluate(() => {
            let cards = 0, cardsLeakedAsGoals = 0;
            MATCHES_CONFIG.forEach(m => {
                const raw = localStorage.getItem('ptx_result_' + m.id);
                // Đếm thẻ trực tiếp từ chuỗi gốc, không qua bộ phân tích đang được kiểm tra.
                const rawCardMinutes = (raw.split('|')[1] || '').split(',')
                    .filter(s => /[🟨🟥]/.test(s))
                    .map(s => parseInt((s.match(/(\d+)'/) || [])[1]));
                cards += rawCardMinutes.length;
                const goalMinutes = parseGoalDataWithTeam(raw, m).map(g => g.minute);
                // Một phút có thể vừa có bàn vừa có thẻ; chỉ tính rò rỉ khi phút đó
                // chỉ có thẻ mà vẫn xuất hiện trong danh sách bàn thắng.
                const goalMinutesRaw = (raw.split('|')[1] || '').split(',')
                    .filter(s => !/[🟨🟥]/.test(s))
                    .map(s => parseInt((s.match(/(\d+)'/) || [])[1]));
                rawCardMinutes.forEach(min => {
                    if (goalMinutes.includes(min) && !goalMinutesRaw.includes(min)) cardsLeakedAsGoals++;
                });
            });
            return { cards, cardsLeakedAsGoals };
        });
        assert(cardHandling.cards > 0 && cardHandling.cardsLeakedAsGoals === 0,
            `Thẻ phạt được phân loại riêng, không lọt vào danh sách bàn thắng (${cardHandling.cards} thẻ, ${cardHandling.cardsLeakedAsGoals} lọt)`);

        const yellowStat = await page.evaluate(() => ({
            dashboard: computeDashboardStats().yellow,
            raw: MATCHES_CONFIG.reduce((n, m) => n +
                (localStorage.getItem('ptx_result_' + m.id).split('|')[1] || '').split(',').filter(s => s.includes('🟨')).length, 0)
        }));
        assert(yellowStat.dashboard === yellowStat.raw && yellowStat.raw > 0,
            `Số thẻ vàng trên dashboard khớp nhật ký trận đấu (${yellowStat.dashboard} thẻ)`);

        // ----------------------------------------------------------
        // 3. Bàn phản lưới tính cho ĐỘI ĐỐI PHƯƠNG, không cho người đá phản
        // ----------------------------------------------------------
        const ownGoals = await page.evaluate(() => {
            const found = [];
            MATCHES_CONFIG.forEach(m => {
                parseMatchEvents(localStorage.getItem('ptx_result_' + m.id), m).forEach(e => {
                    if (!e.ownGoal) return;
                    const ownTeam = getPlayerTeam(e.scorer);
                    found.push({
                        match: m.id, scorer: e.scorer, minute: e.minute,
                        creditedTo: e.team, ownTeam,
                        creditedToOpponent: e.team !== ownTeam,
                        nameKeptClean: !/[()]/.test(e.scorer)
                    });
                });
            });
            return found;
        });
        assert(ownGoals.length > 0 && ownGoals.every(g => g.creditedToOpponent),
            `Bàn phản lưới tính cho đội đối phương (${ownGoals.map(g => `${g.scorer} ${g.minute}' → ${g.creditedTo.toUpperCase()}`).join(', ') || 'không có bàn phản lưới nào để kiểm tra'})`);
        assert(ownGoals.every(g => g.nameKeptClean),
            `Nhãn "(OG)" được tách khỏi tên cầu thủ khi hiển thị`);

        const personalGoals = await page.evaluate(() => {
            // Tổng bàn cá nhân + số bàn phản lưới phải bằng tổng bàn của giải:
            // bàn phản lưới không được cộng cho ai, cũng không được bốc hơi khỏi tỷ số.
            let ownGoalCount = 0, totalFromScores = 0;
            MATCHES_CONFIG.forEach(m => {
                const raw = localStorage.getItem('ptx_result_' + m.id);
                totalFromScores += raw.split('|')[0].trim().split('-').reduce((a, b) => a + Number(b), 0);
                ownGoalCount += parseMatchEvents(raw, m).filter(e => e.ownGoal).length;
            });
            return {
                sumPersonal: PLAYERS_DATA.reduce((s, p) => s + p.goals, 0),
                ownGoalCount,
                totalFromScores
            };
        });
        assert(personalGoals.sumPersonal + personalGoals.ownGoalCount === personalGoals.totalFromScores,
            `Bàn phản lưới không cộng vào thành tích cá nhân (${personalGoals.sumPersonal} bàn cá nhân + ${personalGoals.ownGoalCount} phản lưới = ${personalGoals.totalFromScores} tổng bàn)`);

        // ----------------------------------------------------------
        // 4. Bảng xếp hạng phải ghép cặp đấu theo MATCHES_CONFIG
        // ----------------------------------------------------------
        // Dựng lại BXH từ lịch thi đấu + tỷ số một cách độc lập, rồi so với thứ
        // calculateStandings() tính ra. Nếu ai đó lại ghép cứng cặp đấu và ghép
        // sai lịch, hai bên sẽ lệch nhau ngay.
        const standings = await page.evaluate(() => {
            const blank = () => ({ played: 0, pts: 0, goalsFor: 0, goalsAgainst: 0 });
            const expected = {};
            Object.keys(TEAMS_DATA).forEach(id => { expected[id] = blank(); });
            MATCHES_CONFIG.forEach(m => {
                const raw = localStorage.getItem('ptx_result_' + m.id);
                if (!raw) return;
                const [h, a] = raw.split('|')[0].trim().split('-').map(Number);
                if (!Number.isFinite(h) || !Number.isFinite(a)) return;
                const H = expected[m.home], A = expected[m.away];
                H.played++; A.played++;
                H.goalsFor += h; H.goalsAgainst += a;
                A.goalsFor += a; A.goalsAgainst += h;
                if (h > a) H.pts += 3; else if (a > h) A.pts += 3; else { H.pts++; A.pts++; }
            });
            const actual = {};
            calculateStandings().forEach(t => {
                actual[t.id] = {
                    played: t.obj.played, pts: t.obj.pts,
                    goalsFor: t.obj.goalsFor, goalsAgainst: t.obj.goalsAgainst
                };
            });
            return { expected, actual, order: calculateStandings().map(t => `${t.label} ${t.obj.pts}đ`) };
        });
        const teamIds = Object.keys(standings.expected);
        const wrongTeams = teamIds.filter(id =>
            JSON.stringify(standings.expected[id]) !== JSON.stringify(standings.actual[id]));
        assert(wrongTeams.length === 0,
            `BXH ghép cặp đấu đúng theo MATCHES_CONFIG — ${standings.order.join(' · ')}` +
            (wrongTeams.length ? ` — sai ở ${wrongTeams.map(id => id.toUpperCase()).join(', ')}` : ''));

        const totalPlayed = teamIds.reduce((n, id) => n + standings.actual[id].played, 0);
        const playedMatches = await page.evaluate(() =>
            MATCHES_CONFIG.filter(m => localStorage.getItem('ptx_result_' + m.id)).length);
        assert(totalPlayed === playedMatches * 2,
            `Mỗi trận có kết quả được tính cho đúng 2 đội (${totalPlayed} lượt / ${playedMatches} trận)`);

        // ----------------------------------------------------------
        // 5. Không cầu thủ nào bị "thất lạc" khỏi danh sách đội
        // ----------------------------------------------------------
        // Gõ sai tên trong chuỗi kết quả sẽ cho team = 'unknown', khiến bàn thắng
        // đó biến mất khỏi cả BXH lẫn bảng vua phá lưới mà không báo lỗi gì.
        const unknowns = await page.evaluate(() => {
            const out = [];
            MATCHES_CONFIG.forEach(m => {
                parseMatchEvents(localStorage.getItem('ptx_result_' + m.id), m).forEach(e => {
                    if (e.team === 'unknown') out.push(`trận ${m.id}: "${e.scorer}"`);
                });
            });
            return out;
        });
        assert(unknowns.length === 0,
            `Mọi tên trong nhật ký đều khớp danh sách cầu thủ${unknowns.length ? ' — không nhận ra: ' + unknowns.join(', ') : ''}`);

        // ----------------------------------------------------------
        // 6. Vua phá lưới dựng từ chính nhật ký ghi bàn
        // ----------------------------------------------------------
        const scorers = await page.evaluate(() => {
            // Sắp xếp theo tên trước khi so sánh: hai bên dựng theo thứ tự khác nhau
            // (một bên theo trình tự trận đấu, một bên theo danh sách cầu thủ).
            const flatten = obj => Object.keys(obj).sort().map(k => `${k}=${obj[k]}`).join(', ');
            const tally = {};
            MATCHES_CONFIG.forEach(m => {
                parseMatchEvents(localStorage.getItem('ptx_result_' + m.id), m).forEach(e => {
                    if (e.type !== 'goal' || e.ownGoal) return;
                    const key = e.scorer.toLowerCase();
                    tally[key] = (tally[key] || 0) + 1;
                });
            });
            const stored = {};
            PLAYERS_DATA.filter(p => p.goals > 0).forEach(p => { stored[p.name.toLowerCase()] = p.goals; });
            return { fromLog: flatten(tally), fromPlayers: flatten(stored), count: Object.keys(stored).length };
        });
        assert(scorers.fromLog === scorers.fromPlayers,
            `Số bàn từng cầu thủ khớp nhật ký ghi bàn (${scorers.count} người ghi bàn)` +
            (scorers.fromLog === scorers.fromPlayers ? '' : `\n     nhật ký: ${scorers.fromLog}\n     đã lưu:  ${scorers.fromPlayers}`));

        // ----------------------------------------------------------
        // 7. Nhãn ô nhập trong trang admin phải khớp lịch thi đấu
        // ----------------------------------------------------------
        // Nhãn ghi sai cặp đấu sẽ dẫn người nhập kết quả gõ tỷ số vào nhầm trận —
        // sai từ nguồn, không bộ phân tích nào cứu được.
        const adminLabels = await page.evaluate(() => {
            return MATCHES_CONFIG.map(m => {
                const input = document.getElementById('admin-result' + m.id);
                const label = input && input.previousElementSibling;
                const text = label ? label.textContent : '';
                const home = (TEAMS_DATA[m.home] || {}).name || '';
                const away = (TEAMS_DATA[m.away] || {}).name || '';
                const homeAt = text.indexOf(home);
                const awayAt = text.indexOf(away);
                return { id: m.id, text: text.trim(), ok: homeAt !== -1 && awayAt !== -1 && homeAt < awayAt };
            });
        });
        const badLabels = adminLabels.filter(l => !l.ok);
        assert(badLabels.length === 0,
            `Nhãn ô nhập kết quả trong trang admin ghi đúng cặp đấu` +
            (badLabels.length ? ` — sai ở ${badLabels.map(l => `trận ${l.id} ("${l.text}")`).join(', ')}` : ''));

        assert(pageErrors.length === 0, `Không có uncaught exception trong luồng dữ liệu trận đấu: ${pageErrors.length} lỗi`);
    });
};
