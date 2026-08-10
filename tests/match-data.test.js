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

        // ----------------------------------------------------------
        // 8. Sự kiện phải tách đúng cột theo từng đội
        // ----------------------------------------------------------
        // Trang kết quả xếp bàn thắng/thẻ của mỗi đội vào một cột riêng. Nếu cột bị
        // ghép nhầm, người xem đọc thành đội kia ghi bàn — sai nghiêm trọng hơn cả
        // việc không hiển thị gì.
        const columns = await page.evaluate(() => {
            const cards = [...document.querySelectorAll('#matchResultsPage .match-result-summary')];
            return cards.map((card, i) => {
                const m = MATCHES_CONFIG[i];
                const events = parseMatchEvents(localStorage.getItem('ptx_result_' + m.id), m);
                const cols = [...card.querySelectorAll('.mrs-col')];
                const read = col => [...col.querySelectorAll('.mrs-event')]
                    .map(r => r.querySelector('.mrs-ev-min').textContent.replace("'", '')).sort();
                const expect = teamId => events.filter(e => e.team === teamId)
                    .map(e => String(e.minute)).sort();
                return {
                    id: m.id,
                    colCount: cols.length,
                    homeOk: cols[0] && JSON.stringify(read(cols[0])) === JSON.stringify(expect(m.home)),
                    awayOk: cols[1] && JSON.stringify(read(cols[1])) === JSON.stringify(expect(m.away))
                };
            });
        });
        const badCols = columns.filter(c => c.colCount !== 2 || !c.homeOk || !c.awayOk);
        assert(columns.length > 0 && badCols.length === 0,
            `Trang kết quả tách sự kiện đúng cột cho từng đội ở cả ${columns.length} trận` +
            (badCols.length ? ` — sai ở trận ${badCols.map(c => c.id).join(', ')}` : ''));

        // Thẻ trận đấu ở Trang chủ / Lịch thi đấu là nơi người xem nhìn đầu tiên, và
        // trước đây vẫn đổ chung hai đội vào một danh sách dù trang kết quả đã tách cột.
        const cardColumns = await page.evaluate(() => {
            const out = [];
            document.querySelectorAll('.match-card-v3').forEach(card => {
                const timeline = card.querySelector('.goal-timeline');
                if (!timeline) return;
                const cols = [...timeline.querySelectorAll('.goal-col')];
                const minutes = col => [...col.querySelectorAll('.goal-item')]
                    .map(r => (r.querySelector('.goal-time') || {}).textContent)
                    .filter(Boolean).map(s => s.replace("'", '')).sort();
                // Xác định trận từ chính tên đội trên thẻ, không giả định thứ tự thẻ.
                const label = card.innerText;
                const m = MATCHES_CONFIG.find(mc =>
                    label.includes(TEAMS_DATA[mc.home].name) && label.includes(TEAMS_DATA[mc.away].name));
                if (!m) return;
                const events = parseMatchEvents(localStorage.getItem('ptx_result_' + m.id), m);
                const expect = teamId => events.filter(e => e.team === teamId).map(e => String(e.minute)).sort();
                out.push({
                    id: m.id,
                    cols: cols.length,
                    ok: cols.length >= 2 &&
                        JSON.stringify(minutes(cols[0])) === JSON.stringify(expect(m.home)) &&
                        JSON.stringify(minutes(cols[1])) === JSON.stringify(expect(m.away))
                });
            });
            return out;
        });
        const badCards = cardColumns.filter(c => !c.ok);
        assert(cardColumns.length > 0 && badCards.length === 0,
            `Thẻ trận đấu cũng tách sự kiện theo từng đội (${cardColumns.length} thẻ)` +
            (badCards.length ? ` — sai ở trận ${badCards.map(c => c.id).join(', ')}` : ''));

        // ----------------------------------------------------------
        // 9. Giải đã đá xong thì mọi nơi phải nói "đã kết thúc"
        // ----------------------------------------------------------
        // Thanh trạng thái ghi cứng "CHƯA KHỞI TRANH · 0/3 trận" trong HTML, hero đếm
        // ngược về 00:00:00:00, còn Vinh danh vẫn ghi "Đang tranh cúp" — cả ba đều nói
        // sai sau khi giải kết thúc, và không có gì cập nhật chúng.
        const finished = await page.evaluate(() => ({
            status: getTournamentStatus(),
            stateText: document.getElementById('statusBarStateText').innerText.trim(),
            matchInfo: document.getElementById('statusBarMatchInfo').innerText.trim(),
            heroText: document.getElementById('heroCountdown').innerText.replace(/\s+/g, ' ').trim(),
            hof: getSeasonAwards(2026),
            champion: calculateStandings()[0].fullName
        }));
        assert(finished.status.phase === 'finished' && finished.status.played === finished.status.total,
            `Trạng thái giải nhận đúng là đã kết thúc (${finished.status.played}/${finished.status.total} trận)`);
        assert(/KẾT THÚC/i.test(finished.stateText) &&
            finished.matchInfo.startsWith(`${finished.status.played} / ${finished.status.total}`),
            `Thanh trạng thái hiện đúng tình trạng & số trận ("${finished.stateText} · ${finished.matchInfo}")`);
        assert(!/00\s*00\s*00\s*00/.test(finished.heroText) && finished.heroText.includes(finished.champion),
            `Hero thay đồng hồ đếm ngược bằng nhà vô địch ("${finished.heroText}")`);
        assert(!/tranh cúp|Chờ VCK|Đang bình chọn|Vòng 1/i.test(finished.hof) &&
            finished.hof.startsWith(finished.champion),
            `Vinh danh mùa 2026 ghi nhà vô địch thật, không còn "đang tranh cúp" ("${finished.hof}")`);

        // Con số trên thanh trạng thái không nằm trong từ điển i18n, nên phải kiểm tra
        // nó không bị applyLanguage() ghi đè về chuỗi tĩnh "0 / 3" khi đổi ngôn ngữ.
        const afterLangSwitch = await page.evaluate(() => {
            applyLanguage('en');
            const en = document.getElementById('statusBarMatchInfo').innerText.trim();
            applyLanguage('vi');
            return { en, vi: document.getElementById('statusBarMatchInfo').innerText.trim() };
        });
        assert(afterLangSwitch.en.startsWith('3 / 3') && afterLangSwitch.vi.startsWith('3 / 3'),
            `Số trận trên thanh trạng thái không bị mất khi đổi ngôn ngữ (EN: "${afterLangSwitch.en}")`);

        // ----------------------------------------------------------
        // 10. Chữ không được tràn ra ngoài khung sự kiện
        // ----------------------------------------------------------
        // Cột sự kiện chỉ rộng ~180px. Một cái tên kèm chú thích "phản lưới" không vừa
        // một dòng, và khi chú thích nằm chung dòng với tên thì phần thừa tràn ra khỏi
        // khung bo góc — đọc thành chữ chồng lên nhau. Đo ở cả bề rộng máy tính lẫn
        // điện thoại vì đây đúng là chỗ layout hẹp nhất.
        const measureOverflow = () => page.evaluate(() => {
            const bad = [];
            document.querySelectorAll('.goal-item, .mrs-event').forEach(item => {
                const box = item.getBoundingClientRect();
                [...item.children].forEach(child => {
                    const c = child.getBoundingClientRect();
                    if (c.width === 0 && c.height === 0) return;
                    if (c.bottom > box.bottom + 0.5 || c.top < box.top - 0.5 || c.right > box.right + 0.5) {
                        bad.push(item.innerText.replace(/\s+/g, ' ').trim());
                    }
                });
            });
            return [...new Set(bad)];
        });

        const overflowWide = await measureOverflow();
        assert(overflowWide.length === 0,
            `Không có chữ tràn khỏi khung sự kiện ở bề rộng máy tính` +
            (overflowWide.length ? ` — tràn ở: ${overflowWide.join(' | ')}` : ''));

        // Ràng buộc thẳng vào quyết định trình bày: nhãn "phản lưới" phải nằm HÀNG RIÊNG
        // bên dưới tên. Để nó chen cùng dòng thì tên bị ép vỡ chữ giữa chừng trong cột
        // hẹp — đúng cảnh đã thấy trên máy người dùng. Phép đo "tràn khỏi khung" ở trên
        // không bắt được kiểu hỏng này vì hàng vẫn tự cao lên, chỉ là xuống dòng rất xấu.
        const ogLayout = await page.evaluate(() => {
            const item = [...document.querySelectorAll('.goal-item')].find(e => e.querySelector('.goal-og'));
            if (!item) return null;
            const name = item.querySelector('.goal-scorer').getBoundingClientRect();
            const og = item.querySelector('.goal-og').getBoundingClientRect();
            return {
                ownLine: og.top >= name.bottom - 1,
                nameWrapped: name.height > 26,
                text: item.innerText.replace(/\s+/g, ' ').trim()
            };
        });
        assert(ogLayout && ogLayout.ownLine && !ogLayout.nameWrapped,
            `Nhãn "phản lưới" nằm hàng riêng dưới tên, tên không bị vỡ chữ ("${ogLayout ? ogLayout.text : 'không tìm thấy'}")`);

        await page.setViewportSize({ width: 390, height: 900 });
        await page.waitForTimeout(400);
        const overflowNarrow = await measureOverflow();
        assert(overflowNarrow.length === 0,
            `Không có chữ tràn khỏi khung sự kiện ở bề rộng điện thoại (390px)` +
            (overflowNarrow.length ? ` — tràn ở: ${overflowNarrow.join(' | ')}` : ''));
        await page.setViewportSize({ width: 1400, height: 900 });

        // ----------------------------------------------------------
        // 11. Vinh danh mùa giải: đủ hạng mục & đúng dữ liệu từng mùa
        // ----------------------------------------------------------
        const hofRows = await page.evaluate(() => {
            const parse = year => getSeasonAwards(year).split('|').map(s => s.trim());
            const card = document.querySelector('#hofGridV2Page .hof-card-v2, #hofGridV2 .hof-card-v2');
            return {
                labels: card ? [...card.querySelectorAll('.award-label')].map(e => e.textContent.trim()) : [],
                y2025: parse(2025),
                y2026: parse(2026)
            };
        });
        assert(hofRows.labels.length === 6 && /th[ủu] m[ôo]n/i.test(hofRows.labels.join(' ')),
            `Thẻ Vinh danh có đủ 6 hạng mục, gồm Thủ môn xuất sắc (${hofRows.labels.join(' · ')})`);
        assert(hofRows.y2026[4].includes('Quang Toàn') && hofRows.y2026[5].includes('Tường Khánh'),
            `Mùa 2026: MVP ${hofRows.y2026[4]} · Thủ môn ${hofRows.y2026[5]}`);
        assert(hofRows.y2025[0] === 'TEAM DS+' && hofRows.y2025[1] === 'TEAM HV' &&
            hofRows.y2025[2] === '' && hofRows.y2025[3] === 'Tường Khánh' && hofRows.y2025[4] === 'Anh Trương',
            `Mùa 2025: 2 đội, không có hạng ba, vua phá lưới & MVP đúng tư liệu`);

        // ----------------------------------------------------------
        // 12. Khu tổng kết trang chủ phải nói cùng một chuyện với Vinh danh
        // ----------------------------------------------------------
        // Thẻ "Thủ môn xuất sắc" ở đây từng tự chấm điểm bằng công thức bịa
        // (giữ sạch lưới = kiến tạo × 2), nên luôn hiện "Chưa xác định" trong khi trang
        // Vinh danh đã ghi rõ tên — hai chỗ trên cùng một trang chủ nói ngược nhau.
        const hub = await page.evaluate(() => {
            const cards = [...document.querySelectorAll('#tournamentHub .hub-card')];
            return {
                texts: cards.map(c => c.innerText.replace(/\s+/g, ' ').trim()),
                gk: getBestGoalkeeper(),
                awardGk: OFFICIAL_AWARDS_2026.goalkeeper,
                standings: calculateStandings().map(t => ({ id: t.id, ga: t.obj.goalsAgainst, played: t.obj.played }))
            };
        });
        const gkCard = hub.texts.find(t => /th[ủu] m[ôo]n/i.test(t)) || '';
        assert(hub.gk && gkCard.includes(hub.awardGk) && !/Chưa xác định/i.test(gkCard),
            `Thẻ Thủ môn xuất sắc ở trang chủ hiện đúng người ("${gkCard}")`);
        const gkRow = hub.standings.find(t => t.id === (hub.gk && hub.gk.player.team));
        assert(gkRow && hub.gk.conceded === gkRow.ga && hub.gk.played === gkRow.played,
            `Số bàn thua của thủ môn lấy từ bảng xếp hạng thật (${hub.gk.conceded} bàn thua / ${hub.gk.played} trận)`);

        const championCard = hub.texts.find(t => /TEAM/i.test(t)) || '';
        assert(/Vô địch/i.test(championCard) && !/dẫn đầu/i.test(championCard),
            `Giải đã xong thì thẻ đội đứng đầu ghi "Vô địch", không phải "Đội dẫn đầu" ("${championCard}")`);

        // Tiêu đề khu LIVE không được mâu thuẫn với nội dung ngay bên dưới nó.
        const liveHeader = await page.evaluate(() => ({
            badge: (document.getElementById('liveCenterBadgeText') || {}).textContent || '',
            sub: (document.getElementById('liveCenterSub') || {}).textContent || '',
            body: (document.getElementById('liveCenterContent') || {}).innerText || '',
            idle: (document.getElementById('liveCenterBadge') || { classList: { contains: () => false } }).classList.contains('is-idle')
        }));
        assert(!/LIVE/i.test(liveHeader.badge) && /kết thúc/i.test(liveHeader.sub) && liveHeader.idle,
            `Khu LIVE báo đúng trạng thái đã kết thúc, chấm đỏ ngừng nhấp nháy ("${liveHeader.badge} — ${liveHeader.sub}")`);
        assert(!(/đang diễn ra/i.test(liveHeader.sub) && /Chưa có trận/i.test(liveHeader.body)),
            `Tiêu đề khu LIVE không mâu thuẫn với nội dung bên dưới`);

        // Chân menu "Tiện ích" có cùng cặp thông tin trạng thái, cũng ghi cứng trong HTML.
        // Nó từng nói "Chưa khởi tranh · 0 / 3 trận đã đấu" ngay trong lúc thanh trạng thái
        // phía trên nói "ĐÃ KẾT THÚC · 3 / 3" — hai chỗ trên cùng một màn hình.
        const menuStatus = await page.evaluate(() => ({
            label: (document.getElementById('statusLabelText') || {}).textContent || '',
            matches: (document.getElementById('statusMatchesText') || {}).textContent || '',
            bar: (document.getElementById('statusBarMatchInfo') || {}).textContent || ''
        }));
        assert(/kết thúc/i.test(menuStatus.label) && !/Chưa khởi tranh/i.test(menuStatus.label),
            `Chân menu Tiện ích báo đúng trạng thái giải ("${menuStatus.label}")`);
        assert(menuStatus.matches.startsWith(`${finished.status.played} / ${finished.status.total}`),
            `Chân menu Tiện ích báo đúng số trận, khớp thanh trạng thái ("${menuStatus.matches}" vs "${menuStatus.bar}")`);

        // MVP phải khớp giữa trang Vinh danh và trang Thống kê — hai nơi đọc hai nguồn
        // khác nhau nên rất dễ nói ngược nhau nếu chỉ sửa một chỗ.
        const mvpConsistency = await page.evaluate(() => ({
            fromPlayers: PLAYERS_DATA.filter(p => p.mvp > 0).map(p => p.name),
            fromAwards: OFFICIAL_AWARDS_2026.mvp
        }));
        assert(mvpConsistency.fromPlayers.length === 1 &&
            mvpConsistency.fromPlayers[0] === mvpConsistency.fromAwards,
            `MVP thống nhất giữa danh hiệu và chỉ số cầu thủ (${mvpConsistency.fromAwards})`);

        assert(pageErrors.length === 0, `Không có uncaught exception trong luồng dữ liệu trận đấu: ${pageErrors.length} lỗi`);
    });

    // ----------------------------------------------------------
    // 10. Lần mở trang THỨ HAI (localStorage đã có dữ liệu)
    // ----------------------------------------------------------
    // Mọi test phía trên chạy trên trình duyệt sạch, nên chỉ phủ được cảnh người xem
    // lần đầu. Người xem thật hầu hết là quay lại: localStorage đã có sẵn kết quả, và
    // đường chạy lúc nạp trang khác hẳn — hero vào ngay nhánh "đã kết thúc" trước khi
    // dữ liệu cầu thủ kịp nạp. Đúng khe hở đó từng làm hero hiện "Vua phá lưới: Chưa
    // xác định" trên bản production trong khi trình duyệt sạch vẫn hiện đúng tên.
    await withPage(browser, async (page, { pageErrors }) => {
        console.log('  — mở trang lần 2 (localStorage đã có dữ liệu)');
        await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForTimeout(2000);
        const firstVisit = await page.evaluate(() => getGoldenBoot().label);

        await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForTimeout(2000);
        const second = await page.evaluate(() => ({
            boot: getGoldenBoot().label,
            hero: document.getElementById('heroCountdown').innerText.replace(/\s+/g, ' ').trim(),
            hof: getSeasonAwards(2026),
            seeded: !!localStorage.getItem('ptx_result_1')
        }));

        assert(second.seeded, `Lần mở thứ hai thật sự có sẵn dữ liệu trong localStorage`);
        assert(second.boot === firstVisit && !/Chưa xác định/i.test(second.boot),
            `Vua phá lưới giữ nguyên ở lần mở thứ hai ("${second.boot}")`);
        assert(second.hero.includes(second.boot) && !/Chưa xác định/i.test(second.hero),
            `Hero hiện đúng vua phá lưới với khách quay lại ("${second.hero}")`);
        assert(second.hof.includes(second.boot),
            `Vinh danh hiện đúng vua phá lưới với khách quay lại`);
        assert(pageErrors.length === 0, `Không có uncaught exception ở lần mở thứ hai: ${pageErrors.length} lỗi`);
    });

    // ============================================================
    // Các nút "Lưu" trong trang quản trị phải thật sự lưu
    // ============================================================
    // Ba trong sáu nút Lưu hỏng theo cùng một kiểu: báo thành công mà không lưu, hoặc
    // vỡ giữa chừng nên không báo gì. Không test nào cũ chạm tới chúng vì tất cả đều
    // kiểm dữ liệu hiển thị, không kiểm dữ liệu có sống sót qua lần tải lại hay không.
    await withPage(browser, async (page, { pageErrors }) => {
        console.log('  — trang quản trị: dữ liệu có sống sót qua tải lại không');
        await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForTimeout(1500);

        // ---- Chỉ số cầu thủ ----
        // Trước đây hàm chỉ sửa mảng trong bộ nhớ rồi vẽ lại: chỉ số đổi ngay trước mắt,
        // hiện "Đã cập nhật", tải lại trang là mất trắng, và không có gì lên cloud.
        const luuCauThu = await page.evaluate(() => {
            const dayLen = [];
            ptxCloudSync.push = (d) => dayLen.push(d);
            loadAdminData();
            const s = document.getElementById('adminPlayerSelect');
            s.value = s.options[0].value;
            document.getElementById('admin-p-goals').value = '77';
            savePlayerAdminDetail();
            return {
                id: parseInt(s.value),
                vaoLocalStorage: (localStorage.getItem('ptx_players_data') || '').includes('"goals":77'),
                dayLen: dayLen.join(',')
            };
        });
        assert(luuCauThu.vaoLocalStorage, `Lưu chỉ số cầu thủ có ghi xuống localStorage`);
        assert(luuCauThu.dayLen === 'players', `Lưu chỉ số cầu thủ có đẩy lên cloud (push: "${luuCauThu.dayLen}")`);

        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1500);
        const conSau = await page.evaluate((id) => {
            const p = PLAYERS_DATA.find(x => x.id === id);
            return p ? p.goals : null;
        }, luuCauThu.id);
        assert(conSau === 77, `Chỉ số cầu thủ SỐNG SÓT qua lần tải lại (goals = ${conSau})`);

        // ---- Hall of Fame ----
        // Hỏng ba kiểu cùng lúc: lặp cứng 2025→2030 trong khi chỉ có 3 ô nên ném lỗi ở
        // 2028 (không kịp báo gì), không đẩy cloud, và không xoá trắng được một năm.
        const hof = await page.evaluate(async () => {
            const dayLen = [];
            ptxCloudSync.push = (d) => dayLen.push(d);
            let toast = null;
            window.showToast = (m) => { toast = m; };
            loadAdminData();
            const oInput = document.querySelectorAll('[id^="admin-hof-"]');
            oInput.forEach(el => { el.value = 'THỬ ' + el.id.replace('admin-hof-', ''); });
            let loi = null;
            // Phải await: từ khi đi qua cổng ghi, hàm chờ kết quả đẩy cloud rồi mới báo.
            try { await saveHallOfFameAdmin(); } catch (e) { loi = e.message; }
            const daLuu = [...oInput].every(el => {
                const y = el.id.replace('admin-hof-', '');
                return localStorage.getItem('hof_' + y) === 'THỬ ' + y;
            });
            // Xoá trắng một năm phải thật sự xoá.
            oInput[0].value = '';
            await saveHallOfFameAdmin();
            const namDau = oInput[0].id.replace('admin-hof-', '');
            return {
                loi, toast, dayLen: dayLen.join(','), soO: oInput.length, daLuu,
                xoaDuoc: localStorage.getItem('hof_' + namDau) === null
            };
        });
        assert(!hof.loi, `Nút Lưu Hall of Fame không ném lỗi (${hof.loi || 'sạch'})`);
        assert(hof.daLuu && hof.soO > 0, `Lưu đủ ${hof.soO} ô Hall of Fame có thật trong trang`);
        assert(!!hof.toast, `Có báo cho người dùng biết đã lưu ("${String(hof.toast).slice(0, 45)}")`);
        assert(/hof/.test(hof.dayLen), `Hall of Fame ĐƯỢC đồng bộ lên cloud (push: "${hof.dayLen}")`);
        assert(hof.xoaDuoc, `Xoá trắng một năm thì năm đó bị xoá thật, không giữ lại giá trị cũ`);

        // ---- Nút phá huỷ ----
        // Bốn nút xoá/ghi đè kết quả thật, trước đây không nút nào hỏi lại một câu.
        const raoChan = await page.evaluate(async () => {
            const ketQua = {};
            for (const ten of ['setZeroMatchesState', 'setDemoScoresState', 'switchToPreMatchState', 'resetSystemDataToOfficialDefaults']) {
                localStorage.setItem('ptx_result_1', 'GIỮ NGUYÊN');
                let daHoi = false;
                const confirmThat = window.confirm;
                window.confirm = () => { daHoi = true; return false; }; // người dùng bấm Huỷ
                window[ten]();
                window.confirm = confirmThat;
                ketQua[ten] = { daHoi, conNguyen: localStorage.getItem('ptx_result_1') === 'GIỮ NGUYÊN' };
            }
            return ketQua;
        });
        for (const [ten, r] of Object.entries(raoChan)) {
            assert(r.daHoi && r.conNguyen,
                `${ten}() hỏi xác nhận trước, bấm Huỷ thì không xoá gì`);
        }

        // ============================================================
        // Cổng ghi ptxCommit — ba đảm bảo trước đây không tồn tại
        // ============================================================
        // (a) sai dữ liệu thì KHÔNG ghi gì cả, không để lại trạng thái nửa vời;
        // (b) thông báo phản ánh ĐÚNG kết quả thật, kể cả khi đồng bộ hỏng;
        // (c) mọi thay đổi vào nhật ký và hoàn tác được.
        const cong = await page.evaluate(async () => {
            localStorage.setItem('ptx_result_1', '9-2 | GIỮ NGUYÊN');
            localStorage.removeItem('ptx_audit_log');

            // (a) Tỷ số sai định dạng — ô nhập là text tự do nên "3 - x" từng lưu được.
            document.getElementById('admin-result1').value = '3 - x';
            document.getElementById('admin-result2').value = '';
            document.getElementById('admin-result3').value = '';
            // Gom TẤT CẢ toast chứ không giữ mỗi cái cuối: sau khi lưu tỷ số còn một toast
            // "đang soạn bản tin" chạy sau, sẽ che mất đúng câu cần kiểm.
            let toasts = [];
            window.showToast = (m, t) => { toasts.push({ m, t }); };
            const cauLuu = () => toasts.find(x => /lưu|Chưa lưu/i.test(x.m)) || null;

            await updateStandingsAndResults();
            const sauKhiSai = {
                conNguyen: localStorage.getItem('ptx_result_1') === '9-2 | GIỮ NGUYÊN',
                toast: cauLuu(), khongGhiNhatKy: JSON.parse(localStorage.getItem('ptx_audit_log') || '[]').length === 0
            };

            // (b) Thông báo phải nói đúng trạng thái đồng bộ. Firebase không chạy trong
            //     test nên push trả not-configured — không được báo nhầm là đã lên cloud.
            // Đặt lại push cho tường minh: khối test phía trên đã thay nó bằng bản giả
            // ghi log, và trạng thái đó dính lại trên cùng một trang.
            toasts = [];
            ptxCloudSync.push = async () => ({ ok: false, reason: 'not-configured' });
            document.getElementById('admin-result1').value = '5-0';
            await updateStandingsAndResults();
            const sauKhiDung = {
                daGhi: localStorage.getItem('ptx_result_1') === '5-0',
                toast: cauLuu()
            };

            // Giả lập đăng nhập hỏng: phải CẢNH BÁO, tuyệt đối không báo thành công.
            toasts = [];
            ptxCloudSync.push = async () => ({ ok: false, reason: 'not-signed-in' });
            document.getElementById('admin-result1').value = '6-0';
            await updateStandingsAndResults();
            const khiDongBoHong = cauLuu();

            // (c) Nhật ký & hoàn tác.
            const nhatKy = ptxCommit.history();
            const mucMoiNhat = nhatKy[0];
            await ptxCommit.undo(mucMoiNhat.id);
            const sauHoanTac = localStorage.getItem('ptx_result_1');

            return { sauKhiSai, sauKhiDung, khiDongBoHong, soMuc: nhatKy.length, mucMoiNhat, sauHoanTac };
        });

        assert(cong.sauKhiSai.conNguyen,
            `Tỷ số sai định dạng thì KHÔNG ghi gì cả, giá trị cũ nguyên vẹn`);
        assert(cong.sauKhiSai.toast && cong.sauKhiSai.toast.t === 'error' && /số-số/.test(cong.sauKhiSai.toast.m),
            `Báo rõ vì sao bị chặn ("${(cong.sauKhiSai.toast || {}).m}")`);
        assert(cong.sauKhiSai.khongGhiNhatKy,
            `Lần lưu bị chặn không để lại mục nào trong nhật ký`);

        assert(cong.sauKhiDung.daGhi, `Tỷ số đúng định dạng thì lưu được`);
        assert(/chưa nối Firebase/.test(cong.sauKhiDung.toast.m) && cong.sauKhiDung.toast.t === 'success',
            `Máy chưa nối Firebase thì báo lưu thành công nhưng nói rõ là chưa lên cloud ("${cong.sauKhiDung.toast.m}")`);

        assert(cong.khiDongBoHong.t === 'warning' && /CHƯA đồng bộ/.test(cong.khiDongBoHong.m),
            `Đồng bộ hỏng thì CẢNH BÁO chứ không báo thành công ("${cong.khiDongBoHong.m}")`);

        assert(cong.soMuc >= 2 && cong.mucMoiNhat.label && cong.mucMoiNhat.by,
            `Mỗi lần lưu ghi lại nhật ký kèm việc gì và ai làm (${cong.soMuc} mục)`);
        assert(cong.mucMoiNhat.synced === false,
            `Nhật ký ghi lại cả việc thay đổi đó đã lên cloud hay chưa`);
        assert(cong.sauHoanTac === '5-0',
            `Hoàn tác trả về đúng giá trị trước đó (nhận "${cong.sauHoanTac}")`);

        // Nhật ký phải XEM ĐƯỢC trong trang quản trị, không chỉ gọi được từ console.
        const bang = await page.evaluate(async () => {
            ptxCloudSync.push = async () => ({ ok: false, reason: 'not-configured' });
            localStorage.removeItem('ptx_audit_log');
            document.getElementById('admin-result1').value = '7-1';
            await updateStandingsAndResults();
            renderAuditLog();
            const box = document.getElementById('auditLogList');
            const truoc = localStorage.getItem('ptx_result_1');

            // Bấm đúng nút Hoàn tác trên giao diện, không gọi thẳng hàm.
            const nut = box.querySelector('button[onclick^="undoAuditEntry"]');
            if (nut) nut.click();
            await new Promise(r => setTimeout(r, 400));

            return {
                soDong: box.querySelectorAll('div[style*="border"]').length,
                coChipDongBo: /CHỈ MÁY NÀY|ĐÃ ĐỒNG BỘ/.test(box.innerHTML),
                coNutHoanTac: !!nut,
                truoc, sauHoanTac: localStorage.getItem('ptx_result_1')
            };
        });
        assert(bang.soDong >= 1 && bang.coChipDongBo,
            `Nhật ký hiện ra trong trang quản trị kèm dấu trạng thái đồng bộ (${bang.soDong} dòng)`);
        assert(bang.coNutHoanTac, `Mỗi mục có nút Hoàn tác bấm được`);
        assert(bang.truoc === '7-1' && bang.sauHoanTac !== '7-1',
            `Bấm Hoàn tác trên giao diện thật sự trả dữ liệu về trước đó ("${bang.truoc}" → "${bang.sauHoanTac}")`);

        // Hero phải quay lại được đồng hồ đếm ngược khi giải không còn ở trạng thái kết thúc.
        // renderHeroFinished() ghi đè innerHTML nên xoá mất bốn ô đếm ngược; trước khi vá,
        // sửa tỷ số lúc trang đang mở làm bộ đếm ném TypeError mỗi giây và hero kẹt luôn.
        const hero = await page.evaluate(async () => {
            localStorage.setItem('ptx_result_1', '9-2 | A 1\'');
            localStorage.setItem('ptx_result_2', '3-1 | B 2\'');
            localStorage.setItem('ptx_result_3', '2-0 | C 3\'');
            updateHeroCountdown();
            const khiKetThuc = !document.getElementById('heroDays');
            ['1', '2', '3'].forEach(i => localStorage.removeItem('ptx_result_' + i));
            updateHeroCountdown();
            updateHeroCountdown();
            const d = document.getElementById('heroDays');
            return { khiKetThuc, quayLai: !!d, coSo: !!(d && /^\d{2}$/.test(d.innerText)) };
        });
        assert(hero.khiKetThuc, `Giải kết thúc thì hero thay đồng hồ bằng bảng tổng kết`);
        assert(hero.quayLai && hero.coSo,
            `Xoá kết quả thì hero dựng lại được đồng hồ đếm ngược, không kẹt ở bảng tổng kết`);

        assert(pageErrors.length === 0,
            `Không có uncaught exception trong luồng lưu của trang quản trị: ${pageErrors.length} lỗi` +
            (pageErrors.length ? ` — ${pageErrors.map(e => String(e).split('\n')[0]).join(' | ')}` : ''));
    });
};
