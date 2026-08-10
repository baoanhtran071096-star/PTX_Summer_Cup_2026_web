// ============================================================
// firebase.json — những gì được đẩy lên web công khai
// ============================================================
// Bản cấu hình cũ loại trừ bằng mẫu "**/.*". Mẫu đó chỉ khớp file có TÊN bắt đầu
// bằng dấu chấm, KHÔNG khớp file nằm bên trong thư mục dấu chấm: ".git/config" có
// đoạn cuối là "config" nên lọt lưới. Hậu quả là toàn bộ 155 file trong .git/ cùng
// .claude/settings.local.json được deploy lên web, và tải về được thật —
// https://ptx-summer-cup-2026.web.app/.git/config trả HTTP 200.
//
// Lần này chưa rò rỉ gì (repo vốn công khai, .env chưa bao giờ bị commit, lịch sử
// không có khoá nào). Nhưng để nguyên thì bất kỳ bí mật nào lỡ commit trong tương
// lai sẽ tải về được ngay từ trang web, kể cả sau khi đã xoá khỏi commit mới nhất —
// vì .git giữ toàn bộ lịch sử.
//
// Test dựng lại đúng cách khớp mẫu của Firebase Hosting rồi thử trên các đường dẫn
// tiêu biểu, thay vì chỉ kiểm tra "có chuỗi X trong mảng ignore" — cách sau vẫn xanh
// khi ai đó đổi sang một mẫu khác cũng không dùng được.

const fs = require('fs');
const path = require('path');
const { assert, PROJECT_ROOT } = require('./test-utils');

// Chuyển glob của Firebase (** , * , ?) sang biểu thức chính quy.
function globToRegExp(glob) {
    let re = '';
    for (let i = 0; i < glob.length; i++) {
        const c = glob[i];
        if (c === '*') {
            if (glob[i + 1] === '*') {
                // "**/" nuốt luôn dấu / để "**/x" khớp cả "x" ở thư mục gốc
                if (glob[i + 2] === '/') { re += '(?:.*/)?'; i += 2; }
                else { re += '.*'; i += 1; }
            } else {
                re += '[^/]*';
            }
        } else if (c === '?') {
            re += '[^/]';
        } else {
            re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
        }
    }
    return new RegExp('^' + re + '$');
}

module.exports = async function runDeployConfigTests() {
    console.log('\n🚀 [Nhóm] Cấu hình deploy — thứ gì được đẩy lên web công khai');

    const cfg = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'firebase.json'), 'utf8'));
    const patterns = (cfg.hosting && cfg.hosting.ignore) || [];
    const regexps = patterns.map(globToRegExp);
    const isIgnored = p => regexps.some(r => r.test(p));

    const PHAI_CHAN = [
        '.git/config',
        '.git/HEAD',
        '.git/logs/HEAD',
        '.claude/settings.local.json',
        '.firebase/hosting..cache',
        '.github/workflows/ci.yml',
        '.env',
        'node_modules/playwright/package.json',
        'tests/match-data.test.js',
        'archive/TEST-REPORT.md',
        'tools/set-recovery-code.js',
        'sync.ps1',
        'package.json',
        'database_schema.sql',
        'SETUP_HOME_PC.md'
    ];
    const lot = PHAI_CHAN.filter(p => !isIgnored(p));
    assert(lot.length === 0,
        `Không đẩy lên web: .git/, .claude/, .env, node_modules, tests, tools, tài liệu nội bộ` +
        (lot.length ? ` — CÒN LỌT: ${lot.join(', ')}` : ''));

    // Chiều ngược lại quan trọng không kém: chặn quá tay thì trang gãy mà test vẫn xanh.
    const PHAI_GIU = [
        'index.html',
        'sw.js',
        'manifest.json',
        'reset-admin.html',
        'ptx_migration_data.json',
        'thư viện/Ảnh cầu thủ/Bảo Anh.webp'
    ];
    const chanNham = PHAI_GIU.filter(p => isIgnored(p));
    assert(chanNham.length === 0,
        `Vẫn giữ đủ file trang cần để chạy (${PHAI_GIU.length} file kiểm tra)` +
        (chanNham.length ? ` — BỊ CHẶN NHẦM: ${chanNham.join(', ')}` : ''));
};
