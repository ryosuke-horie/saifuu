import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { eq } from 'drizzle-orm';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import SQLiteDatabase from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './src/db/schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = new Hono();

// CORS設定（E2E環境用）
app.use('/api/*', cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3002',
    'http://localhost:3003'
  ],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// E2E専用データベースの初期化
const E2E_DB_PATH = './e2e-test.db';
console.log('=== E2E Server Database Initialization ===');

// 既存のE2Eデータベースがあれば削除
try {
  SQLiteDatabase(E2E_DB_PATH).close();
} catch (error) {
  // ファイルが存在しない場合は無視
}

// 新しいデータベースを作成
const sqlite = new SQLiteDatabase(E2E_DB_PATH);
const db = drizzle(sqlite, { schema });

// シードファイルを読み込んでデータベースを初期化
try {
  const seedSQL = readFileSync(join(__dirname, 'drizzle', 'seed.sql'), 'utf8');
  
  // SQLファイルを文毎に実行（better-sqlite3用に調整）
  const statements = seedSQL
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
  
  for (const statement of statements) {
    if (statement.toLowerCase().includes('datetime(')) {
      // SQLiteのdatetime関数をJavaScriptの日付文字列に置換
      const modifiedStatement = statement
        .replace(/datetime\('now'\)/g, `'${new Date().toISOString()}'`)
        .replace(/datetime\('now', '[^']*'\)/g, function(match) {
          // 相対日付の計算（簡略化）
          if (match.includes('+15 days')) {
            const date = new Date();
            date.setDate(date.getDate() + 15);
            return `'${date.toISOString()}'`;
          } else if (match.includes('+7 days')) {
            const date = new Date();
            date.setDate(date.getDate() + 7);
            return `'${date.toISOString()}'`;
          } else if (match.includes('+22 days')) {
            const date = new Date();
            date.setDate(date.getDate() + 22);
            return `'${date.toISOString()}'`;
          } else if (match.includes('+120 days')) {
            const date = new Date();
            date.setDate(date.getDate() + 120);
            return `'${date.toISOString()}'`;
          } else if (match.includes('+3 days')) {
            const date = new Date();
            date.setDate(date.getDate() + 3);
            return `'${date.toISOString()}'`;
          }
          return `'${new Date().toISOString()}'`;
        });
      sqlite.exec(modifiedStatement);
    } else {
      sqlite.exec(statement);
    }
  }
  
  console.log('✅ Database seeded successfully');
  
  // カテゴリ数を確認
  const categoryCount = sqlite.prepare('SELECT COUNT(*) as count FROM categories').get();
  console.log(`✅ Categories initialized: ${categoryCount.count} categories`);
  
} catch (error) {
  console.error('❌ Failed to seed database:', error);
  process.exit(1);
}

// データベースインスタンスをミドルウェアで設定
app.use('/api/*', async (c, next) => {
  c.set('db', db);
  await next();
});

