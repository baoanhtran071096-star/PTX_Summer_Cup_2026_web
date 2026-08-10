# ============================================================
# PTX Summer Cup 2026 — Đồng bộ 2 máy + tự deploy
# ============================================================
# Dùng:
#   .\sync.ps1                        → hỏi nội dung commit, chạy đủ quy trình
#   .\sync.ps1 -Message "Sửa X"       → đưa sẵn nội dung commit
#   .\sync.ps1 -NoDeploy              → chỉ đẩy lên GitHub, không lên production
#   .\sync.ps1 -NoTest                → bỏ qua test (chỉ dùng khi thật sự cần gấp)
#
# Thứ tự CƯỠNG CHẾ, hỏng bước nào dừng ngay bước đó:
#   1. pull --ff-only   2. npm test   3. commit   4. push   5. deploy
#
# Vì sao script chứ không phải git alias:
#   - Alias `!git add . && git commit -m "..." && git push` có lỗi im lặng: khi
#     không có gì để commit, git commit thoát mã lỗi, chuỗi && đứt, và PUSH KHÔNG
#     BAO GIỜ CHẠY. Bạn tưởng đã đẩy xong rồi chuyển máy.
#   - Alias đặt bằng --global áp lên mọi repo trên máy, kể cả repo mà "add . rồi
#     push thẳng main" là sai.
#   - Script nằm trong repo nên đi theo git: hai máy tự dùng chung một quy trình.

param(
    [string]$Message = "",
    [switch]$NoDeploy,
    [switch]$NoTest
)

# KHÔNG dùng "Stop" ở đây.
#
# git, npm, firebase và wrangler đều ghi thông báo BÌNH THƯỜNG ra stderr — ví dụ dòng
# "From https://github.com/..." của git pull. Với ErrorActionPreference = "Stop",
# PowerShell bọc mỗi dòng stderr của chương trình ngoài thành NativeCommandError và
# coi là lỗi nghiêm trọng, nên script chết ngay ở bước 1 dù git chạy hoàn toàn đúng.
# Lỗi này chỉ lộ ra khi output bị chuyển hướng hoặc ghép ống, tức chạy bình thường thì
# tưởng ổn còn chạy trong pipeline/CI thì hỏng.
#
# Cách đúng với script điều khiển chương trình ngoài: để "Continue" và tự kiểm tra
# $LASTEXITCODE sau từng lệnh — đó mới là tín hiệu thành công/thất bại thật.
$ErrorActionPreference = "Continue"
Set-Location -Path $PSScriptRoot

function Write-Step($n, $text) {
    Write-Host ""
    Write-Host "[$n] $text" -ForegroundColor Cyan
}
function Fail($text) {
    Write-Host ""
    Write-Host "DUNG LAI: $text" -ForegroundColor Red
    exit 1
}

Write-Host "=== PTX Summer Cup 2026 - Dong bo & Deploy ===" -ForegroundColor Yellow

# ------------------------------------------------------------
# 1. PULL — bắt buộc fast-forward
# ------------------------------------------------------------
# --ff-only là điểm mấu chốt của cả script. `git pull` thường sẽ TỰ ĐỘNG merge khi
# hai máy cùng sửa; với index.html 16.700 dòng, bản merge tự động có thể chạy được
# về cú pháp nhưng sai về logic và không ai nhận ra. --ff-only từ chối và báo lỗi,
# để con người quyết định — thà dừng còn hơn merge nhầm.
Write-Step 1 "Keo ve tu GitHub (chi chap nhan fast-forward)..."
git pull --ff-only origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Hai may da di lech nhau (ca hai deu co commit moi)." -ForegroundColor Yellow
    Write-Host "TUYET DOI KHONG dung 'git push -f' — se xoa mat cong cua may kia." -ForegroundColor Yellow
    Write-Host "Cach xu ly: xem 'git log --oneline HEAD..origin/main', roi 'git pull --rebase origin main'"
    Write-Host "va giai quyet xung dot bang tay truoc khi chay lai script nay."
    Fail "Khong keo ve duoc bang fast-forward."
}

$baseCommit = (git rev-parse HEAD).Trim()

