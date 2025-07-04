import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createServer } from 'node:http';
import SQLiteDatabase from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './src/db/schema.js';

const app = new Hono();

// CORS設定
app.use('/api/*', cors({
  origin: ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:3003'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// データベース接続（手動でNode.js用に設定）
const sqlite = new SQLiteDatabase('./dev.db');
const db = drizzle(sqlite, { schema });

// データベースインスタンスをミドルウェアで設定
app.use('/api/*', async (c, next) => {
  c.set('db', db);
  await next();
});

// データベース接続のテスト用エンドポイント
app.get('/api/health', async (c) => {
  try {
    const db = c.get('db');
    console.log('Health check: database instance retrieved');
    const result = await db.select().from(schema.categories).limit(1);
    console.log('Health check: query successful, result:', result);
    return c.json({
      status: 'ok',
      database: 'connected',
      environment: 'development',
      timestamp: new Date().toISOString(),
      debug: {
        categoriesCount: result.length,
        branch: 'issue-53',
        schemaFixed: true,
      },
    });
  } catch (error) {
    console.error('Health check error:', error);
    return c.json({
      status: 'error',
      database: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      debug: {
        branch: 'issue-53',
        schemaFixed: true,
      },
    }, 500);
  }
});

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
    return c.json(result);
  } catch (error) {
    console.error('Error in GET /subscriptions:', error);
    return c.json({ error: 'Failed to fetch subscriptions' }, 500);
  }
});

const port = 5174;
console.log(`Server is running on port ${port}`);

const server = createServer(async (req, res) => {
  const response = await app.fetch(req);
  res.writeHead(response.status, response.headers);
  res.end(await response.text());
});

server.listen(port, () => {
  console.log(`Server is listening on http://localhost:${port}`);
});