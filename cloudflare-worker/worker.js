// ============================================================
// PTX AI Assistant — Groq fallback proxy (Cloudflare Worker)
// ============================================================
// Purpose: keeps the Groq API key server-side. index.html's
// askPTXAiFallback() POSTs { message, grounding } here; this worker
// calls Groq (OpenAI-compatible chat completions) with that grounding
// data injected as context and returns { reply }. Deploy with
// `wrangler deploy` after running `wrangler secret put GROQ_API_KEY`
// — see README.md.
//
// (Originally built against Gemini, but Google's Generative Language
// API rejected all calls with "User location is not supported" for
// this account/region — Groq's free tier doesn't have that restriction.)

// ⚠️ Danh sách này PHẢI chứa tên miền thật đang chạy trang, nếu không worker
// trả 403 và trợ lý AI mất hẳn phần trả lời ngoài 8 nhánh rule-based. Lỗi này
// từng xảy ra: danh sách chỉ có ptxsummercup.vn (tên miền dự kiến, chưa mua)
// trong khi trang thật chạy trên GitHub Pages, nên fallback Groq chết trên bản
// production suốt thời gian đó mà ở localhost vẫn chạy tốt — rất khó phát hiện
// khi chỉ thử ở máy dev.
//
// Lưu ý: header Origin chỉ gồm scheme + host, KHÔNG có đường dẫn. Vì vậy dòng
// github.io dưới đây mở cho mọi project page thuộc cùng tài khoản, không riêng
// repo này. Chấp nhận được vì đó là tài khoản của chính chủ dự án; khi đã trỏ
// được tên miền riêng thì nên bỏ dòng đó đi.
//
// Hai tên miền Firebase Hosting được thêm sẵn TRƯỚC khi deploy, cố ý như vậy:
// mỗi project Firebase luôn có đúng <project-id>.web.app và
// <project-id>.firebaseapp.com, biết trước được nên không cần chờ deploy xong
// mới thêm. Nhờ đó lần deploy đầu tiên chạy được ngay, thay vì lặp lại đúng
// lỗi 403 mà danh sách này từng gây ra.
const ALLOWED_ORIGINS = [
    'https://ptxsummercup.vn',
    'https://www.ptxsummercup.vn',
    'https://baoanhtran071096-star.github.io',
    'https://ptx-summer-cup-2026.web.app',
    'https://ptx-summer-cup-2026.firebaseapp.com'
];

// Chat là câu hỏi của CĐV nên ngắn. Media Center gửi kèm bản nháp dựng sẵn từ dữ
// liệu thật (tỷ số, người ghi bàn, thẻ phạt) nên dài hơn hẳn — dùng chung một hạn
// mức thì hoặc chat bị mở quá rộng, hoặc media luôn bị chặn 400.
const MAX_MESSAGE_LENGTH = { chat: 300, media: 2500 };
const GROQ_MODEL = 'llama-3.3-70b-versatile';

// Kênh xem trước của Firebase Hosting (`firebase hosting:channel:deploy`) có
// tên miền dạng <project-id>--<tên-kênh>-<hash ngẫu nhiên>.web.app, tức mỗi lần
// tạo lại là một origin khác, không thể liệt kê sẵn. Regex dưới đây chỉ nhận
// đúng tiền tố project này nên không mở cho project Firebase nào khác. Thiếu nó
// thì thử bản xem trước sẽ dính 403 và dễ bị hiểu nhầm là bản deploy bị hỏng.
const FIREBASE_PREVIEW_ORIGIN = /^https:\/\/ptx-summer-cup-2026--[a-z0-9-]+\.web\.app$/;

