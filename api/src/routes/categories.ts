import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import type { AnyDatabase, Env } from '../db'
import { categories, type NewCategory } from '../db/schema'

const app = new Hono<{
	Bindings: Env
	Variables: {
		db: AnyDatabase
	}
}>()

// カテゴリ一覧取得
app.get('/', async (c) => {
	try {
		const db = c.get('db')
		const result = await db.select().from(categories)
		return c.json(result)
	} catch (_error) {
		return c.json({ error: 'Failed to fetch categories' }, 500)
	}
})

// カテゴリ作成
app.post('/', async (c) => {
	try {
		const body = (await c.req.json()) as NewCategory
		const db = c.get('db')

		const newCategory: NewCategory = {
			name: body.name,
			type: body.type,
			color: body.color,
			createdAt: new Date(),
			updatedAt: new Date(),
		}

		const result = await db.insert(categories).values(newCategory).returning()
		return c.json(result[0], 201)
	} catch (_error) {
		return c.json({ error: 'Failed to create category' }, 500)
	}
})

// カテゴリ更新
app.put('/:id', async (c) => {
	try {
		const id = Number.parseInt(c.req.param('id'))
		const body = (await c.req.json()) as Partial<NewCategory>
		const db = c.get('db')

		const updateData = {
			...body,
			updatedAt: new Date(),
		}

		const result = await db
			.update(categories)
			.set(updateData)
			.where(eq(categories.id, id))
			.returning()

		if (result.length === 0) {
			return c.json({ error: 'Category not found' }, 404)
		}

		return c.json(result[0])
	} catch (_error) {
		return c.json({ error: 'Failed to update category' }, 500)
	}
})

// カテゴリ削除
app.delete('/:id', async (c) => {
	try {
		const id = Number.parseInt(c.req.param('id'))
		const db = c.get('db')

		const result = await db.delete(categories).where(eq(categories.id, id)).returning()

		if (result.length === 0) {
			return c.json({ error: 'Category not found' }, 404)
		}

		return c.json({ message: 'Category deleted successfully' })
	} catch (_error) {
		return c.json({ error: 'Failed to delete category' }, 500)
	}
})

export default app
