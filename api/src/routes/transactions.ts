import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { ALL_CATEGORIES } from '../../../shared/config/categories'
import { type AnyDatabase, type Env } from '../db'
import { type NewTransaction, transactions } from '../db/schema'
import { type LoggingVariables, logWithContext } from '../middleware/logging'

/**
 * 取引APIのファクトリ関数
 * テスト時にはテスト用データベースを注入可能にする
 * @param options.testDatabase - テスト用データベースインスタンス（オプション）
 */
export function createTransactionsApp(options: { testDatabase?: AnyDatabase } = {}) {
	const app = new Hono<{
		Bindings: Env
		Variables: {
			db: AnyDatabase
		} & LoggingVariables
	}>()

	// 取引一覧取得
	app.get('/', async (c) => {
		// 構造化ログ: 取引一覧取得操作の開始
		logWithContext(c, 'info', '取引一覧取得を開始', {
			operationType: 'read',
			resource: 'transactions',
		})

		try {
			const db = options.testDatabase || c.get('db')
			const result = await db.select().from(transactions)

			// カテゴリ情報を設定ファイルから補完
			const resultWithCategories = result.map((tx) => {
				const category = ALL_CATEGORIES.find((cat) => cat.numericId === tx.categoryId)
				return {
					...tx,
					category: category
						? {
								id: category.numericId,
								name: category.name,
								type: category.type,
								color: category.color,
								createdAt: new Date().toISOString(),
								updatedAt: new Date().toISOString(),
							}
						: null,
				}
			})

			// 構造化ログ: 取得成功時のログ
			logWithContext(c, 'info', '取引一覧取得が完了', {
				transactionsCount: resultWithCategories.length,
				resource: 'transactions',
			})

			return c.json(resultWithCategories)
		} catch (error) {
			// 構造化ログ: エラー時の詳細ログ（リクエストIDと例外情報を含む）
			logWithContext(c, 'error', '取引一覧取得でエラーが発生', {
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
				resource: 'transactions',
				operationType: 'read',
				databaseOperation: 'select_with_join',
			})

			return c.json({ error: 'Failed to fetch transactions' }, 500)
		}
	})

	// 取引統計取得 - 動的ルート（/:id）より前に定義
	app.get('/stats', async (c) => {
		try {
			// 構造化ログ: 取引統計取得操作の開始
			logWithContext(c, 'info', '取引統計取得を開始', {
				operationType: 'read',
				resource: 'transactions',
			})

			const db = options.testDatabase || c.get('db')

			// 基本統計の取得
			const allTransactions = await db
				.select({
					amount: transactions.amount,
					type: transactions.type,
				})
				.from(transactions)

			const totalIncome = allTransactions
				.filter((t) => t.type === 'income')
				.reduce((sum, t) => sum + t.amount, 0)

			const totalExpense = allTransactions
				.filter((t) => t.type === 'expense')
				.reduce((sum, t) => sum + t.amount, 0)

			const balance = totalIncome - totalExpense
			const transactionCount = allTransactions.length

			const stats = {
				totalIncome,
				totalExpense,
				balance,
				transactionCount,
			}

			// 構造化ログ: 取引統計取得成功時のログ
			logWithContext(c, 'info', '取引統計取得が完了', {
				...stats,
				resource: 'transactions',
			})

			return c.json(stats)
		} catch (error) {
			// 構造化ログ: 取引統計取得エラー時の詳細ログ
			logWithContext(c, 'error', '取引統計取得でエラーが発生', {
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
				resource: 'transactions',
				operationType: 'read',
				databaseOperation: 'select_with_aggregation',
			})

			return c.json({ error: 'Failed to fetch transaction statistics' }, 500)
		}
	})

	// 取引作成
	app.post('/', async (c) => {
		try {
			const body = (await c.req.json()) as NewTransaction

			// 構造化ログ: 取引作成操作の開始（バリデーション前）
			logWithContext(c, 'info', '取引作成を開始', {
				operationType: 'write',
				resource: 'transactions',
				requestData: {
					amount: body.amount,
					type: body.type,
					categoryId: body.categoryId,
					description: body.description,
				},
			})

			const db = options.testDatabase || c.get('db')

			// Validate required fields and data
			if (typeof body.amount !== 'number' || body.amount <= 0) {
				logWithContext(c, 'warn', '取引作成: バリデーションエラー - 金額が無効', {
					validationError: 'amount_invalid',
					providedAmount: body.amount,
				})
				return c.json({ error: 'Amount must be a positive number' }, 400)
			}

			if (!body.type || !['income', 'expense'].includes(body.type)) {
				logWithContext(c, 'warn', '取引作成: バリデーションエラー - 種別が無効', {
					validationError: 'type_invalid',
					providedType: body.type,
				})
				return c.json({ error: 'Type must be either "income" or "expense"' }, 400)
			}

			if (!body.date) {
				logWithContext(c, 'warn', '取引作成: バリデーションエラー - 日付が無効', {
					validationError: 'date_required',
					providedDate: body.date,
				})
				return c.json({ error: 'Date is required' }, 400)
			}

			const newTransaction: NewTransaction = {
				amount: body.amount,
				type: body.type,
				categoryId: body.categoryId,
				description: body.description,
				date: body.date,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			}

			const result = await db.insert(transactions).values(newTransaction).returning()

			// 構造化ログ: 取引作成成功時のログ
			logWithContext(c, 'info', '取引作成が完了', {
				transactionId: result[0].id,
				amount: result[0].amount,
				type: result[0].type,
				categoryId: result[0].categoryId,
				resource: 'transactions',
				operationType: 'write',
			})

			return c.json(result[0], 201)
		} catch (error) {
			// 構造化ログ: データベースエラー時の詳細ログ
			logWithContext(c, 'error', '取引作成でエラーが発生', {
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
				resource: 'transactions',
				operationType: 'write',
				databaseOperation: 'insert',
			})

			return c.json({ error: 'Failed to create transaction' }, 500)
		}
	})

	// 取引詳細取得
	app.get('/:id', async (c) => {
		try {
			const idParam = c.req.param('id')
			const id = Number.parseInt(idParam)

			// Check if ID is valid
			if (Number.isNaN(id)) {
				logWithContext(c, 'warn', '取引詳細取得: バリデーションエラー - ID形式が無効', {
					validationError: 'id_format_invalid',
					providedId: idParam,
				})
				return c.json({ error: 'Invalid ID format' }, 400)
			}

			// 構造化ログ: 取引詳細取得操作の開始
			logWithContext(c, 'info', '取引詳細取得を開始', {
				transactionId: id,
				operationType: 'read',
				resource: 'transactions',
			})

			const db = options.testDatabase || c.get('db')

			const result = await db.select().from(transactions).where(eq(transactions.id, id))

			// カテゴリ情報を設定ファイルから補完
			const resultWithCategories = result.map((tx) => {
				const category = ALL_CATEGORIES.find((cat) => cat.numericId === tx.categoryId)
				return {
					...tx,
					category: category
						? {
								id: category.numericId,
								name: category.name,
								type: category.type,
								color: category.color,
								createdAt: new Date().toISOString(),
								updatedAt: new Date().toISOString(),
							}
						: null,
				}
			})

			if (result.length === 0) {
				// 構造化ログ: 取引が見つからない場合
				logWithContext(c, 'warn', '取引詳細取得: 対象取引が見つからない', {
					transactionId: id,
					resource: 'transactions',
				})
				return c.json({ error: 'Transaction not found' }, 404)
			}

			// 構造化ログ: 取引詳細取得成功時のログ
			logWithContext(c, 'info', '取引詳細取得が完了', {
				transactionId: id,
				amount: resultWithCategories[0].amount,
				resource: 'transactions',
			})

			return c.json(resultWithCategories[0])
		} catch (error) {
			// 構造化ログ: 取引詳細取得エラー時の詳細ログ
			logWithContext(c, 'error', '取引詳細取得でエラーが発生', {
				transactionId: c.req.param('id'),
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
				resource: 'transactions',
				operationType: 'read',
				databaseOperation: 'select_with_join',
			})

			return c.json({ error: 'Failed to fetch transaction' }, 500)
		}
	})

	// 取引更新
	app.put('/:id', async (c) => {
		try {
			const idParam = c.req.param('id')
			const id = Number.parseInt(idParam)

			// Check if ID is valid
			if (Number.isNaN(id)) {
				logWithContext(c, 'warn', '取引更新: バリデーションエラー - ID形式が無効', {
					validationError: 'id_format_invalid',
					providedId: idParam,
				})
				return c.json({ error: 'Invalid ID format' }, 400)
			}

			const body = (await c.req.json()) as Partial<NewTransaction>

			// 構造化ログ: 取引更新操作の開始
			logWithContext(c, 'info', '取引更新を開始', {
				transactionId: id,
				operationType: 'write',
				resource: 'transactions',
				updateFields: Object.keys(body),
			})

			const db = options.testDatabase || c.get('db')

			const updateData = {
				...body,
				updatedAt: new Date().toISOString(),
			}

			const result = await db
				.update(transactions)
				.set(updateData)
				.where(eq(transactions.id, id))
				.returning()

			if (result.length === 0) {
				// 構造化ログ: 取引が見つからない場合
				logWithContext(c, 'warn', '取引更新: 対象取引が見つからない', {
					transactionId: id,
					resource: 'transactions',
				})
				return c.json({ error: 'Transaction not found' }, 404)
			}

			// 構造化ログ: 取引更新成功時のログ
			logWithContext(c, 'info', '取引更新が完了', {
				transactionId: id,
				amount: result[0].amount,
				resource: 'transactions',
				operationType: 'write',
			})

			return c.json(result[0])
		} catch (error) {
			// 構造化ログ: 取引更新エラー時の詳細ログ
			logWithContext(c, 'error', '取引更新でエラーが発生', {
				transactionId: c.req.param('id'),
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
				resource: 'transactions',
				operationType: 'write',
				databaseOperation: 'update',
			})

			return c.json({ error: 'Failed to update transaction' }, 500)
		}
	})

	// 取引削除
	app.delete('/:id', async (c) => {
		try {
			const idParam = c.req.param('id')
			const id = Number.parseInt(idParam)

			// Check if ID is valid
			if (Number.isNaN(id)) {
				logWithContext(c, 'warn', '取引削除: バリデーションエラー - ID形式が無効', {
					validationError: 'id_format_invalid',
					providedId: idParam,
				})
				return c.json({ error: 'Invalid ID format' }, 400)
			}

			// 構造化ログ: 取引削除操作の開始
			logWithContext(c, 'info', '取引削除を開始', {
				transactionId: id,
				operationType: 'delete',
				resource: 'transactions',
			})

			const db = options.testDatabase || c.get('db')

			const result = await db.delete(transactions).where(eq(transactions.id, id)).returning()

			if (result.length === 0) {
				// 構造化ログ: 削除対象取引が見つからない場合
				logWithContext(c, 'warn', '取引削除: 対象取引が見つからない', {
					transactionId: id,
					resource: 'transactions',
				})
				return c.json({ error: 'Transaction not found' }, 404)
			}

			// 構造化ログ: 取引削除成功時のログ
			logWithContext(c, 'info', '取引削除が完了', {
				transactionId: id,
				deletedAmount: result[0].amount,
				resource: 'transactions',
				operationType: 'delete',
			})

			return c.json({ message: 'Transaction deleted successfully' })
		} catch (error) {
			// 構造化ログ: 取引削除エラー時の詳細ログ
			logWithContext(c, 'error', '取引削除でエラーが発生', {
				transactionId: c.req.param('id'),
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
				resource: 'transactions',
				operationType: 'delete',
				databaseOperation: 'delete',
			})

			return c.json({ error: 'Failed to delete transaction' }, 500)
		}
	})

	return app
}

// デフォルトエクスポート（本番環境用）
const app = createTransactionsApp()
export default app
