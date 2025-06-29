import { Hono } from 'hono'
import { createDatabase, type Env } from './db'
import { categories } from './db/schema'
import { renderer } from './renderer'
import categoriesRouter from './routes/categories'

const app = new Hono<{ Bindings: Env }>()

app.use(renderer)

app.get('/', (c) => {
	return c.render(<h1>Saifuu API - 家計管理アプリケーション</h1>)
})

// データベース接続のテスト用エンドポイント
app.get('/api/health', async (c) => {
	try {
		const db = createDatabase(c.env.DB)
		// シンプルなクエリでデータベース接続をテスト
		const _result = await db.select().from(categories).limit(1)
		return c.json({
			status: 'ok',
			database: 'connected',
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

export default app
