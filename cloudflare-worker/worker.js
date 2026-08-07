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
const ALLOWED_ORIGINS = [
    'https://ptxsummercup.vn',
    'https://www.ptxsummercup.vn',
    'https://baoanhtran071096-star.github.io'
];

const MAX_MESSAGE_LENGTH = 300;
const GROQ_MODEL = 'llama-3.3-70b-versatile';

function isAllowedOrigin(origin) {
    if (!origin) return false;
    if (ALLOWED_ORIGINS.includes(origin)) return true;
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

async function callGroq(apiKey, message, grounding) {
    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: GROQ_MODEL,
            messages: [
                { role: 'system', content: buildSystemPrompt(grounding) },
                { role: 'user', content: message }
            ],
            temperature: 0.4,
            max_tokens: 400
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

            if (!message) {
                return new Response(JSON.stringify({ error: 'Thiếu message' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) }
                });
            }
            if (message.length > MAX_MESSAGE_LENGTH) {
                return new Response(JSON.stringify({ error: 'Câu hỏi quá dài' }), {
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

            const reply = await callGroq(env.GROQ_API_KEY.trim(), message, grounding);
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
