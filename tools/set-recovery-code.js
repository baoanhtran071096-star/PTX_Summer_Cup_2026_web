#!/usr/bin/env node
// ============================================================
// Đặt lại Mã khôi phục cho reset-admin.html
// ============================================================
// Dùng:
//   node tools/set-recovery-code.js            → tự gõ mã của bạn (nhập ẩn, gõ 2 lần)
//   node tools/set-recovery-code.js --random   → máy sinh mã ngẫu nhiên và in ra MỘT lần
//
// Công cụ chỉ ghi SHA-256 của mã vào reset-admin.html. Mã gốc KHÔNG được lưu ở bất kỳ
// đâu trong dự án — bạn tự cất giữ. Mất mã thì chạy lại lệnh này để đặt mã mới, không
// mất quyền gì cả.
//
// Vì sao phải qua công cụ: hash trong file là thứ duy nhất chặn người lạ bấm đặt lại
// mật khẩu admin. Sửa tay dễ dán nhầm, dán thiếu ký tự, hoặc vô tình commit mã gốc vào
// git — chạy lệnh thì không có bước nào để lỡ tay.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

const TARGET = path.resolve(__dirname, '..', 'reset-admin.html');
const MARKER = /const RECOVERY_CODE_HASH = '([a-f0-9]{64})';/;

function sha256(s) {
    return crypto.createHash('sha256').update(s, 'utf8').digest('hex');
}

// Nhập ẩn: tắt hiển thị ký tự để mã không nằm lại trên màn hình hay trong ảnh chụp.
function askHidden(question) {
    return new Promise(resolve => {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
        const onData = char => {
            if ([`\n`, `\r`, ``].includes(char.toString())) {
                process.stdin.removeListener('data', onData);
            } else {
                readline.moveCursor(process.stdout, -1000, 0);
                readline.clearLine(process.stdout, 1);
                process.stdout.write(question + '*'.repeat(rl.line.length));
            }
        };
        process.stdout.write(question);
        process.stdin.on('data', onData);
        rl.question('', answer => { rl.close(); process.stdout.write('\n'); resolve(answer); });
    });
}

(async () => {
    if (!fs.existsSync(TARGET)) {
        console.error('❌ Không tìm thấy reset-admin.html');
        process.exit(1);
    }
    const html = fs.readFileSync(TARGET, 'utf8');
    if (!MARKER.test(html)) {
        console.error('❌ Không tìm thấy dòng RECOVERY_CODE_HASH trong reset-admin.html');
        process.exit(1);
    }

    let code;
    if (process.argv.includes('--random')) {
        // 4 cụm 5 ký tự, bỏ các ký tự dễ đọc nhầm (0/O, 1/I/l) để chép tay không sai.
        const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        const raw = Array.from(crypto.randomBytes(20)).map(b => alphabet[b % alphabet.length]).join('');
        code = raw.match(/.{1,5}/g).join('-');
        console.log('\n🔑 MÃ KHÔI PHỤC MỚI (chỉ hiện MỘT lần, hãy chép ngay vào nơi an toàn):\n');
        console.log('    ' + code + '\n');
    } else {
        code = await askHidden('Nhập Mã khôi phục mới: ');
        const again = await askHidden('Nhập lại để xác nhận:  ');
        if (code !== again) {
            console.error('❌ Hai lần nhập không khớp. Chưa thay đổi gì.');
            process.exit(1);
        }
        if (code.trim().length < 8) {
            console.error('❌ Mã quá ngắn (cần ít nhất 8 ký tự). Chưa thay đổi gì.');
            process.exit(1);
        }
    }

    const hash = sha256(code);
    fs.writeFileSync(TARGET, html.replace(MARKER, `const RECOVERY_CODE_HASH = '${hash}';`), 'utf8');

    console.log('✅ Đã cập nhật hash trong reset-admin.html');
    console.log('   Mã gốc KHÔNG được lưu ở đâu trong dự án — bạn tự giữ.');
    console.log('\nBước tiếp theo: commit rồi deploy để bản trên web dùng mã mới:');
    console.log('   git add reset-admin.html && git commit -m "Đổi mã khôi phục" && firebase deploy --only hosting');
})();
