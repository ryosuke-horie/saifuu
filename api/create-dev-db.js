import SQLiteDatabase from 'better-sqlite3';

console.log('Creating development database...');

try {
  const db = new SQLiteDatabase('./dev.db');
  console.log('Database file created successfully');

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      color TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      category_id INTEGER,
      description TEXT,
      date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories (id)
    );
    
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      billing_cycle TEXT NOT NULL DEFAULT 'monthly',
      next_billing_date TEXT NOT NULL,
      category_id INTEGER,
      description TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories (id)
    );
  `);

  console.log('Tables created successfully');

  // Insert default categories
  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get();
  if (categoryCount.count === 0) {
    db.exec(`
      INSERT INTO categories (name, type, color) VALUES
      ('エンターテイメント', 'expense', '#FF6B6B'),
      ('仕事・ビジネス', 'expense', '#4ECDC4'),
      ('学習・教育', 'expense', '#45B7D1'),
      ('健康・フィットネス', 'expense', '#96CEB4'),
      ('その他', 'expense', '#FFEAA7');
    `);
    console.log('Default categories inserted');
  }

  // Test query
  const result = db.prepare('SELECT COUNT(*) as count FROM categories').get();
  console.log(`Database ready with ${result.count} categories`);

  db.close();
  console.log('Database setup completed successfully');
} catch (error) {
  console.error('Error creating database:', error);
  process.exit(1);
}