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

// POST /api/write — 写入消息
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

    const { timestamp, qq, content } = body;

    // 参数校验
    if (timestamp === undefined || timestamp === null) {
        return json(400, "Missing field: timestamp");
    }
    if (!qq || typeof qq !== "string") {
        return json(400, "Missing or invalid field: qq (string expected)");
    }
    if (!content || typeof content !== "string") {
        return json(400, "Missing or invalid field: content (string expected)");
    }

    try {
        // 1. 插入新记录
        await db
            .prepare("INSERT INTO messages (qq, content, timestamp) VALUES (?, ?, ?)")
            .bind(qq, content, Number(timestamp))
            .run();

        // 2. 保留最近 100 条，删除多余旧记录
        await db
            .prepare(
                `DELETE FROM messages WHERE qq = ? AND id NOT IN (
                    SELECT id FROM messages WHERE qq = ? ORDER BY timestamp DESC LIMIT 100
                )`
            )
            .bind(qq, qq)
            .run();

        return json(200, "OK");
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
