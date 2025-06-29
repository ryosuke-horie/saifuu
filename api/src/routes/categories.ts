import { Hono } from 'hono'
import { createDatabase, type Env } from '../db'
import { categories, type NewCategory } from '../db/schema'
import { eq } from 'drizzle-orm'

const app = new Hono<{ Bindings: Env }>()

// カテゴリ一覧取得
app.get('/', async (c) => {
  try {
    const db = createDatabase(c.env.DB)
    const result = await db.select().from(categories)
    return c.json(result)
  } catch (error) {
    return c.json({ error: 'Failed to fetch categories' }, 500)
  }
})

// カテゴリ作成
app.post('/', async (c) => {
  try {
    const body = await c.req.json() as NewCategory
    const db = createDatabase(c.env.DB)
    
    const newCategory: NewCategory = {
      name: body.name,
      type: body.type,
      color: body.color,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    const result = await db.insert(categories).values(newCategory).returning()
    return c.json(result[0], 201)
  } catch (error) {
    return c.json({ error: 'Failed to create category' }, 500)
  }
})

// カテゴリ更新
app.put('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const body = await c.req.json() as Partial<NewCategory>
    const db = createDatabase(c.env.DB)
    
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
  } catch (error) {
    return c.json({ error: 'Failed to update category' }, 500)
  }
})

// カテゴリ削除
app.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const db = createDatabase(c.env.DB)
    
    const result = await db
      .delete(categories)
      .where(eq(categories.id, id))
      .returning()
    
    if (result.length === 0) {
      return c.json({ error: 'Category not found' }, 404)
    }
    
    return c.json({ message: 'Category deleted successfully' })
  } catch (error) {
    return c.json({ error: 'Failed to delete category' }, 500)
  }
})

export default app