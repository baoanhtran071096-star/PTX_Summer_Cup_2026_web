const fs = require('fs');
const path = require('path');
const { assert, PROJECT_ROOT } = require('./test-utils');

function walk(dir, base = dir, out = new Set()) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walk(full, base, out);
        } else {
            out.add(path.relative(base, full).split(path.sep).join('/'));
        }
    }
    return out;
}

module.exports = async function runMediaIntegrityTests() {
    console.log('\n🖼️  [Nhóm] Đối chiếu file media (ảnh/video) với tham chiếu trong code');

    const libDir = path.join(PROJECT_ROOT, 'thư viện');
    const actualFiles = walk(libDir);

    const sourceFiles = ['index.html', 'sw.js', 'manifest.json', 'reset-admin.html'];
    const pattern = /(['"`])((?:\.\/)?(?:th%C6%B0|thư viện)(?:(?!\1).)*?\.(?:webp|mp4|jpg|jpeg|png))\1/gi;

    const referenced = new Map();
    for (const fname of sourceFiles) {
        const content = fs.readFileSync(path.join(PROJECT_ROOT, fname), 'utf8');
        let m;
        while ((m = pattern.exec(content)) !== null) {
            let decoded = decodeURIComponent(m[2]);
            if (decoded.startsWith('./')) decoded = decoded.slice(2);
            if (decoded.startsWith('thư viện/')) decoded = decoded.slice('thư viện/'.length);
            referenced.set(decoded, fname);
        }
    }

    const broken = [...referenced.keys()].filter(p => !actualFiles.has(p));
    const orphans = [...actualFiles].filter(p => !referenced.has(p));

    assert(broken.length === 0,
        `0 link gãy (${referenced.size} tham chiếu, tìm thấy ${broken.length} gãy)` +
        (broken.length ? `\n     ${broken.join('\n     ')}` : ''));
    assert(orphans.length === 0,
        `0 file mồ côi (${actualFiles.size} file thật, ${orphans.length} không được dùng)` +
        (orphans.length ? `\n     ${orphans.join('\n     ')}` : ''));
};
