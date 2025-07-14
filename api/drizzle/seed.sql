-- Seed data for local D1 database
-- 冪等性確保のため既存データをクリアし、スキーマを再作成

-- テーブルをドロップ（外部キー制約を考慮して順序を決定）
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS transactions;

-- 取引テーブルを作成（カテゴリIDは設定ファイルのnumericIdを参照）
CREATE TABLE transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category_id INTEGER,
    description TEXT,
    date TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- サブスクリプションテーブルを作成（カテゴリIDは設定ファイルのnumericIdを参照）
CREATE TABLE subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    amount REAL NOT NULL,
    billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly', 'weekly')) DEFAULT 'monthly',
    next_billing_date TEXT NOT NULL,
    category_id INTEGER,
    description TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- サブスクリプションサンプルデータを投入（カテゴリIDは設定ファイルのnumericIdを使用）
INSERT INTO subscriptions (name, amount, billing_cycle, next_billing_date, category_id, description, is_active, created_at, updated_at) VALUES
('GitHub Pro', 600, 'monthly', datetime('now', '+15 days'), 5, '※テストデータです。', 1, datetime('now'), datetime('now')),
('Netflix', 1490, 'monthly', datetime('now', '+7 days'), 9, '※テストデータです。', 1, datetime('now'), datetime('now')),
('Spotify Premium', 980, 'monthly', datetime('now', '+22 days'), 9, '※テストデータです。', 1, datetime('now'), datetime('now')),
('Adobe Creative Cloud', 28776, 'yearly', datetime('now', '+120 days'), 5, '※テストデータです。', 1, datetime('now'), datetime('now')),
('ChatGPT Plus', 3000, 'monthly', datetime('now', '+3 days'), 6, '※テストデータです。', 0, datetime('now'), datetime('now'));