-- 消息记录表
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    qq TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

-- 为 qq 和 timestamp 创建索引，加速按用户查询和按时间排序
CREATE INDEX IF NOT EXISTS idx_messages_qq ON messages(qq);
CREATE INDEX IF NOT EXISTS idx_messages_qq_timestamp ON messages(qq, timestamp DESC);