# ------------------------------------------------------------
# 2. TEST — chạy TRƯỚC khi push
# ------------------------------------------------------------
# CI trên GitHub chỉ chạy SAU khi push, tức lúc đó code hỏng đã nằm trên main rồi
# (và nếu deploy tự động thì đã lên cả production). Chạy ở máy mình trước thì hỏng
# chỉ hỏng ở máy mình.
if ($NoTest) {
    Write-Step 2 "BO QUA test (-NoTest)."
    Write-Host "    Canh bao: dang day code chua kiem chung len main." -ForegroundColor Yellow
} else {
    Write-Step 2 "Chay bo test (97 test, khoang 2 phut)..."
    npm test
    if ($LASTEXITCODE -ne 0) { Fail "Test do. Sua xong hay chay lai — dung day code hong len main." }
}

# ------------------------------------------------------------
# 3. COMMIT
# ------------------------------------------------------------
Write-Step 3 "Kiem tra thay doi..."
$dirty = git status --porcelain
$unpushed = git log "origin/main..HEAD" --oneline

if ([string]::IsNullOrWhiteSpace($dirty) -and [string]::IsNullOrWhiteSpace($unpushed)) {
    Write-Host "    Khong co gi de dong bo. Ket thuc." -ForegroundColor Green
    exit 0
}

if (-not [string]::IsNullOrWhiteSpace($dirty)) {
    git status --short
    if ([string]::IsNullOrWhiteSpace($Message)) {
        Write-Host ""
        # Cố ý KHÔNG có nội dung commit mặc định. Lich su commit cua du an nay dang la
        # tai lieu ky thuat that — no giai thich VI SAO tung thay doi duoc lam. Thay bang
        # 50 dong "update project" la xoa sach phan do: git log thanh vo dung, git bisect
        # cung vay. Bo them 10 giay go mot cau tu te la dang gia.
        Write-Host "Nhap noi dung commit (mo ta VIEC GI va VI SAO, khong phai 'update'):" -ForegroundColor Cyan
        $Message = Read-Host "  "
    }
    if ($Message.Trim().Length -lt 10) { Fail "Noi dung commit qua ngan. Hay mo ta ro thay doi." }

    git add -A
    git commit -m $Message
    if ($LASTEXITCODE -ne 0) { Fail "Commit that bai." }
} else {
    Write-Host "    Khong co thay doi moi, nhung con commit chua day len GitHub." -ForegroundColor Yellow
}

# ------------------------------------------------------------
# 4. PUSH — trước deploy, để code luôn được cất giữ dù deploy hỏng
# ------------------------------------------------------------
Write-Step 4 "Day len GitHub..."
git push origin main
if ($LASTEXITCODE -ne 0) { Fail "Push that bai. Co the may kia vua day len — chay lai script." }

# ------------------------------------------------------------
# 5. DEPLOY
# ------------------------------------------------------------
if ($NoDeploy) {
    Write-Step 5 "BO QUA deploy (-NoDeploy). GitHub va production dang LECH nhau."
    exit 0
}

$changedFiles = git diff --name-only "$baseCommit..HEAD"
$workerChanged = $changedFiles | Where-Object { $_ -like "cloudflare-worker/*" }

Write-Step 5 "Deploy Firebase Hosting..."
firebase deploy --only hosting
if ($LASTEXITCODE -ne 0) {
    Write-Host "    Chua dang nhap? Chay: firebase login" -ForegroundColor Yellow
    Fail "Deploy Firebase that bai. Code da nam an toan tren GitHub."
}

# Worker chi deploy khi that su co thay doi: no la dich deploy DOC LAP voi Firebase,
# deploy thua thi khong hong gi nhung ton them mot vong va che mat log co ich.
if ($workerChanged) {
    Write-Step 6 "Phat hien thay doi trong cloudflare-worker/ - deploy Worker..."
    Push-Location cloudflare-worker
    npx wrangler deploy
    $wrangerExit = $LASTEXITCODE
    Pop-Location
    if ($wrangerExit -ne 0) {
        Write-Host "    Chua dang nhap? Chay: npx wrangler login" -ForegroundColor Yellow
        Fail "Deploy Worker that bai."
    }
} else {
    Write-Host ""
    Write-Host "[6] Khong co thay doi trong cloudflare-worker/ - bo qua deploy Worker." -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "=== XONG ===" -ForegroundColor Green
Write-Host "GitHub : https://github.com/baoanhtran071096-star/PTX_Summer_Cup_2026_web"
Write-Host "Web    : https://ptx-summer-cup-2026.web.app"
Write-Host ""
Write-Host "Truoc khi sang may kia: may kia chay .\sync.ps1 hoac 'git pull --ff-only origin main'." -ForegroundColor Cyan
