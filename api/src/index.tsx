import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createDatabase, createDevDatabase, type AnyDatabase, type Env } from './db'
import { categories } from './db/schema'
import { renderer } from './renderer'
import categoriesRouter from './routes/categories'
import subscriptionsRouter from './routes/subscriptions'

const app = new Hono<{ 
	Bindings: Env
	Variables: {
		db: AnyDatabase
	}
}>()

// CORS設定（開発環境用）
app.use('/api/*', cors({
	origin: ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:3003'],
	allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	allowHeaders: ['Content-Type', 'Authorization'],
}))

// 開発環境判定
const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV

// ミドルウェア: データベース接続を設定
app.use('/api/*', async (c, next) => {
	if (isDev) {
		// 開発環境ではローカルSQLiteを使用
		const db = createDevDatabase()
		c.set('db', db)
	} else {
		// 本番環境ではCloudflare D1を使用
		const db = createDatabase(c.env.DB)
		c.set('db', db)
	}
	await next()
})

app.use(renderer)

app.get('/', (c) => {
	return c.render(<h1>Saifuu API - 家計管理アプリケーション</h1>)
})

// データベース接続のテスト用エンドポイント
app.get('/api/health', async (c) => {
	try {
		const db = c.get('db')
		// シンプルなクエリでデータベース接続をテスト
		const _result = await db.select().from(categories).limit(1)
		return c.json({
			status: 'ok',
			database: 'connected',
			environment: isDev ? 'development' : 'production',
			timestamp: new Date().toISOString(),
		})
	} catch (error) {
		return c.json(
			{
				status: 'error',
				database: 'failed',
				error: error instanceof Error ? error.message : 'Unknown error',
				timestamp: new Date().toISOString(),
			},
			500
		)
	}
})

// APIルートの設定
app.route('/api/categories', categoriesRouter)
app.route('/api/subscriptions', subscriptionsRouter)

export default app
