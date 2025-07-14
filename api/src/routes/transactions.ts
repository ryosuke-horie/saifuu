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

	/**
	 * 取引一覧を取得するエンドポイント
	 * @route GET /api/transactions
	 * @query {string} [type] - 取引タイプでフィルタ（income/expense）
	 * @query {number} [categoryId] - カテゴリIDでフィルタ
	 * @query {string} [startDate] - 開始日でフィルタ（YYYY-MM-DD）
	 * @query {string} [endDate] - 終了日でフィルタ（YYYY-MM-DD）
	 * @query {number} [limit] - 取得件数の制限
	 * @query {number} [offset] - 取得開始位置
	 * @returns {Array<Transaction>} カテゴリ情報を含む取引一覧
	 * @throws {500} データベースエラー
	 */
	app.get('/', async (c) => {
		// クエリパラメータを取得
		const query = c.req.query()
		const type = query.type as 'income' | 'expense' | undefined
		const categoryId = query.categoryId ? Number.parseInt(query.categoryId) : undefined
		const startDate = query.startDate
		const endDate = query.endDate
		const limit = query.limit ? Number.parseInt(query.limit) : undefined
		const offset = query.offset ? Number.parseInt(query.offset) : undefined

		// 構造化ログ: 取引一覧取得操作の開始
		logWithContext(c, 'info', '取引一覧取得を開始', {
			operationType: 'read',
			resource: 'transactions',
			filters: { type, categoryId, startDate, endDate, limit, offset },
		})

		try {
			const db = options.testDatabase || c.get('db')

			// クエリを実行
			let result = await db.select().from(transactions)

			// WHERE条件をインメモリでフィルタリング（Drizzle + D1の制約のため）
			if (type) {
				result = result.filter((tx) => tx.type === type)
			}
			if (categoryId !== undefined) {
				result = result.filter((tx) => tx.categoryId === categoryId)
			}
			if (startDate) {
				result = result.filter((tx) => new Date(tx.date) >= new Date(startDate))
			}
			if (endDate) {
				result = result.filter((tx) => new Date(tx.date) <= new Date(endDate))
			}

			// ページネーション（インメモリ）
			if (offset !== undefined) {
				result = result.slice(offset)
			}
			if (limit !== undefined) {
				result = result.slice(0, limit)
			}

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

	/**
	 * 取引統計情報を取得するエンドポイント
	 * @route GET /api/transactions/stats
	 * @returns {TransactionStats} 収入・支出の統計情報
	 * @returns {number} TransactionStats.totalIncome - 総収入額
	 * @returns {number} TransactionStats.totalExpense - 総支出額
	 * @returns {number} TransactionStats.balance - 収支バランス
	 * @returns {number} TransactionStats.transactionCount - 取引件数
	 * @throws {500} データベースエラー
	 */
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

	/**
	 * 新規取引を作成するエンドポイント
	 * @route POST /api/transactions
	 * @param {CreateTransactionRequest} request.body - 取引作成データ
	 * @param {number} request.body.amount - 金額（1〜1,000,000円）
	 * @param {string} request.body.type - 取引種別（income/expense）
	 * @param {string} request.body.categoryId - カテゴリID
	 * @param {string} [request.body.description] - 説明（任意・最大500文字）
	 * @param {string} request.body.date - 日付（YYYY-MM-DD形式）
	 * @returns {Transaction} 作成された取引データ
	 * @throws {400} バリデーションエラー
	 * @throws {500} データベースエラー
	 */
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

			// 金額の上限チェック（1000万円）
			if (body.amount > 10000000) {
				logWithContext(c, 'warn', '取引作成: バリデーションエラー - 金額が上限を超過', {
					validationError: 'amount_too_large',
					providedAmount: body.amount,
					maxAmount: 10000000,
				})
				return c.json({ error: 'Amount must not exceed 10,000,000' }, 400)
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

			// 説明文の文字数チェック（最大500文字）
			if (body.description && body.description.length > 500) {
				logWithContext(c, 'warn', '取引作成: バリデーションエラー - 説明文が長すぎる', {
					validationError: 'description_too_long',
					providedLength: body.description.length,
					maxLength: 500,
				})
				return c.json({ error: 'Description must not exceed 500 characters' }, 400)
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
