import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { type AnyDatabase, createDatabase, type Env } from './db'
import { categories } from './db/schema'
import { type LoggingVariables, loggingMiddleware, logWithContext } from './middleware/logging'
import { renderer } from './renderer'
import categoriesRouter from './routes/categories'
import subscriptionsRouter from './routes/subscriptions'

const app = new Hono<{
	Bindings: Env
	Variables: LoggingVariables & {
		db: AnyDatabase
	}
}>()

// CORS設定（開発環境・本番環境対応）
app.use(
	'/api/*',
	cors({
		origin: [
			'http://localhost:3000',
			'http://localhost:3002',
			'http://localhost:3003',
			'https://saifuu.ryosuke-horie37.workers.dev',
		],
		allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowHeaders: ['Content-Type', 'Authorization'],
	})
)

// 開発環境判定
const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV

// ロギングミドルウェアの設定（CORSの後、他のミドルウェアの前に適用）
app.use('/api/*', loggingMiddleware(process.env as Record<string, string>))

// ミドルウェア: データベース接続を設定
app.use('/api/*', async (c, next) => {
	try {
		// 構造化ログでデータベースミドルウェアの開始をログ記録
		logWithContext(c, 'debug', 'Database middleware start', {
			environment: isDev ? 'development' : 'production',
			path: c.req.path,
		})

		// 開発環境・本番環境の両方でCloudflare D1を使用
		// wrangler dev では c.env.DB がローカルD1インスタンスを提供
		const db = createDatabase(c.env.DB)
		logWithContext(c, 'debug', 'D1 database created successfully')
		c.set('db', db)
		logWithContext(c, 'debug', 'Database set in context')

		logWithContext(c, 'debug', 'Database middleware completed, calling next()')
		await next()
		logWithContext(c, 'debug', 'Next() completed successfully')
	} catch (error) {
		// 構造化ログでエラーを記録
		logWithContext(c, 'error', 'Database middleware error', {
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
			errorType: typeof error,
		})

		return c.json(
			{
				error: 'Database initialization failed',
				details: error instanceof Error ? error.message : String(error),
			},
			500
		)
	}
})

app.use(renderer)

app.get('/', (c) => {
	return c.render(<h1>Saifuu API - 家計管理アプリケーション</h1>)
})

// データベース接続のテスト用エンドポイント
app.get('/api/health', async (c) => {
	try {
		// 構造化ログでヘルスチェック開始をログ記録
		logWithContext(c, 'info', 'Health check start')
		const db = c.get('db')
		logWithContext(c, 'debug', 'Health check: database instance retrieved', {
			databaseType: typeof db,
		})

		if (!db) {
			throw new Error('Database instance is null or undefined')
		}

		logWithContext(c, 'debug', 'Health check: attempting database query')
		// シンプルなクエリでデータベース接続をテスト
		const result = await db.select().from(categories).limit(1)
		logWithContext(c, 'info', 'Health check: query successful', {
			categoriesCount: result.length,
		})

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
		// 構造化ログでエラーを記録
		logWithContext(c, 'error', 'Health check error', {
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
			errorType: typeof error,
			fullError: error,
		})

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
