import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { eq } from 'drizzle-orm';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import SQLiteDatabase from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './src/db/schema.ts';
import { ALL_CATEGORIES } from '../shared/src/config/categories.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = new Hono();

// CORS設定（E2E環境用）
app.use('/api/*', cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:3004'
  ],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// E2E専用データベースの初期化
// CI環境では db/e2e-test.db を使用
const E2E_DB_PATH = './db/e2e-test.db';
console.log('=== E2E Server Database Initialization ===');

// 既存のE2Eデータベースがあれば安全にクローズ
try {
  const existingDb = new SQLiteDatabase(E2E_DB_PATH);
  existingDb.close();
  console.log('Previous E2E database closed successfully');
} catch (error) {
  console.log('Previous E2E database not found or already closed');
}

// 新しいデータベースを作成
const sqlite = new SQLiteDatabase(E2E_DB_PATH);
const db = drizzle(sqlite, { schema });

// シードファイルを読み込んでデータベースを初期化
try {
  const seedSQL = readFileSync(join(__dirname, 'drizzle', 'seed.sql'), 'utf8');
  
  // datetime関数を事前に置換
  const processedSQL = seedSQL
    .replace(/datetime\('now'\)/g, `'${new Date().toISOString()}'`)
    .replace(/datetime\('now', '\+15 days'\)/g, `'${new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()}'`)
    .replace(/datetime\('now', '\+7 days'\)/g, `'${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()}'`)
    .replace(/datetime\('now', '\+22 days'\)/g, `'${new Date(Date.now() + 22 * 24 * 60 * 60 * 1000).toISOString()}'`)
    .replace(/datetime\('now', '\+120 days'\)/g, `'${new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString()}'`)
    .replace(/datetime\('now', '\+3 days'\)/g, `'${new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()}'`);
  
  console.log('📝 Executing complete SQL script...');
  
  // 完全なSQLスクリプトを一度に実行
  sqlite.exec(processedSQL);
  
  console.log('✅ Database seeded successfully');
  
  // サブスクリプション数を確認
  const subscriptionCount = sqlite.prepare('SELECT COUNT(*) as count FROM subscriptions').get();
  console.log(`✅ Subscriptions initialized: ${subscriptionCount.count} subscriptions`);
  
  // トランザクション数も確認
  const transactionCount = sqlite.prepare('SELECT COUNT(*) as count FROM transactions').get();
  console.log(`✅ Transactions tables created (${transactionCount.count} transactions)`);
  
} catch (error) {
  console.error('❌ Failed to seed database:', error);
  console.error('❌ Error details:', error.message);
  console.error('❌ Error stack:', error.stack);
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
    // トランザクションテーブルでDB接続を確認
    const result = await db.select().from(schema.transactions).limit(1);
    const subscriptionCount = await db.select().from(schema.subscriptions);
    
    return c.json({
      status: 'ok',
      database: 'connected',
      environment: 'e2e-test',
      timestamp: new Date().toISOString(),
      debug: {
        categoriesCount: ALL_CATEGORIES.length, // 設定から取得
        subscriptionsCount: subscriptionCount.length,
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

// カテゴリ関連エンドポイント（設定ファイルから取得）
// カテゴリ一覧取得
app.get('/api/categories', async (c) => {
  try {
    // 設定ファイルからカテゴリを取得
    const categories = ALL_CATEGORIES.map(category => ({
      id: category.numericId,
      name: category.name,
      type: category.type,
      color: category.color,
      description: category.description || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    
    console.log(`[E2E] Categories fetched from config: ${categories.length} items`);
    return c.json(categories);
  } catch (error) {
    console.error('[E2E] Error fetching categories:', error);
    return c.json({ error: 'Failed to fetch categories' }, 500);
  }
});

// カテゴリ作成（E2E環境では無効）
app.post('/api/categories', async (c) => {
  return c.json({ error: 'Categories are read-only in E2E environment' }, 405);
});

// カテゴリ更新（E2E環境では無効）
app.put('/api/categories/:id', async (c) => {
  return c.json({ error: 'Categories are read-only in E2E environment' }, 405);
});

// カテゴリ削除（E2E環境では無効）
app.delete('/api/categories/:id', async (c) => {
  return c.json({ error: 'Categories are read-only in E2E environment' }, 405);
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

// トランザクション（支出・収入）関連エンドポイント
// トランザクション一覧取得
app.get('/api/transactions', async (c) => {
  try {
    const db = c.get('db');
    const type = c.req.query('type'); // 'expense' or 'income'
    
    let query = db.select().from(schema.transactions);
    if (type) {
      query = query.where(eq(schema.transactions.type, type));
    }
    
    const result = await query;
    console.log(`[E2E] Transactions fetched: ${result.length} items (type: ${type || 'all'})`);
    return c.json(result);
  } catch (error) {
    console.error('[E2E] Error fetching transactions:', error);
    return c.json({ error: 'Failed to fetch transactions' }, 500);
  }
});

// トランザクション作成（支出・収入登録）
app.post('/api/transactions', async (c) => {
  try {
    const body = await c.req.json();
    const db = c.get('db');

    const newTransaction = {
      amount: body.amount,
      type: body.type || 'expense',
      categoryId: body.categoryId,
      description: body.description,
      date: body.date,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await db.insert(schema.transactions).values(newTransaction).returning();
    console.log(`[E2E] Transaction created: ${result[0].type} - ${result[0].amount}`);
    return c.json(result[0], 201);
  } catch (error) {
    console.error('[E2E] Error creating transaction:', error);
    return c.json({ error: 'Failed to create transaction' }, 500);
  }
});

// トランザクション更新
app.put('/api/transactions/:id', async (c) => {
  try {
    const id = Number.parseInt(c.req.param('id'));
    const body = await c.req.json();
    const db = c.get('db');

    const updateData = {
      ...body,
      updatedAt: new Date().toISOString(),
    };

    const result = await db
      .update(schema.transactions)
      .set(updateData)
      .where(eq(schema.transactions.id, id))
      .returning();

    if (result.length === 0) {
      return c.json({ error: 'Transaction not found' }, 404);
    }

    return c.json(result[0]);
  } catch (error) {
    console.error('[E2E] Error updating transaction:', error);
    return c.json({ error: 'Failed to update transaction' }, 500);
  }
});

// トランザクション削除
app.delete('/api/transactions/:id', async (c) => {
  try {
    const id = Number.parseInt(c.req.param('id'));
    const db = c.get('db');

    const result = await db.delete(schema.transactions).where(eq(schema.transactions.id, id)).returning();

    if (result.length === 0) {
      return c.json({ error: 'Transaction not found' }, 404);
    }

    return c.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('[E2E] Error deleting transaction:', error);
    return c.json({ error: 'Failed to delete transaction' }, 500);
  }
});

const port = 3004;
console.log(`=== E2E API Server Starting ===`);
console.log(`Server will run on port ${port}`);
console.log(`Database path: ${E2E_DB_PATH}`);

const server = createServer(async (req, res) => {
  try {
    // Node.jsリクエストをWeb標準Requestに変換
    const url = `http://localhost:${port}${req.url}`;
    const method = req.method || 'GET';
    
    // リクエストボディを読み取り（POST/PUT/PATCHの場合）
    let body = undefined;
    if (method !== 'GET' && method !== 'HEAD') {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      body = Buffer.concat(chunks);
    }
    
    // ヘッダーを変換
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (Array.isArray(value)) {
        for (const v of value) {
          headers.append(key, v);
        }
      } else if (value) {
        headers.set(key, value);
      }
    }
    
    // Web標準Requestオブジェクトを作成
    const request = new Request(url, {
      method,
      headers,
      body: body || undefined,
    });
    
    // Honoアプリケーションで処理
    const response = await app.fetch(request);
    
    // レスポンスヘッダーをコピー
    for (const [key, value] of response.headers.entries()) {
      res.setHeader(key, value);
    }
    
    res.writeHead(response.status);
    
    // レスポンスボディを読み取り
    const responseBody = await response.text();
    res.end(responseBody);
  } catch (error) {
    console.error('[E2E] Server error:', error);
    console.error('[E2E] Error details:', error.message);
    console.error('[E2E] Error stack:', error.stack);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
});

server.listen(port, () => {
  console.log(`✅ E2E API Server is running on http://localhost:${port}`);
  console.log(`✅ Health check: http://localhost:${port}/api/health`);
  console.log(`✅ Categories API: http://localhost:${port}/api/categories`);
  console.log(`✅ Transactions API: http://localhost:${port}/api/transactions`);
  console.log(`✅ Subscriptions API: http://localhost:${port}/api/subscriptions`);
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