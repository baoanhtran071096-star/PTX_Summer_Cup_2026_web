// ============================================================
// PTX AI Assistant — Gemini fallback proxy (Cloudflare Worker)
// ============================================================
// Purpose: keeps the Gemini API key server-side. index.html's
// askPTXAiFallback() POSTs { message, grounding } here; this worker
// calls Gemini with that grounding data injected as context and
// returns { reply }. Deploy with `wrangler deploy` after running
// `wrangler secret put GEMINI_API_KEY` — see README.md.

const ALLOWED_ORIGINS = [
    'https://ptxsummercup.vn',
    'https://www.ptxsummercup.vn'
];

const MAX_MESSAGE_LENGTH = 300;
const GEMINI_MODEL = 'gemini-2.0-flash';

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

function buildPrompt(message, grounding) {
    return `Bạn là "PTX AI Assistant" — trợ lý ảo của website PTX Summer Cup 2026 (giải bóng đá nội bộ 5v5 của Công đoàn PTX Group Việt Nam).

QUY TẮC BẮT BUỘC:
- CHỈ trả lời dựa trên dữ liệu JSON bên dưới. KHÔNG bịa thêm số liệu, tên cầu thủ, hay sự kiện không có trong dữ liệu.
- Nếu câu hỏi không liên quan đến giải đấu này hoặc dữ liệu không đủ để trả lời, hãy nói rõ là chưa có thông tin, đừng đoán.
- Trả lời bằng tiếng Việt, giọng văn ngắn gọn, thân thiện, có thể dùng emoji vừa phải (giống phong cách 1 trợ lý thể thao trẻ trung).
- Định dạng trả lời bằng HTML đơn giản (dùng <strong>, <br>, <em> nếu cần) — KHÔNG dùng markdown (không dùng **, #, -).
- Giới hạn khoảng 4-6 câu, đi thẳng vào trọng tâm.

DỮ LIỆU GIẢI ĐẤU (JSON):
${JSON.stringify(grounding)}

CÂU HỎI CỦA NGƯỜI DÙNG: "${message}"`;
}

async function callGemini(apiKey, message, grounding) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
    const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: buildPrompt(message, grounding) }] }],
            generationConfig: { temperature: 0.4, maxOutputTokens: 400 }
        })
    });

    if (!resp.ok) {
        const errText = await resp.text().catch(() => '');
        throw new Error(`Gemini API lỗi ${resp.status}: ${errText.slice(0, 200)}`);
    }

    const data = await resp.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Gemini không trả về nội dung');
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
            if (!env.GEMINI_API_KEY) {
                return new Response(JSON.stringify({ error: 'Worker chưa cấu hình GEMINI_API_KEY' }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) }
                });
            }

            const reply = await callGemini(env.GEMINI_API_KEY, message, grounding);
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
