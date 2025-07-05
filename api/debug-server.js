import SQLiteDatabase from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { integer, text, sqliteTable } from 'drizzle-orm/sqlite-core';

const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  type: text('type').notNull(),
  color: text('color'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

console.log('Testing database connection...');

try {
  const sqlite = new SQLiteDatabase('./dev.db');
  const db = drizzle(sqlite, { schema: { categories } });
  
  console.log('Database instance created successfully');
  
  // Test basic query
  const result = await db.select().from(categories).limit(1);
  console.log('Query result:', result);
  
  sqlite.close();
  console.log('Database connection test successful');
} catch (error) {
  console.error('Database connection test failed:', error);
  console.error('Error details:', error.message);
  console.error('Stack trace:', error.stack);
}