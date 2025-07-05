-- Seed data for local D1 database
INSERT INTO categories (name, type, color, created_at, updated_at) VALUES
('エンターテイメント', 'expense', '#FF6B6B', datetime('now'), datetime('now')),
('仕事・ビジネス', 'expense', '#4ECDC4', datetime('now'), datetime('now')),
('学習・教育', 'expense', '#45B7D1', datetime('now'), datetime('now')),
('健康・フィットネス', 'expense', '#96CEB4', datetime('now'), datetime('now')),
('その他', 'expense', '#FFEAA7', datetime('now'), datetime('now'))
ON CONFLICT(id) DO NOTHING;