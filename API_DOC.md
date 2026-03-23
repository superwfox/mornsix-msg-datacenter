# mornsix-msg-datacenter API 接口文档

## 通用说明

| 项目       | 说明                                           |
|----------|----------------------------------------------|
| Base URL | `https://mornsix-msg-datacenter.pages.dev`                |
| 鉴权方式     | 请求头 `key: mornsix`                           |
| Content-Type | `application/json`                         |
| 请求方法     | 所有接口均使用 **POST**                              |

### 通用响应格式

```json
{
    "code": 200,
    "msg": "OK",
    "data": "..."
}
```

> `data` 字段仅在读取接口中返回。

---

## 1. 写入消息

**POST** `/api/write`

### 请求头

| Header       | 必填 | 值          |
|--------------|------|------------|
| `key`        | 是   | `mornsix`  |
| `Content-Type` | 是   | `application/json` |

### 请求体

| 字段        | 类型     | 必填 | 说明                       |
|-----------|--------|------|--------------------------|
| `timestamp` | number | 是   | 消息时间戳（Unix 秒/毫秒均可）       |
| `qq`        | string | 是   | QQ 号（字符串类型，不定位数）         |
| `content`   | string | 是   | 消息内容                     |

### 请求示例

```bash
curl -X POST https://<your-pages-domain>/api/write \
  -H "key: mornsix" \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": 1711180800,
    "qq": "123456789",
    "content": "这是一条测试消息"
  }'
```

### 成功响应

```json
{
    "code": 200,
    "msg": "OK"
}
```

### 错误响应示例

```json
{
    "code": 401,
    "msg": "Unauthorized"
}
```

```json
{
    "code": 400,
    "msg": "Missing or invalid field: qq (string expected)"
}
```

### 业务逻辑

- 每次写入会追加一条记录到数据库
- 每位用户（QQ号）最多保留 **100** 条记录
- 超过 100 条时，自动删除该用户最早的记录

---

## 2. 读取消息

**POST** `/api/read`

### 请求头

| Header       | 必填 | 值          |
|--------------|------|------------|
| `key`        | 是   | `mornsix`  |
| `Content-Type` | 是   | `application/json` |

### 请求体

| 字段      | 类型     | 必填 | 说明                        |
|---------|--------|------|---------------------------|
| `qq`    | string | 是   | QQ 号（字符串类型，不定位数）          |
| `count` | number | 是   | 查询数量，整数，范围 **30 ~ 100**    |

### 请求示例

```bash
curl -X POST https://<your-pages-domain>/api/read \
  -H "key: mornsix" \
  -H "Content-Type: application/json" \
  -d '{
    "qq": "123456789",
    "count": 50
  }'
```

### 成功响应

```json
{
    "code": 200,
    "msg": "OK",
    "data": [
        {
            "id": 102,
            "qq": "123456789",
            "content": "最新一条消息",
            "timestamp": 1711180800,
            "created_at": "2026-03-23 03:00:00"
        },
        {
            "id": 101,
            "qq": "123456789",
            "content": "倒数第二条消息",
            "timestamp": 1711094400,
            "created_at": "2026-03-22 03:00:00"
        }
    ]
}
```

> `data` 数组按 `timestamp` **降序**排列（最新的在前）。

### 错误响应示例

```json
{
    "code": 400,
    "msg": "Field 'count' must be an integer between 30 and 100"
}
```

---

## 3. 各语言请求示例

### Python

```python
import requests

BASE_URL = "https://<your-pages-domain>"
HEADERS = {
    "key": "mornsix",
    "Content-Type": "application/json"
}

# 写入
resp = requests.post(f"{BASE_URL}/api/write", headers=HEADERS, json={
    "timestamp": 1711180800,
    "qq": "123456789",
    "content": "Hello from Python"
})
print(resp.json())

# 读取
resp = requests.post(f"{BASE_URL}/api/read", headers=HEADERS, json={
    "qq": "123456789",
    "count": 30
})
print(resp.json())
```

### JavaScript (fetch)

```javascript
const BASE_URL = "https://<your-pages-domain>";
const HEADERS = {
    "key": "mornsix",
    "Content-Type": "application/json"
};

// 写入
const writeResp = await fetch(`${BASE_URL}/api/write`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
        timestamp: 1711180800,
        qq: "123456789",
        content: "Hello from JS"
    })
});
console.log(await writeResp.json());

// 读取
const readResp = await fetch(`${BASE_URL}/api/read`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
        qq: "123456789",
        count: 50
    })
});
console.log(await readResp.json());
```

### Java (HttpClient)

```java
import java.net.URI;
import java.net.http.*;
import java.net.http.HttpRequest.BodyPublishers;

HttpClient client = HttpClient.newHttpClient();

// 写入
HttpRequest writeReq = HttpRequest.newBuilder()
    .uri(URI.create("https://<your-pages-domain>/api/write"))
    .header("key", "mornsix")
    .header("Content-Type", "application/json")
    .POST(BodyPublishers.ofString("""
        {"timestamp":1711180800,"qq":"123456789","content":"Hello from Java"}
        """))
    .build();
HttpResponse<String> writeResp = client.send(writeReq, HttpResponse.BodyHandlers.ofString());
System.out.println(writeResp.body());

// 读取
HttpRequest readReq = HttpRequest.newBuilder()
    .uri(URI.create("https://<your-pages-domain>/api/read"))
    .header("key", "mornsix")
    .header("Content-Type", "application/json")
    .POST(BodyPublishers.ofString("""
        {"qq":"123456789","count":30}
        """))
    .build();
HttpResponse<String> readResp = client.send(readReq, HttpResponse.BodyHandlers.ofString());
System.out.println(readResp.body());
```

---

## 4. 部署须知

### 初始化数据库

首次部署前需执行数据库迁移来建表：

```bash
npx wrangler d1 execute morn --remote --file=./migrations/0001_init.sql
```

### 本地开发

```bash
# 本地创建 D1 数据库（开发用）
npx wrangler d1 execute morn --local --file=./migrations/0001_init.sql

# 启动本地开发服务器
npx wrangler pages dev --d1=DB -- npx vite
```

---

## 5. 错误码总览

| code | 含义                        |
|------|---------------------------|
| 200  | 成功                        |
| 400  | 请求参数错误（缺少字段 / 类型不对 / 范围超限） |
| 401  | 鉴权失败（缺少或错误的 key 请求头）      |
| 500  | 服务器/数据库内部错误               |
