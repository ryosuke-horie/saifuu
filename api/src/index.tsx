import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { type AnyDatabase, createDatabase, type Env } from './db'
import { transactions } from './db/schema'
import { type LoggingVariables, loggingMiddleware, logWithContext } from './middleware/logging'
import { renderer } from './renderer'
import balanceRouter from './routes/balance'
import categoriesRouter from './routes/categories'
import subscriptionsRouter from './routes/subscriptions'
import transactionsRouter from './routes/transactions'

const app = new Hono<{
	Bindings: Env
	Variables: LoggingVariables & {
		db: AnyDatabase
	}
}>()

// CORS設定（開発環境は3000番ポートのみ、本番環境は指定ドメインのみ）
app.use(
	'/api/*',
	cors({
		origin: [
			'http://localhost:3000', // 開発環境は3000番ポートのみ
			'https://saifuu.ryosuke-horie37.workers.dev',
			'https://saifuu.pages.dev',
		],
		allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
	})
)

// 開発環境判定（Cloudflare Workers対応）
// 本番環境では import.meta.env が存在しないため、安全にチェック
const isDev = (() => {
	try {
		return import.meta.env?.DEV === true || import.meta.env?.NODE_ENV === 'development' || false
	} catch {
		return false
	}
})()

// ロギングミドルウェアの設定（CORSの後、他のミドルウェアの前に適用）
// 環境変数は動的に取得するため、リクエスト時に初期化
app.use('/api/*', async (c, next) => {
	// 環境変数の取得（開発環境では import.meta.env、本番環境では c.env を使用）
	const env = isDev
		? (import.meta.env as unknown as Record<string, string>)
		: (c.env as unknown as Record<string, string>)

	// ロギングミドルウェアを動的に作成して実行
	const middleware = loggingMiddleware(env)
	return middleware(c as unknown as Parameters<typeof middleware>[0], next)
})

// 開発環境用のデータベースインスタンスを一度だけ作成（遅延初期化）
let devDb: AnyDatabase | null = null

// ミドルウェア: データベース接続を設定
app.use('/api/*', async (c, next) => {
	try {
		// 構造化ログでデータベースミドルウェアの開始をログ記録
		logWithContext(c, 'debug', 'Database middleware start', {
			environment: isDev ? 'development' : 'production',
			path: c.req.path,
		})

		let db: AnyDatabase

		if (isDev) {
			// 開発環境ではローカルSQLiteを使用（初回のみ作成）
			if (!devDb) {
				try {
					const { createDevSqliteDatabase } = await import('./db/dev')
					devDb = createDevSqliteDatabase() as unknown as AnyDatabase
					logWithContext(c, 'debug', 'Dev SQLite database created successfully')
				} catch (error) {
					console.error('Failed to create dev database:', error)
					throw new Error('Failed to initialize development database')
				}
			}
			db = devDb
			logWithContext(c, 'debug', 'Local SQLite database used (development)')
		} else {
			// 本番環境ではCloudflare D1を使用
			db = createDatabase(c.env.DB)
			logWithContext(c, 'debug', 'D1 database created successfully (production)')
		}

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
		const result = await db.select().from(transactions).limit(1)
		logWithContext(c, 'info', 'Health check: query successful', {
			transactionsCount: result.length,
		})

		return c.json({
			status: 'ok',
			database: 'connected',
			environment: isDev ? 'development' : 'production',
			timestamp: new Date().toISOString(),
			debug: {
				categoriesCount: result.length,
				branch: 'fix/issue-364',
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
					branch: 'fix/issue-364',
					schemaFixed: true,
				},
			},
			500
		)
	}
})

// APIルートの設定
app.route('/api/balance', balanceRouter)
app.route('/api/categories', categoriesRouter)
app.route('/api/subscriptions', subscriptionsRouter)
app.route('/api/transactions', transactionsRouter)

export default app
