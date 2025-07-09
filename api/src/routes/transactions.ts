import { eq, and, gte, lte, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { type AnyDatabase, type Env } from '../db'
import { categories, transactions, type NewTransaction } from '../db/schema'
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

	// 取引統計取得（/:id より前に配置）
	app.get('/stats', async (c) => {
		// 構造化ログ: 取引統計取得操作の開始
		logWithContext(c, 'info', '取引統計取得を開始', {
			operationType: 'read',
			resource: 'transactions',
			endpoint: 'stats',
		})

		try {
			const db = options.testDatabase || c.get('db')
			const queryParams = c.req.query()
			
			// 日付範囲フィルターの処理
			const dateFrom = queryParams.dateFrom
			const dateTo = queryParams.dateTo

			// 構造化ログ: クエリパラメータを記録
			logWithContext(c, 'info', '取引統計取得: フィルター条件を適用', {
				dateFrom,
				dateTo,
				hasDateFilter: !!(dateFrom || dateTo),
			})

			// 基本クエリ条件の構築
			const baseConditions = []
			if (dateFrom) {
				baseConditions.push(gte(transactions.date, dateFrom))
			}
			if (dateTo) {
				baseConditions.push(lte(transactions.date, dateTo))
			}

			// 基本統計の取得
			const statsQuery = db
				.select({
					totalIncome: sql`SUM(CASE WHEN ${transactions.type} = 'income' THEN ${transactions.amount} ELSE 0 END)`,
					totalExpense: sql`SUM(CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amount} ELSE 0 END)`,
					transactionCount: sql`COUNT(*)`,
					avgAmount: sql`AVG(${transactions.amount})`,
				})
				.from(transactions)

			if (baseConditions.length > 0) {
				statsQuery.where(and(...baseConditions))
			}

			const statsResult = await statsQuery

			// カテゴリ別内訳の取得
			const categoryBreakdownQuery = db
				.select({
					categoryId: transactions.categoryId,
					categoryName: categories.name,
					type: transactions.type,
					count: sql`COUNT(*)`,
					totalAmount: sql`SUM(${transactions.amount})`,
				})
				.from(transactions)
				.leftJoin(categories, eq(transactions.categoryId, categories.id))
				.groupBy(transactions.categoryId, categories.name, transactions.type)

			if (baseConditions.length > 0) {
				categoryBreakdownQuery.where(and(...baseConditions))
			}

			const categoryBreakdown = await categoryBreakdownQuery

			// 結果の整形
			const stats = statsResult[0] || {
				totalIncome: 0,
				totalExpense: 0,
				transactionCount: 0,
				avgAmount: 0,
			}

			const response = {
				totalIncome: Number(stats.totalIncome) || 0,
				totalExpense: Number(stats.totalExpense) || 0,
				netAmount: Number(stats.totalIncome) - Number(stats.totalExpense) || 0,
				transactionCount: Number(stats.transactionCount) || 0,
				avgTransaction: Number(stats.avgAmount) || 0,
				categoryBreakdown: categoryBreakdown.map(item => ({
					categoryId: item.categoryId,
					categoryName: item.categoryName || '未分類',
					type: item.type,
					count: Number(item.count),
					totalAmount: Number(item.totalAmount),
				})),
			}

			// 構造化ログ: 取引統計取得成功時のログ
			logWithContext(c, 'info', '取引統計取得が完了', {
				totalIncome: response.totalIncome,
				totalExpense: response.totalExpense,
				transactionCount: response.transactionCount,
				categoryBreakdownCount: response.categoryBreakdown.length,
				resource: 'transactions',
				endpoint: 'stats',
			})

			return c.json(response)
		} catch (error) {
			// 構造化ログ: エラー時の詳細ログ
			logWithContext(c, 'error', '取引統計取得でエラーが発生', {
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
				resource: 'transactions',
				operationType: 'read',
				endpoint: 'stats',
			})

			return c.json({ error: 'Failed to fetch transaction statistics' }, 500)
		}
	})

	// 取引一覧取得
	app.get('/', async (c) => {
		// 構造化ログ: 取引一覧取得操作の開始
		logWithContext(c, 'info', '取引一覧取得を開始', {
			operationType: 'read',
			resource: 'transactions',
		})

		try {
			const db = options.testDatabase || c.get('db')
			const queryParams = c.req.query()
			
			// クエリパラメータの処理
			const type = queryParams.type
			const categoryId = queryParams.categoryId ? Number(queryParams.categoryId) : undefined
			const dateFrom = queryParams.dateFrom
			const dateTo = queryParams.dateTo
			const page = Number(queryParams.page) || 1
			const limit = Number(queryParams.limit) || 50

			// 構造化ログ: クエリパラメータを記録
			logWithContext(c, 'info', '取引一覧取得: フィルター条件を適用', {
				type,
				categoryId,
				dateFrom,
				dateTo,
				page,
				limit,
			})

			// クエリ条件の構築
			const conditions = []
			if (type && (type === 'income' || type === 'expense')) {
				conditions.push(eq(transactions.type, type))
			}
			if (categoryId) {
				conditions.push(eq(transactions.categoryId, categoryId))
			}
			if (dateFrom) {
				conditions.push(gte(transactions.date, dateFrom))
			}
			if (dateTo) {
				conditions.push(lte(transactions.date, dateTo))
			}

			// クエリの実行
			const query = db
				.select({
					id: transactions.id,
					amount: transactions.amount,
					type: transactions.type,
					description: transactions.description,
					date: transactions.date,
					categoryId: transactions.categoryId,
					createdAt: transactions.createdAt,
					updatedAt: transactions.updatedAt,
					category: {
						id: categories.id,
						name: categories.name,
						type: categories.type,
						color: categories.color,
						createdAt: categories.createdAt,
						updatedAt: categories.updatedAt,
					},
				})
				.from(transactions)
				.leftJoin(categories, eq(transactions.categoryId, categories.id))
				.orderBy(transactions.date, transactions.id)
				.limit(limit)
				.offset((page - 1) * limit)

			if (conditions.length > 0) {
				query.where(and(...conditions))
			}

			const result = await query

			// 構造化ログ: 取得成功時のログ
			logWithContext(c, 'info', '取引一覧取得が完了', {
				transactionsCount: result.length,
				page,
				limit,
				resource: 'transactions',
			})

			return c.json(result)
		} catch (error) {
			// 構造化ログ: エラー時の詳細ログ
			logWithContext(c, 'error', '取引一覧取得でエラーが発生', {
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
				resource: 'transactions',
				operationType: 'read',
			})

			return c.json({ error: 'Failed to fetch transactions' }, 500)
		}
	})

	// 取引作成
	app.post('/', async (c) => {
		try {
			const body = (await c.req.json()) as NewTransaction

			// 構造化ログ: 取引作成操作の開始
			logWithContext(c, 'info', '取引作成を開始', {
				operationType: 'write',
				resource: 'transactions',
				requestData: {
					amount: body.amount,
					type: body.type,
					categoryId: body.categoryId,
					date: body.date,
				},
			})

			const db = options.testDatabase || c.get('db')

			// バリデーション: 必須フィールドの確認
			if (typeof body.amount !== 'number' || body.amount < 0) {
				logWithContext(c, 'warn', '取引作成: バリデーションエラー - 金額が無効', {
					validationError: 'amount_invalid',
					providedAmount: body.amount,
				})
				return c.json({ error: 'Amount must be a positive number' }, 400)
			}

			if (!body.type || !['income', 'expense'].includes(body.type)) {
				logWithContext(c, 'warn', '取引作成: バリデーションエラー - タイプが無効', {
					validationError: 'type_invalid',
					providedType: body.type,
				})
				return c.json({ error: 'Type must be either "income" or "expense"' }, 400)
			}

			if (!body.date) {
				logWithContext(c, 'warn', '取引作成: バリデーションエラー - 日付が未設定', {
					validationError: 'date_required',
				})
				return c.json({ error: 'Date is required' }, 400)
			}

			// 日付形式の検証
			const dateRegex = /^\d{4}-\d{2}-\d{2}$/
			if (!dateRegex.test(body.date)) {
				logWithContext(c, 'warn', '取引作成: バリデーションエラー - 日付形式が無効', {
					validationError: 'date_format_invalid',
					providedDate: body.date,
				})
				return c.json({ error: 'Date must be in YYYY-MM-DD format' }, 400)
			}

			// 日付の有効性チェック
			const parsedDate = new Date(body.date)
			if (isNaN(parsedDate.getTime())) {
				logWithContext(c, 'warn', '取引作成: バリデーションエラー - 日付が無効', {
					validationError: 'date_invalid',
					providedDate: body.date,
				})
				return c.json({ error: 'Invalid date' }, 400)
			}

			const newTransaction: NewTransaction = {
				amount: body.amount,
				type: body.type,
				categoryId: body.categoryId || null,
				description: body.description || null,
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
			// 構造化ログ: エラー時の詳細ログ
			logWithContext(c, 'error', '取引作成でエラーが発生', {
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
				resource: 'transactions',
				operationType: 'write',
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

			const result = await db
				.select({
					id: transactions.id,
					amount: transactions.amount,
					type: transactions.type,
					description: transactions.description,
					date: transactions.date,
					categoryId: transactions.categoryId,
					createdAt: transactions.createdAt,
					updatedAt: transactions.updatedAt,
					category: {
						id: categories.id,
						name: categories.name,
						type: categories.type,
						color: categories.color,
						createdAt: categories.createdAt,
						updatedAt: categories.updatedAt,
					},
				})
				.from(transactions)
				.leftJoin(categories, eq(transactions.categoryId, categories.id))
				.where(eq(transactions.id, id))

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
				transactionAmount: result[0].amount,
				transactionType: result[0].type,
				resource: 'transactions',
			})

			return c.json(result[0])
		} catch (error) {
			// 構造化ログ: エラー時の詳細ログ
			logWithContext(c, 'error', '取引詳細取得でエラーが発生', {
				transactionId: c.req.param('id'),
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
				resource: 'transactions',
				operationType: 'read',
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

			// バリデーション: 金額が指定されている場合
			if (body.amount !== undefined && (typeof body.amount !== 'number' || body.amount < 0)) {
				logWithContext(c, 'warn', '取引更新: バリデーションエラー - 金額が無効', {
					validationError: 'amount_invalid',
					providedAmount: body.amount,
				})
				return c.json({ error: 'Amount must be a positive number' }, 400)
			}

			// バリデーション: タイプが指定されている場合
			if (body.type !== undefined && !['income', 'expense'].includes(body.type)) {
				logWithContext(c, 'warn', '取引更新: バリデーションエラー - タイプが無効', {
					validationError: 'type_invalid',
					providedType: body.type,
				})
				return c.json({ error: 'Type must be either "income" or "expense"' }, 400)
			}

			// バリデーション: 日付が指定されている場合
			if (body.date !== undefined) {
				const dateRegex = /^\d{4}-\d{2}-\d{2}$/
				if (!dateRegex.test(body.date)) {
					logWithContext(c, 'warn', '取引更新: バリデーションエラー - 日付形式が無効', {
						validationError: 'date_format_invalid',
						providedDate: body.date,
					})
					return c.json({ error: 'Date must be in YYYY-MM-DD format' }, 400)
				}

				const parsedDate = new Date(body.date)
				if (isNaN(parsedDate.getTime())) {
					logWithContext(c, 'warn', '取引更新: バリデーションエラー - 日付が無効', {
						validationError: 'date_invalid',
						providedDate: body.date,
					})
					return c.json({ error: 'Invalid date' }, 400)
				}
			}

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
				transactionAmount: result[0].amount,
				transactionType: result[0].type,
				resource: 'transactions',
				operationType: 'write',
			})

			return c.json(result[0])
		} catch (error) {
			// 構造化ログ: エラー時の詳細ログ
			logWithContext(c, 'error', '取引更新でエラーが発生', {
				transactionId: c.req.param('id'),
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
				resource: 'transactions',
				operationType: 'write',
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
				deletedTransactionAmount: result[0].amount,
				deletedTransactionType: result[0].type,
				resource: 'transactions',
				operationType: 'delete',
			})

			return c.json({ 
				message: 'Transaction deleted successfully',
				deletedId: id.toString()
			})
		} catch (error) {
			// 構造化ログ: エラー時の詳細ログ
			logWithContext(c, 'error', '取引削除でエラーが発生', {
				transactionId: c.req.param('id'),
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
				resource: 'transactions',
				operationType: 'delete',
			})

			return c.json({ error: 'Failed to delete transaction' }, 500)
		}
	})

	return app
}

// デフォルトエクスポート（本番環境用）
const app = createTransactionsApp()
export default app