function isAllowedOrigin(origin) {
    if (!origin) return false;
    if (ALLOWED_ORIGINS.includes(origin)) return true;
    if (FIREBASE_PREVIEW_ORIGIN.test(origin)) return true;
    // Allow local dev servers (http://localhost:PORT, http://127.0.0.1:PORT)
    return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

function corsHeaders(origin) {
    const headers = {
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Vary': 'Origin'
    };
    if (isAllowedOrigin(origin)) {
        headers['Access-Control-Allow-Origin'] = origin;
    }
    return headers;
}

function buildSystemPrompt(grounding) {
    return `Bạn là "PTX AI Assistant" — trợ lý ảo của website PTX Summer Cup 2026 (giải bóng đá nội bộ 5v5 của Công đoàn PTX Group Việt Nam).

QUY TẮC BẮT BUỘC:
- CHỈ trả lời dựa trên dữ liệu JSON bên dưới. KHÔNG bịa thêm số liệu, tên cầu thủ, hay sự kiện không có trong dữ liệu.
- Nếu câu hỏi không liên quan đến giải đấu này hoặc dữ liệu không đủ để trả lời, hãy nói rõ là chưa có thông tin, đừng đoán.
- Trả lời bằng tiếng Việt, giọng văn ngắn gọn, thân thiện, có thể dùng emoji vừa phải (giống phong cách 1 trợ lý thể thao trẻ trung).
- Định dạng trả lời bằng HTML đơn giản (dùng <strong>, <br>, <em> nếu cần) — KHÔNG dùng markdown (không dùng **, #, -).
- Giới hạn khoảng 4-6 câu, đi thẳng vào trọng tâm.

DỮ LIỆU GIẢI ĐẤU (JSON):
${JSON.stringify(grounding)}`;
}

// Media Center sinh nội dung cho người thật copy đi đăng, nên ràng buộc chống bịa
// phải chặt hơn cả nhánh chat: trang web đã dựng sẵn bản nháp đúng số liệu, việc của
// mô hình chỉ là viết lại cho mượt. Thêm một con số sai vào đây là nó lên Facebook.
function buildMediaSystemPrompt(grounding) {
    return `Bạn là biên tập viên truyền thông của giải bóng đá PTX Summer Cup 2026 (giải nội bộ 5v5 của Công đoàn PTX Group Việt Nam).

NHIỆM VỤ: viết lại BẢN NHÁP mà người dùng gửi thành một bài đăng hoàn chỉnh, tự nhiên, hấp dẫn bằng tiếng Việt.

QUY TẮC BẮT BUỘC:
- TUYỆT ĐỐI không thêm bất kỳ số liệu, tên người, phút ghi bàn hay sự kiện nào không có trong bản nháp và dữ liệu JSON bên dưới.
- Không suy diễn kết quả, không bình luận về những trận chưa diễn ra, không bịa lời phát biểu.
- Được phép thêm câu dẫn, câu chuyển, lời chúc mừng, emoji vừa phải và hashtag chung chung.
- Giữ nguyên mọi tỷ số, tên cầu thủ và phút thi đấu đúng như bản nháp.
- Trả về VĂN BẢN THUẦN (plain text), xuống dòng bằng ký tự xuống dòng thật. KHÔNG dùng HTML, KHÔNG dùng markdown (không **, không #, không -).
- Độ dài khoảng 120-220 từ, trừ khi bản nháp yêu cầu ngắn hơn (ví dụ caption mạng xã hội).

DỮ LIỆU GIẢI ĐẤU (JSON):
${JSON.stringify(grounding)}`;
}

async function callGroq(apiKey, message, grounding, task) {
    const isMedia = task === 'media';
    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: GROQ_MODEL,
            messages: [
                { role: 'system', content: isMedia ? buildMediaSystemPrompt(grounding) : buildSystemPrompt(grounding) },
                { role: 'user', content: message }
            ],
            // Bài đăng cần dài hơn câu trả lời chat, và cần nhích nhiệt độ để câu chữ
            // không rập khuôn giữa các lần bấm — số liệu đã bị khoá trong bản nháp rồi.
            temperature: isMedia ? 0.6 : 0.4,
            max_tokens: isMedia ? 900 : 400
        })
    });

    if (!resp.ok) {
        const errText = await resp.text().catch(() => '');
        throw new Error(`Groq API lỗi ${resp.status}: ${errText.slice(0, 300)}`);
    }

    const data = await resp.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error('Groq không trả về nội dung');
    return text.trim();
}

export default {
    async fetch(request, env) {
        const origin = request.headers.get('Origin');

        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders(origin) });
        }

        if (request.method !== 'POST') {
            return new Response(JSON.stringify({ error: 'Chỉ hỗ trợ POST' }), {
                status: 405,
                headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) }
            });
        }

        if (!isAllowedOrigin(origin)) {
            return new Response(JSON.stringify({ error: 'Origin không được phép' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) }
            });
        }

        try {
            const body = await request.json();
            const message = typeof body?.message === 'string' ? body.message.trim() : '';
            const grounding = body?.grounding || {};
            // Chỉ nhận đúng hai giá trị; bất kỳ thứ gì khác đều rơi về 'chat' để một
            // request lạ không mở được hạn mức dài hơn của nhánh media.
            const task = body?.task === 'media' ? 'media' : 'chat';

            if (!message) {
                return new Response(JSON.stringify({ error: 'Thiếu message' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) }
                });
            }
            if (message.length > MAX_MESSAGE_LENGTH[task]) {
                return new Response(JSON.stringify({ error: 'Nội dung gửi lên quá dài' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) }
                });
            }
            if (!env.GROQ_API_KEY) {
                return new Response(JSON.stringify({ error: 'Worker chưa cấu hình GROQ_API_KEY' }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) }
                });
            }

            const reply = await callGroq(env.GROQ_API_KEY.trim(), message, grounding, task);
            return new Response(JSON.stringify({ reply }), {
                status: 200,
                headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) }
            });
        } catch (err) {
            return new Response(JSON.stringify({ error: String(err && err.message || err) }), {
                status: 500,
                headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) }
            });
        }
    }
};
