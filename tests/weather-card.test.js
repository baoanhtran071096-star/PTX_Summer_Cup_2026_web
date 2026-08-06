const { withPage, assert, BASE_URL } = require('./test-utils');

module.exports = async function runWeatherCardTests(browser) {
    console.log('\n🌦️  [Nhóm] Canonical Weather Match Card & Weather Service Engine');

    await withPage(browser, async (page, { pageErrors, consoleErrors }) => {
        await page.goto(`${BASE_URL}/index.html#schedule`, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForTimeout(2000);

        // 1. Coordinates grounded check
        const venueCoords = await page.evaluate(() => window.PTX_VENUE_COORDS);
        assert(venueCoords && venueCoords.lat === 10.8057 && venueCoords.lng === 106.6478,
            `Tọa độ venue chuẩn hóa tại Sân 152 Hoàng Hoa Thám, Phường Bảy Hiền (10.8057, 106.6478)`);

        // 2. Weather Service calculation check
        const riskLevels = await page.evaluate(() => {
            const s = window.PTXWeatherService;
            return {
                low: s.calculateWeatherRisk(28, 30, 20, 0, 10, 3).level,
                mod: s.calculateWeatherRisk(29, 33, 50, 1.5, 14, 4).level,
                high: s.calculateWeatherRisk(30, 35, 65, 5, 26, 6).level,
                severe: s.calculateWeatherRisk(32, 38, 85, 12, 40, 8).level
            };
        });
        assert(riskLevels.low === 'LOW' && riskLevels.mod === 'MODERATE' && riskLevels.high === 'HIGH' && riskLevels.severe === 'SEVERE',
            `Weather Risk Engine phân loại chính xác 4 cấp rủi ro (LOW, MODERATE, HIGH, SEVERE)`);

        // 3. Full Weather Card rendering on Schedule Page
        const cardTitle = await page.textContent('#ptxScheduleWeatherCard .title');
        assert(cardTitle && cardTitle.includes('THỜI TIẾT TRẬN ĐẤU'),
            `Full Weather Match Card hiển thị thành công trên trang Lịch thi đấu`);

        const kickoffItem = await page.$('#ptxScheduleWeatherCard .is-kickoff');
        assert(kickoffItem !== null,
            `Hourly forecast highlight đúng giờ thi đấu (is-kickoff)`);

        // 4. Compact Weather Pill in schedule cards
        const compactPill = await page.$('.weather-compact-pill');
        assert(compactPill !== null,
            `Compact Weather Pill hiển thị trên các thẻ trận đấu`);

        // 5. PTX AI Assistant Weather query
        const aiResponse = await page.evaluate(() => window.groundedPTXQuery('Trận chiều nay có mưa không?'));
        assert(aiResponse.includes('Weather Radar'),
            `PTX AI Assistant tích hợp mượt mà Weather Service và trả về dữ liệu thời tiết thực tế`);

        assert(pageErrors.length === 0, `Không có uncaught exception trong luồng thời tiết: ${pageErrors.length} lỗi`);
    });
};
