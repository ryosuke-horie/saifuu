import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import type { AnyDatabase, Env } from '../db'
import { categories, type NewCategory } from '../db/schema'
import { type LoggingVariables, logWithContext } from '../middleware/logging'

const app = new Hono<{
	Bindings: Env
	Variables: {
		db: AnyDatabase
	} & LoggingVariables
}>()

// カテゴリ一覧取得
app.get('/', async (c) => {
	// 構造化ログ: カテゴリ一覧取得操作の開始
	logWithContext(c, 'info', 'カテゴリ一覧取得を開始', {
		operationType: 'read',
		resource: 'categories',
	})

	try {
		const db = c.get('db')
		const result = await db.select().from(categories)

		// 構造化ログ: 取得成功時のログ
		logWithContext(c, 'info', 'カテゴリ一覧取得が完了', {
			categoriesCount: result.length,
			resource: 'categories',
		})

		return c.json(result)
	} catch (error) {
		// 構造化ログ: エラー時の詳細ログ（リクエストIDと例外情報を含む）
		logWithContext(c, 'error', 'カテゴリ一覧取得でエラーが発生', {
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
			resource: 'categories',
			operationType: 'read',
		})

		return c.json({ error: 'Failed to fetch categories' }, 500)
	}
})

// カテゴリ作成
app.post('/', async (c) => {
	try {
		const body = (await c.req.json()) as NewCategory

		// 構造化ログ: カテゴリ作成操作の開始（バリデーション前）
		logWithContext(c, 'info', 'カテゴリ作成を開始', {
			operationType: 'write',
			resource: 'categories',
			requestData: {
				name: body.name,
				type: body.type,
				color: body.color,
			},
		})

		// バリデーション: 必須フィールドの確認
		if (!body.name || typeof body.name !== 'string') {
			logWithContext(c, 'warn', 'カテゴリ作成: バリデーションエラー - 名前が無効', {
				validationError: 'name_required',
				providedName: body.name,
			})
			return c.json({ error: 'Name is required and must be a string' }, 400)
		}

		if (!body.type || !['expense', 'income'].includes(body.type)) {
			logWithContext(c, 'warn', 'カテゴリ作成: バリデーションエラー - タイプが無効', {
				validationError: 'type_invalid',
				providedType: body.type,
			})
			return c.json({ error: 'Type must be either expense or income' }, 400)
		}

		const db = c.get('db')

		const newCategory: NewCategory = {
			name: body.name,
			type: body.type,
			color: body.color,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		}

		const result = await db.insert(categories).values(newCategory).returning()

		// 構造化ログ: カテゴリ作成成功時のログ
		logWithContext(c, 'info', 'カテゴリ作成が完了', {
			categoryId: result[0].id,
			categoryName: result[0].name,
			categoryType: result[0].type,
			resource: 'categories',
			operationType: 'write',
		})

		return c.json(result[0], 201)
	} catch (error) {
		// 構造化ログ: データベースエラー時の詳細ログ
		logWithContext(c, 'error', 'カテゴリ作成でエラーが発生', {
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
			resource: 'categories',
			operationType: 'write',
			databaseOperation: 'insert',
		})

		return c.json({ error: 'Failed to create category' }, 500)
	}
})

// カテゴリ更新
app.put('/:id', async (c) => {
	try {
		const idParam = c.req.param('id')
		const id = Number.parseInt(idParam)

		// IDバリデーション
		if (Number.isNaN(id)) {
			logWithContext(c, 'warn', 'カテゴリ更新: バリデーションエラー - ID形式が無効', {
				validationError: 'id_format_invalid',
				providedId: idParam,
			})
			return c.json({ error: 'Invalid ID format' }, 400)
		}

		const body = (await c.req.json()) as Partial<NewCategory>

		// 構造化ログ: カテゴリ更新操作の開始
		logWithContext(c, 'info', 'カテゴリ更新を開始', {
			categoryId: id,
			operationType: 'write',
			resource: 'categories',
			updateFields: Object.keys(body),
		})

		const db = c.get('db')

		const updateData = {
			...body,
			updatedAt: new Date().toISOString(),
		}

		const result = await db
			.update(categories)
			.set(updateData)
			.where(eq(categories.id, id))
			.returning()

		if (result.length === 0) {
			// 構造化ログ: カテゴリが見つからない場合
			logWithContext(c, 'warn', 'カテゴリ更新: 対象カテゴリが見つからない', {
				categoryId: id,
				resource: 'categories',
			})
			return c.json({ error: 'Category not found' }, 404)
		}

		// 構造化ログ: カテゴリ更新成功時のログ
		logWithContext(c, 'info', 'カテゴリ更新が完了', {
			categoryId: id,
			categoryName: result[0].name,
			resource: 'categories',
			operationType: 'write',
		})

		return c.json(result[0])
	} catch (error) {
		// 構造化ログ: カテゴリ更新エラー時の詳細ログ
		logWithContext(c, 'error', 'カテゴリ更新でエラーが発生', {
			categoryId: c.req.param('id'),
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
			resource: 'categories',
			operationType: 'write',
			databaseOperation: 'update',
		})

		return c.json({ error: 'Failed to update category' }, 500)
	}
})

// カテゴリ削除
app.delete('/:id', async (c) => {
	try {
		const idParam = c.req.param('id')
		const id = Number.parseInt(idParam)

		// IDバリデーション
		if (Number.isNaN(id)) {
			logWithContext(c, 'warn', 'カテゴリ削除: バリデーションエラー - ID形式が無効', {
				validationError: 'id_format_invalid',
				providedId: idParam,
			})
			return c.json({ error: 'Invalid ID format' }, 400)
		}

		// 構造化ログ: カテゴリ削除操作の開始
		logWithContext(c, 'info', 'カテゴリ削除を開始', {
			categoryId: id,
			operationType: 'delete',
			resource: 'categories',
		})

		const db = c.get('db')

		const result = await db.delete(categories).where(eq(categories.id, id)).returning()

		if (result.length === 0) {
			// 構造化ログ: 削除対象カテゴリが見つからない場合
			logWithContext(c, 'warn', 'カテゴリ削除: 対象カテゴリが見つからない', {
				categoryId: id,
				resource: 'categories',
			})
			return c.json({ error: 'Category not found' }, 404)
		}

		// 構造化ログ: カテゴリ削除成功時のログ
		logWithContext(c, 'info', 'カテゴリ削除が完了', {
			categoryId: id,
			deletedCategoryName: result[0].name,
			resource: 'categories',
			operationType: 'delete',
		})

		return c.json({ message: 'Category deleted successfully' })
	} catch (error) {
		// 構造化ログ: カテゴリ削除エラー時の詳細ログ
		logWithContext(c, 'error', 'カテゴリ削除でエラーが発生', {
			categoryId: c.req.param('id'),
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
			resource: 'categories',
			operationType: 'delete',
			databaseOperation: 'delete',
		})

		return c.json({ error: 'Failed to delete category' }, 500)
	}
})

export default app
