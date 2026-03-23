// 统一鉴权中间件
function auth(request) {
    const key = request.headers.get("key");
    if (key !== "mornsix") {
        return new Response(JSON.stringify({ code: 401, msg: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }
    return null;
}

// POST /api/read — 读取消息
export async function onRequestPost(context) {
    const { request, env } = context;
    const db = env.DB;

    // 鉴权
    const denied = auth(request);
    if (denied) return denied;

    // 解析请求体
    let body;
    try {
        body = await request.json();
    } catch {
        return json(400, "Invalid JSON body");
    }

    const { qq, count } = body;

    // 参数校验
    if (!qq || typeof qq !== "string") {
        return json(400, "Missing or invalid field: qq (string expected)");
    }

    const n = Number(count);
    if (!Number.isInteger(n) || n < 30 || n > 100) {
        return json(400, "Field 'count' must be an integer between 30 and 100");
    }

    try {
        const { results } = await db
            .prepare(
                "SELECT id, qq, content, timestamp, created_at FROM messages WHERE qq = ? ORDER BY timestamp DESC LIMIT ?"
            )
            .bind(qq, n)
            .all();

        return json(200, "OK", results);
    } catch (e) {
        return json(500, "Database error: " + e.message);
    }
}

function json(code, msg, data) {
    const body = { code, msg };
    if (data !== undefined) body.data = data;
    return new Response(JSON.stringify(body), {
        status: code,
        headers: { "Content-Type": "application/json" },
    });
}
