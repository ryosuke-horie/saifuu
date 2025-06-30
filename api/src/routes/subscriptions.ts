import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { createDatabase, type Env } from '../db'
import { categories, type NewSubscription, subscriptions } from '../db/schema'

const app = new Hono<{ Bindings: Env }>()

// サブスクリプション一覧取得
app.get('/', async (c) => {
	try {
		const db = createDatabase(c.env.DB)
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
	} catch (_error) {
		return c.json({ error: 'Failed to fetch subscriptions' }, 500)
	}
})

// サブスクリプション作成
app.post('/', async (c) => {
	try {
		const body = (await c.req.json()) as NewSubscription
		const db = createDatabase(c.env.DB)

		const newSubscription: NewSubscription = {
			name: body.name,
			amount: body.amount,
			billingCycle: body.billingCycle,
			nextBillingDate: body.nextBillingDate,
			categoryId: body.categoryId,
			description: body.description,
			isActive: body.isActive,
			createdAt: new Date(),
			updatedAt: new Date(),
		}

		const result = await db.insert(subscriptions).values(newSubscription).returning()
		return c.json(result[0], 201)
	} catch (_error) {
		return c.json({ error: 'Failed to create subscription' }, 500)
	}
})

// サブスクリプション詳細取得
app.get('/:id', async (c) => {
	try {
		const id = Number.parseInt(c.req.param('id'))
		const db = createDatabase(c.env.DB)

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
	} catch (_error) {
		return c.json({ error: 'Failed to fetch subscription' }, 500)
	}
})

// サブスクリプション更新
app.put('/:id', async (c) => {
	try {
		const id = Number.parseInt(c.req.param('id'))
		const body = (await c.req.json()) as Partial<NewSubscription>
		const db = createDatabase(c.env.DB)

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
	} catch (_error) {
		return c.json({ error: 'Failed to update subscription' }, 500)
	}
})

// サブスクリプション削除
app.delete('/:id', async (c) => {
	try {
		const id = Number.parseInt(c.req.param('id'))
		const db = createDatabase(c.env.DB)

		const result = await db.delete(subscriptions).where(eq(subscriptions.id, id)).returning()

		if (result.length === 0) {
			return c.json({ error: 'Subscription not found' }, 404)
		}

		return c.json({ message: 'Subscription deleted successfully' })
	} catch (_error) {
		return c.json({ error: 'Failed to delete subscription' }, 500)
	}
})

export default app
