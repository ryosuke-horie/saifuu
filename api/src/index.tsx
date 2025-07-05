import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { type AnyDatabase, createDatabase, createDevDatabase, type Env } from './db'
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
app.use(
	'/api/*',
	cors({
		origin: ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:3003'],
		allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowHeaders: ['Content-Type', 'Authorization'],
	})
)

// 開発環境判定
const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV

// ミドルウェア: データベース接続を設定
app.use('/api/*', async (c, next) => {
	try {
		console.log('=== Database middleware start ===')
		console.log('Environment isDev:', isDev)
		console.log('Request path:', c.req.path)
		
		// 開発環境・本番環境の両方でCloudflare D1を使用
		// wrangler dev では c.env.DB がローカルD1インスタンスを提供
		const db = createDatabase(c.env.DB)
		console.log('D1 database created successfully')
		c.set('db', db)
		console.log('Database set in context')
		
		console.log('Database middleware completed, calling next()')
		await next()
		console.log('Next() completed successfully')
	} catch (error) {
		console.error('=== Database middleware error ===')
		console.error('Error in database middleware:', error)
		console.error('Error type:', typeof error)
		console.error('Error message:', error instanceof Error ? error.message : String(error))
		console.error('Error stack:', error instanceof Error ? error.stack : undefined)
		
		return c.json({
			error: 'Database initialization failed',
			details: error instanceof Error ? error.message : String(error)
		}, 500)
	}
})

app.use(renderer)

app.get('/', (c) => {
	return c.render(<h1>Saifuu API - 家計管理アプリケーション</h1>)
})

// データベース接続のテスト用エンドポイント
app.get('/api/health', async (c) => {
	try {
		console.log('=== Health check start ===')
		const db = c.get('db')
		console.log('Health check: database instance retrieved', typeof db)
		
		if (!db) {
			throw new Error('Database instance is null or undefined')
		}
		
		console.log('Health check: attempting database query')
		// シンプルなクエリでデータベース接続をテスト
		const result = await db.select().from(categories).limit(1)
		console.log('Health check: query successful, result:', result)
		return c.json({
			status: 'ok',
			database: 'connected',
			environment: isDev ? 'development' : 'production',
			timestamp: new Date().toISOString(),
			debug: {
				categoriesCount: result.length,
				branch: 'issue-53',
				schemaFixed: true,
			},
		})
	} catch (error) {
		console.error('=== Health check error ===')
		console.error('Error type:', typeof error)
		console.error('Error message:', error instanceof Error ? error.message : String(error))
		console.error('Error stack:', error instanceof Error ? error.stack : undefined)
		console.error('Full error object:', error)
		
		return c.json(
			{
				status: 'error',
				database: 'failed',
				error: error instanceof Error ? error.message : 'Unknown error',
				stack: error instanceof Error ? error.stack : undefined,
				timestamp: new Date().toISOString(),
				debug: {
					branch: 'issue-53',
					schemaFixed: true,
				},
			},
			500
		)
	}
})

// APIルートの設定
app.route('/api/categories', categoriesRouter)
app.route('/api/subscriptions', subscriptionsRouter)

export default app
