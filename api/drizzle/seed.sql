-- Seed data for local D1 database
-- 冪等性確保のため既存データをクリアし、スキーマを再作成

-- テーブルをドロップ（外部キー制約を考慮して順序を決定）
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS categories;

-- カテゴリテーブルを作成
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    color TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- 取引テーブルを作成
CREATE TABLE transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category_id INTEGER REFERENCES categories(id),
    description TEXT,
    date TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- サブスクリプションテーブルを作成
CREATE TABLE subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    amount REAL NOT NULL,
    billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly', 'weekly')) DEFAULT 'monthly',
    next_billing_date TEXT NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    description TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- カテゴリーマスターデータを投入（設定ファイルからの固定IDを使用）
INSERT INTO categories (id, name, type, color, created_at, updated_at) VALUES
-- 支出カテゴリ
(1, '家賃・水道・光熱・通信費', 'expense', '#D35400', datetime('now'), datetime('now')),
(2, '住居費', 'expense', '#4ECDC4', datetime('now'), datetime('now')),
(3, '食費', 'expense', '#FF6B6B', datetime('now'), datetime('now')),
(4, '交通費', 'expense', '#3498DB', datetime('now'), datetime('now')),
(5, '仕事・ビジネス', 'expense', '#8E44AD', datetime('now'), datetime('now')),
(6, 'システム関係日', 'expense', '#9B59B6', datetime('now'), datetime('now')),
(7, '学習・教育', 'expense', '#45B7D1', datetime('now'), datetime('now')),
(8, '書籍代', 'expense', '#1E8BC3', datetime('now'), datetime('now')),
(9, 'エンターテイメント', 'expense', '#E67E22', datetime('now'), datetime('now')),
(10, '健康・フィットネス', 'expense', '#96CEB4', datetime('now'), datetime('now')),
(11, '買い物', 'expense', '#F39C12', datetime('now'), datetime('now')),
(12, 'その他', 'expense', '#FFEAA7', datetime('now'), datetime('now')),
-- 収入カテゴリ
(13, '給与', 'income', '#2ECC71', datetime('now'), datetime('now')),
(14, '副業・フリーランス', 'income', '#27AE60', datetime('now'), datetime('now')),
(15, '投資・資産運用', 'income', '#16A085', datetime('now'), datetime('now')),
(16, '贈与・お祝い', 'income', '#1ABC9C', datetime('now'), datetime('now')),
(17, 'その他', 'income', '#58D68D', datetime('now'), datetime('now'));

-- サブスクリプションサンプルデータを投入
INSERT INTO subscriptions (name, amount, billing_cycle, next_billing_date, category_id, description, is_active, created_at, updated_at) VALUES
('GitHub Pro', 600, 'monthly', datetime('now', '+15 days'), 5, '※テストデータです。', 1, datetime('now'), datetime('now')),
('Netflix', 1490, 'monthly', datetime('now', '+7 days'), 9, '※テストデータです。', 1, datetime('now'), datetime('now')),
('Spotify Premium', 980, 'monthly', datetime('now', '+22 days'), 9, '※テストデータです。', 1, datetime('now'), datetime('now')),
('Adobe Creative Cloud', 28776, 'yearly', datetime('now', '+120 days'), 5, '※テストデータです。', 1, datetime('now'), datetime('now')),
('ChatGPT Plus', 3000, 'monthly', datetime('now', '+3 days'), 6, '※テストデータです。', 0, datetime('now'), datetime('now'));