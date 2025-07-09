import { desc, eq, and, gte, lte, sql } from 'drizzle-orm'
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

	// 取引一覧取得
	app.get('/', async (c) => {
		// 構造化ログ: 取引一覧取得操作の開始
		logWithContext(c, 'info', '取引一覧取得を開始', {
			operationType: 'read',
			resource: 'transactions',
		})

		try {
			const db = options.testDatabase || c.get('db')
			
			// クエリパラメータの取得
			const typeParam = c.req.query('type')
			const categoryIdParam = c.req.query('categoryId')
			const dateFromParam = c.req.query('dateFrom')
			const dateToParam = c.req.query('dateTo')
			const limitParam = c.req.query('limit')
			const pageParam = c.req.query('page')

			// クエリ条件の構築
			const conditions = []
			
			if (typeParam && ['income', 'expense'].includes(typeParam)) {
				conditions.push(eq(transactions.type, typeParam as 'income' | 'expense'))
			}
			
			if (categoryIdParam) {
				const categoryId = Number.parseInt(categoryIdParam)
				if (!Number.isNaN(categoryId)) {
					conditions.push(eq(transactions.categoryId, categoryId))
				}
			}
			
			if (dateFromParam) {
				conditions.push(gte(transactions.date, dateFromParam))
			}
			
			if (dateToParam) {
				conditions.push(lte(transactions.date, dateToParam))
			}

			// ページネーション設定
			const limit = limitParam ? Number.parseInt(limitParam) : 50
			const page = pageParam ? Number.parseInt(pageParam) : 1
			const offset = (page - 1) * limit

			// クエリ実行
			let query = db
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
				.orderBy(desc(transactions.date), desc(transactions.id))

			// 条件が存在する場合、WHERE句を追加
			if (conditions.length > 0) {
				query = query.where(and(...conditions))
			}

			// リミットとオフセットを追加
			const result = await query.limit(limit).offset(offset)

			// 構造化ログ: 取得成功時のログ
			logWithContext(c, 'info', '取引一覧取得が完了', {
				transactionsCount: result.length,
				resource: 'transactions',
				queryParams: {
					type: typeParam,
					categoryId: categoryIdParam,
					dateFrom: dateFromParam,
					dateTo: dateToParam,
					limit,
					page,
				},
			})

			return c.json(result)
		} catch (error) {
			// 構造化ログ: エラー時の詳細ログ
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
					description: body.description,
					date: body.date,
					categoryId: body.categoryId,
				},
			})

			const db = options.testDatabase || c.get('db')

			// 必須フィールドのバリデーション
			if (typeof body.amount !== 'number' || body.amount < 0) {
				logWithContext(c, 'warn', '取引作成: バリデーションエラー - 金額が無効', {
					validationError: 'amount_invalid',
					providedAmount: body.amount,
				})
				return c.json({ error: 'Amount must be a positive number' }, 400)
			}

			if (!body.type || !['income', 'expense'].includes(body.type)) {
				logWithContext(c, 'warn', '取引作成: バリデーションエラー - 取引タイプが無効', {
					validationError: 'type_invalid',
					providedType: body.type,
				})
				return c.json({ error: 'Type must be either income or expense' }, 400)
			}

			if (!body.date || typeof body.date !== 'string') {
				logWithContext(c, 'warn', '取引作成: バリデーションエラー - 日付が無効', {
					validationError: 'date_invalid',
					providedDate: body.date,
				})
				return c.json({ error: 'Date is required and must be a valid date string' }, 400)
			}

			// 日付形式のバリデーション
			const dateObject = new Date(body.date)
			if (Number.isNaN(dateObject.getTime())) {
				logWithContext(c, 'warn', '取引作成: バリデーションエラー - 日付形式が無効', {
					validationError: 'date_format_invalid',
					providedDate: body.date,
				})
				return c.json({ error: 'Date must be in valid ISO format' }, 400)
			}

			const newTransaction: NewTransaction = {
				amount: body.amount,
				type: body.type,
				description: body.description || null,
				date: body.date,
				categoryId: body.categoryId || null,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			}

			const result = await db.insert(transactions).values(newTransaction).returning()

			// 構造化ログ: 取引作成成功時のログ
			logWithContext(c, 'info', '取引作成が完了', {
				transactionId: result[0].id,
				amount: result[0].amount,
				type: result[0].type,
				date: result[0].date,
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

	// 取引統計取得（/:id より前に定義する必要がある）
	app.get('/stats', async (c) => {
		try {
			// 構造化ログ: 取引統計取得操作の開始
			logWithContext(c, 'info', '取引統計取得を開始', {
				operationType: 'read',
				resource: 'transactions',
				action: 'stats',
			})

			const db = options.testDatabase || c.get('db')

			// 日付範囲のクエリパラメータ
			const dateFromParam = c.req.query('dateFrom')
			const dateToParam = c.req.query('dateTo')

			// 基本統計の取得
			const conditions = []
			if (dateFromParam) {
				conditions.push(gte(transactions.date, dateFromParam))
			}
			if (dateToParam) {
				conditions.push(lte(transactions.date, dateToParam))
			}

			// 収入・支出の合計とカウント
			const baseQuery = db
				.select({
					type: transactions.type,
					totalAmount: sql<number>`sum(${transactions.amount})`.as('totalAmount'),
					count: sql<number>`count(*)`.as('count'),
				})
				.from(transactions)
				.groupBy(transactions.type)

			const statsQuery = conditions.length > 0 
				? baseQuery.where(and(...conditions))
				: baseQuery

			const basicStats = await statsQuery

			// カテゴリ別統計の取得
			const categoryQuery = db
				.select({
					categoryId: transactions.categoryId,
					categoryName: categories.name,
					type: transactions.type,
					totalAmount: sql<number>`sum(${transactions.amount})`.as('totalAmount'),
					count: sql<number>`count(*)`.as('count'),
				})
				.from(transactions)
				.leftJoin(categories, eq(transactions.categoryId, categories.id))
				.groupBy(transactions.categoryId, categories.name, transactions.type)

			const categoryStatsQuery = conditions.length > 0 
				? categoryQuery.where(and(...conditions))
				: categoryQuery

			const categoryStats = await categoryStatsQuery

			// 統計データの集計
			const totalIncome = basicStats.find(s => s.type === 'income')?.totalAmount || 0
			const totalExpense = basicStats.find(s => s.type === 'expense')?.totalAmount || 0
			const incomeCount = basicStats.find(s => s.type === 'income')?.count || 0
			const expenseCount = basicStats.find(s => s.type === 'expense')?.count || 0
			const totalTransactions = incomeCount + expenseCount

			const stats = {
				totalIncome,
				totalExpense,
				netAmount: totalIncome - totalExpense,
				transactionCount: totalTransactions,
				avgTransaction: totalTransactions > 0 ? (totalIncome + totalExpense) / totalTransactions : 0,
				categoryBreakdown: categoryStats.map(stat => ({
					categoryId: stat.categoryId?.toString() || 'uncategorized',
					categoryName: stat.categoryName || 'カテゴリなし',
					type: stat.type,
					count: stat.count,
					totalAmount: stat.totalAmount,
				})),
			}

			// 構造化ログ: 取引統計取得成功時のログ
			logWithContext(c, 'info', '取引統計取得が完了', {
				totalIncome,
				totalExpense,
				netAmount: stats.netAmount,
				transactionCount: totalTransactions,
				categoryBreakdownCount: categoryStats.length,
				resource: 'transactions',
				queryParams: {
					dateFrom: dateFromParam,
					dateTo: dateToParam,
				},
			})

			return c.json(stats)
		} catch (error) {
			// 構造化ログ: 取引統計取得エラー時の詳細ログ
			logWithContext(c, 'error', '取引統計取得でエラーが発生', {
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
				resource: 'transactions',
				operationType: 'read',
				databaseOperation: 'aggregate',
			})

			return c.json({ error: 'Failed to fetch transaction statistics' }, 500)
		}
	})

	// 取引詳細取得
	app.get('/:id', async (c) => {
		try {
			const idParam = c.req.param('id')
			const id = Number.parseInt(idParam)

			// IDの形式チェック
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
				transactionType: result[0].type,
				amount: result[0].amount,
				resource: 'transactions',
			})

			return c.json(result[0])
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

			// IDの形式チェック
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

			// バリデーション（更新データに対して）
			if (body.amount !== undefined && (typeof body.amount !== 'number' || body.amount < 0)) {
				logWithContext(c, 'warn', '取引更新: バリデーションエラー - 金額が無効', {
					validationError: 'amount_invalid',
					providedAmount: body.amount,
				})
				return c.json({ error: 'Amount must be a positive number' }, 400)
			}

			if (body.type !== undefined && !['income', 'expense'].includes(body.type)) {
				logWithContext(c, 'warn', '取引更新: バリデーションエラー - 取引タイプが無効', {
					validationError: 'type_invalid',
					providedType: body.type,
				})
				return c.json({ error: 'Type must be either income or expense' }, 400)
			}

			if (body.date !== undefined) {
				const dateObject = new Date(body.date)
				if (Number.isNaN(dateObject.getTime())) {
					logWithContext(c, 'warn', '取引更新: バリデーションエラー - 日付形式が無効', {
						validationError: 'date_format_invalid',
						providedDate: body.date,
					})
					return c.json({ error: 'Date must be in valid ISO format' }, 400)
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
				transactionType: result[0].type,
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

			// IDの形式チェック
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
				deletedTransactionType: result[0].type,
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