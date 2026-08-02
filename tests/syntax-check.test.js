const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert, PROJECT_ROOT } = require('./test-utils');

module.exports = async function runSyntaxTests() {
    console.log('\n📝 [Nhóm] Kiểm tra cú pháp JavaScript trong index.html');

    const html = fs.readFileSync(path.join(PROJECT_ROOT, 'index.html'), 'utf8');
    const scriptRegex = /<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g;
    let match;
    let i = 0;
    let allOk = true;
    while ((match = scriptRegex.exec(html)) !== null) {
        const code = match[1];
        if (!code.trim()) { i++; continue; }
        try {
            new vm.Script(code, { filename: `inline-script-${i}.js` });
        } catch (e) {
            allOk = false;
            assert(false, `Script block #${i} bị lỗi cú pháp: ${e.message}`);
        }
        i++;
    }
    if (allOk) assert(true, `Tất cả ${i} script block trong index.html hợp lệ về cú pháp`);
};
