import { eq } from 'drizzle-orm'
import { Hono, type Context } from 'hono'
import { createDatabase, type AnyDatabase, type Database, type Env } from '../db'
import { categories, type NewSubscription, subscriptions } from '../db/schema'

/**
 * サブスクリプションAPIのファクトリ関数
 * テスト時にはテスト用データベースを注入可能にする
 * @param options.testDatabase - テスト用データベースインスタンス（オプション）
 */
export function createSubscriptionsApp(options: { testDatabase?: Database } = {}) {
	const app = new Hono<{ 
		Bindings: Env
		Variables: {
			db: AnyDatabase
		}
	}>()

	// データベース取得のヘルパー関数
	const getDatabase = (c: Context<{ 
		Bindings: Env
		Variables: { db: AnyDatabase }
	}>) => {
		return options.testDatabase || c.get('db')
	}

	// サブスクリプション一覧取得
	app.get('/', async (c) => {
		try {
			const db = getDatabase(c)
			const result = await db
				.select({
					id: subscriptions.id,
					name: subscriptions.name,
					amount: subscriptions.amount,
					billingCycle: subscriptions.billingCycle,
					nextBillingDate: subscriptions.nextBillingDate,
					description: subscriptions.description,
					isActive: subscriptions.isActive,
					categoryId: subscriptions.categoryId,
					createdAt: subscriptions.createdAt,
					updatedAt: subscriptions.updatedAt,
					category: {
						id: categories.id,
						name: categories.name,
						type: categories.type,
						color: categories.color,
						createdAt: categories.createdAt,
						updatedAt: categories.updatedAt,
					},
				})
				.from(subscriptions)
				.leftJoin(categories, eq(subscriptions.categoryId, categories.id))
			return c.json(result)
		} catch (error) {
			console.error('Error in GET /subscriptions:', error)
			return c.json({ error: 'Failed to fetch subscriptions' }, 500)
		}
	})

	// サブスクリプション作成
	app.post('/', async (c) => {
		try {
			const body = (await c.req.json()) as NewSubscription
			const db = getDatabase(c)

			// Validate required fields and data
			if (!body.name || typeof body.name !== 'string') {
				return c.json({ error: 'Name is required and must be a string' }, 400)
			}

			if (typeof body.amount !== 'number' || body.amount < 0) {
				return c.json({ error: 'Amount must be a positive number' }, 400)
			}

			if (!body.billingCycle || !['monthly', 'yearly', 'weekly'].includes(body.billingCycle)) {
				return c.json({ error: 'Invalid billing cycle' }, 400)
			}

			// Convert string dates to Date objects if needed
			const nextBillingDate =
				typeof body.nextBillingDate === 'string'
					? new Date(body.nextBillingDate)
					: body.nextBillingDate || new Date()

			const newSubscription: NewSubscription = {
				name: body.name,
				amount: body.amount,
				billingCycle: body.billingCycle,
				nextBillingDate: nextBillingDate,
				categoryId: body.categoryId,
				description: body.description,
				isActive: body.isActive,
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			const result = await db.insert(subscriptions).values(newSubscription).returning()
			return c.json(result[0], 201)
		} catch (error) {
			console.error('Error in POST /subscriptions:', error)
			return c.json({ error: 'Failed to create subscription' }, 500)
		}
	})

	// サブスクリプション詳細取得
	app.get('/:id', async (c) => {
		try {
			const idParam = c.req.param('id')
			const id = Number.parseInt(idParam)

			// Check if ID is valid
			if (Number.isNaN(id)) {
				return c.json({ error: 'Invalid ID format' }, 400)
			}

			const db = getDatabase(c)

			const result = await db
				.select({
					id: subscriptions.id,
					name: subscriptions.name,
					amount: subscriptions.amount,
					billingCycle: subscriptions.billingCycle,
					nextBillingDate: subscriptions.nextBillingDate,
					description: subscriptions.description,
					isActive: subscriptions.isActive,
					categoryId: subscriptions.categoryId,
					createdAt: subscriptions.createdAt,
					updatedAt: subscriptions.updatedAt,
					category: {
						id: categories.id,
						name: categories.name,
						type: categories.type,
						color: categories.color,
						createdAt: categories.createdAt,
						updatedAt: categories.updatedAt,
					},
				})
				.from(subscriptions)
				.leftJoin(categories, eq(subscriptions.categoryId, categories.id))
				.where(eq(subscriptions.id, id))

			if (result.length === 0) {
				return c.json({ error: 'Subscription not found' }, 404)
			}

			return c.json(result[0])
		} catch (error) {
			console.error('Error in GET /subscriptions/:id:', error)
			return c.json({ error: 'Failed to fetch subscription' }, 500)
		}
	})

	// サブスクリプション更新
	app.put('/:id', async (c) => {
		try {
			const idParam = c.req.param('id')
			const id = Number.parseInt(idParam)

			// Check if ID is valid
			if (Number.isNaN(id)) {
				return c.json({ error: 'Invalid ID format' }, 400)
			}

			const body = (await c.req.json()) as Partial<NewSubscription>
			const db = getDatabase(c)

			const updateData = {
				...body,
				updatedAt: new Date(),
			}

			const result = await db
				.update(subscriptions)
				.set(updateData)
				.where(eq(subscriptions.id, id))
				.returning()

			if (result.length === 0) {
				return c.json({ error: 'Subscription not found' }, 404)
			}

			return c.json(result[0])
		} catch (error) {
			console.error('Error in PUT /subscriptions/:id:', error)
			return c.json({ error: 'Failed to update subscription' }, 500)
		}
	})

	// サブスクリプション削除
	app.delete('/:id', async (c) => {
		try {
			const idParam = c.req.param('id')
			const id = Number.parseInt(idParam)

			// Check if ID is valid
			if (Number.isNaN(id)) {
				return c.json({ error: 'Invalid ID format' }, 400)
			}

			const db = getDatabase(c)

			const result = await db.delete(subscriptions).where(eq(subscriptions.id, id)).returning()

			if (result.length === 0) {
				return c.json({ error: 'Subscription not found' }, 404)
			}

			return c.json({ message: 'Subscription deleted successfully' })
		} catch (error) {
			console.error('Error in DELETE /subscriptions/:id:', error)
			return c.json({ error: 'Failed to delete subscription' }, 500)
		}
	})

	return app
}

// デフォルトエクスポート（本番環境用）
const app = createSubscriptionsApp()
export default app