// ヘルスチェックエンドポイント
app.get('/api/health', async (c) => {
  try {
    const db = c.get('db');
    const result = await db.select().from(schema.categories).limit(1);
    const categoryCount = await db.select().from(schema.categories);
    
    return c.json({
      status: 'ok',
      database: 'connected',
      environment: 'e2e-test',
      timestamp: new Date().toISOString(),
      debug: {
        categoriesCount: categoryCount.length,
        dbPath: E2E_DB_PATH,
        server: 'node-e2e'
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    return c.json({
      status: 'error',
      database: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: 'e2e-test',
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// カテゴリ関連エンドポイント
// カテゴリ一覧取得
app.get('/api/categories', async (c) => {
  try {
    const db = c.get('db');
    const result = await db.select().from(schema.categories);
    console.log(`[E2E] Categories fetched: ${result.length} items`);
    return c.json(result);
  } catch (error) {
    console.error('[E2E] Error fetching categories:', error);
    return c.json({ error: 'Failed to fetch categories' }, 500);
  }
});

// カテゴリ作成
app.post('/api/categories', async (c) => {
  try {
    const body = await c.req.json();
    const db = c.get('db');

    const newCategory = {
      name: body.name,
      type: body.type,
      color: body.color,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await db.insert(schema.categories).values(newCategory).returning();
    return c.json(result[0], 201);
  } catch (error) {
    console.error('[E2E] Error creating category:', error);
    return c.json({ error: 'Failed to create category' }, 500);
  }
});

// カテゴリ更新
app.put('/api/categories/:id', async (c) => {
  try {
    const id = Number.parseInt(c.req.param('id'));
    const body = await c.req.json();
    const db = c.get('db');

    const updateData = {
      ...body,
      updatedAt: new Date().toISOString(),
    };

    const result = await db
      .update(schema.categories)
      .set(updateData)
      .where(eq(schema.categories.id, id))
      .returning();

    if (result.length === 0) {
      return c.json({ error: 'Category not found' }, 404);
    }

    return c.json(result[0]);
  } catch (error) {
    console.error('[E2E] Error updating category:', error);
    return c.json({ error: 'Failed to update category' }, 500);
  }
});

// カテゴリ削除
app.delete('/api/categories/:id', async (c) => {
  try {
    const id = Number.parseInt(c.req.param('id'));
    const db = c.get('db');

    const result = await db.delete(schema.categories).where(eq(schema.categories.id, id)).returning();

    if (result.length === 0) {
      return c.json({ error: 'Category not found' }, 404);
    }

    return c.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('[E2E] Error deleting category:', error);
    return c.json({ error: 'Failed to delete category' }, 500);
  }
});

// サブスクリプション関連エンドポイント
// サブスクリプション一覧取得
app.get('/api/subscriptions', async (c) => {
  try {
    const db = c.get('db');
    const result = await db
      .select({
        id: schema.subscriptions.id,
        name: schema.subscriptions.name,
        amount: schema.subscriptions.amount,
        billingCycle: schema.subscriptions.billingCycle,
        nextBillingDate: schema.subscriptions.nextBillingDate,
        description: schema.subscriptions.description,
        isActive: schema.subscriptions.isActive,
        categoryId: schema.subscriptions.categoryId,
        createdAt: schema.subscriptions.createdAt,
        updatedAt: schema.subscriptions.updatedAt,
      })
      .from(schema.subscriptions);
    
    console.log(`[E2E] Subscriptions fetched: ${result.length} items`);
    return c.json(result);
  } catch (error) {
    console.error('[E2E] Error fetching subscriptions:', error);
    return c.json({ error: 'Failed to fetch subscriptions' }, 500);
  }
});

// サブスクリプション作成
app.post('/api/subscriptions', async (c) => {
  try {
    const body = await c.req.json();
    const db = c.get('db');

    const newSubscription = {
      name: body.name,
      amount: body.amount,
      billingCycle: body.billingCycle || 'monthly',
      nextBillingDate: body.nextBillingDate,
      categoryId: body.categoryId,
      description: body.description,
      isActive: body.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await db.insert(schema.subscriptions).values(newSubscription).returning();
    console.log(`[E2E] Subscription created: ${result[0].name}`);
    return c.json(result[0], 201);
  } catch (error) {
    console.error('[E2E] Error creating subscription:', error);
    return c.json({ error: 'Failed to create subscription' }, 500);
  }
});

// サブスクリプション更新
app.put('/api/subscriptions/:id', async (c) => {
  try {
    const id = Number.parseInt(c.req.param('id'));
    const body = await c.req.json();
    const db = c.get('db');

    const updateData = {
      ...body,
      updatedAt: new Date().toISOString(),
    };

    const result = await db
      .update(schema.subscriptions)
      .set(updateData)
      .where(eq(schema.subscriptions.id, id))
      .returning();

    if (result.length === 0) {
      return c.json({ error: 'Subscription not found' }, 404);
    }

    return c.json(result[0]);
  } catch (error) {
    console.error('[E2E] Error updating subscription:', error);
    return c.json({ error: 'Failed to update subscription' }, 500);
  }
});

// サブスクリプション削除
app.delete('/api/subscriptions/:id', async (c) => {
  try {
    const id = Number.parseInt(c.req.param('id'));
    const db = c.get('db');

    const result = await db.delete(schema.subscriptions).where(eq(schema.subscriptions.id, id)).returning();

    if (result.length === 0) {
      return c.json({ error: 'Subscription not found' }, 404);
    }

    return c.json({ message: 'Subscription deleted successfully' });
  } catch (error) {
    console.error('[E2E] Error deleting subscription:', error);
    return c.json({ error: 'Failed to delete subscription' }, 500);
  }
});

const port = 3003;
console.log(`=== E2E API Server Starting ===`);
console.log(`Server will run on port ${port}`);
console.log(`Database path: ${E2E_DB_PATH}`);

const server = createServer(async (req, res) => {
  try {
    const response = await app.fetch(req);
    
    // レスポンスヘッダーをコピー
    for (const [key, value] of response.headers.entries()) {
      res.setHeader(key, value);
    }
    
    res.writeHead(response.status);
    
    // レスポンスボディを読み取り
    const body = await response.text();
    res.end(body);
  } catch (error) {
    console.error('[E2E] Server error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
});

server.listen(port, () => {
  console.log(`✅ E2E API Server is running on http://localhost:${port}`);
  console.log(`✅ Health check: http://localhost:${port}/api/health`);
  console.log(`✅ Categories API: http://localhost:${port}/api/categories`);
  console.log(`✅ Database initialized with seed data`);
});

// グレースフルシャットダウン
process.on('SIGTERM', () => {
  console.log('📝 Shutting down E2E server...');
  sqlite.close();
  server.close(() => {
    console.log('✅ E2E server shut down gracefully');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📝 Shutting down E2E server...');
  sqlite.close();
  server.close(() => {
    console.log('✅ E2E server shut down gracefully');
    process.exit(0);
  });
});