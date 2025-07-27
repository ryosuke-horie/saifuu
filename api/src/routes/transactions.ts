import { Hono } from 'hono'
import { type AnyDatabase, type Env } from '../db'
import { errorHandler, handleError } from '../lib/error-handler'
import { createRequestLogger } from '../lib/logger'
import { parsePositiveIntParam, parseTransactionType } from '../lib/query-parser'
import { type LoggingVariables } from '../middleware/logging'
import { TransactionService } from '../services/transaction.service'

/**
 * 取引APIのファクトリ関数
 * CRUDファクトリパターンとエラーハンドリング、ロギングユーティリティを活用
 * @param options.testDatabase - テスト用データベースインスタンス（オプション）
 */
export function createTransactionsApp(options: { testDatabase?: AnyDatabase } = {}) {
	const app = new Hono<{
		Bindings: Env
		Variables: {
			db: AnyDatabase
		} & LoggingVariables
	}>()

	// エラーハンドリングミドルウェアを適用
	app.use('*', errorHandler())

	/**
	 * 取引一覧を取得するエンドポイント
	 * @route GET /api/transactions
	 * @query {string} [type] - 取引タイプでフィルタ（expense/income）
	 * @query {number} [categoryId] - カテゴリIDでフィルタ
	 * @query {string} [startDate] - 開始日でフィルタ（YYYY-MM-DD）
	 * @query {string} [endDate] - 終了日でフィルタ（YYYY-MM-DD）
	 * @query {number} [limit] - 取得件数の制限
	 * @query {number} [offset] - 取得開始位置
	 */
	app.get('/', async (c) => {
		const requestLogger = createRequestLogger(c, {
			resource: 'transactions',
			operation: 'list',
		})

		try {
			// クエリパラメータを型安全に取得
			const query = c.req.query()
			const params = {
				type: parseTransactionType(query.type),
				categoryId: parsePositiveIntParam(query.categoryId),
				startDate: query.startDate,
				endDate: query.endDate,
				limit: parsePositiveIntParam(query.limit),
				offset: query.offset ? (parsePositiveIntParam(query.offset) ?? 0) : undefined,
			}

			// サービスを使用してデータを取得
			const db = options.testDatabase || c.get('db')
			const service = new TransactionService(db)
			const resultWithCategories = await service.getTransactions(params)

			requestLogger.success({
				transactionsCount: resultWithCategories.length,
				filters: {
					type: params.type,
					categoryId: params.categoryId,
					dateRange:
						params.startDate || params.endDate
							? {
									start: params.startDate,
									end: params.endDate,
								}
							: undefined,
				},
			})

			return c.json(resultWithCategories)
		} catch (error) {
			return handleError(c, error, 'transactions')
		}
	})

	/**
	 * 取引統計情報を取得するエンドポイント
	 * @route GET /api/transactions/stats
	 * @query {string} [type] - 取引タイプでフィルタ（expense/income）
	 * @returns {object} 統計情報
	 * @returns {number} totalExpense - 総支出額（type=expense）
	 * @returns {number} totalIncome - 総収入額（type=income）
	 * @returns {number} transactionCount - 取引件数（type=expense）
	 * @returns {number} incomeCount - 収入件数（type=income）
	 */
	app.get('/stats', async (c) => {
		const requestLogger = createRequestLogger(c, {
			resource: 'transactions',
			operation: 'stats',
		})

		try {
			const db = options.testDatabase || c.get('db')
			const service = new TransactionService(db)
			const type = c.req.query('type') as 'income' | 'expense' | undefined

			// タイプに応じた統計を取得
			const stats =
				type === 'income' ? await service.getIncomeStats() : await service.getExpenseStats()

			requestLogger.success({
				statsType: type || 'expense',
				...stats,
			})

			return c.json(stats)
		} catch (error) {
			return handleError(c, error, 'transactions')
		}
	})

	/**
	 * 新規取引作成エンドポイント
	 * @route POST /api/transactions
	 */
	app.post('/', async (c) => {
		const requestLogger = createRequestLogger(c, {
			resource: 'transactions',
			operation: 'create',
		})

		try {
			const body = await c.req.json()
			const db = options.testDatabase || c.get('db')
			const service = new TransactionService(db)

			const result = await service.createTransaction(body)

			if (!result.success) {
				requestLogger.warn('バリデーションエラー', {
					validationErrors: result.errors,
					providedData: body,
				})
				return c.json({ error: result.errors[0].message, details: result.errors }, 400)
			}

			requestLogger.success({
				transactionId: result.data.id,
				type: result.data.type,
			})

			return c.json(result.data, 201)
		} catch (error) {
			return handleError(c, error, 'transactions')
		}
	})

	/**
	 * 取引詳細取得エンドポイント
	 * @route GET /api/transactions/:id
	 */
	app.get('/:id', async (c) => {
		const requestLogger = createRequestLogger(c, {
			resource: 'transactions',
			operation: 'getById',
		})

		const db = options.testDatabase || c.get('db')
		const service = new TransactionService(db)

		// ID検証
		const idResult = service.validateId(c.req.param('id'))
		if (!idResult.success) {
			requestLogger.warn('ID形式が無効', {
				validationErrors: idResult.errors,
			})
			return c.json({ error: idResult.errors[0].message, details: idResult.errors }, 400)
		}

		try {
			const transaction = await service.getTransactionById(idResult.data)

			if (!transaction) {
				requestLogger.warn('取引が見つからない', { transactionId: idResult.data })
				return c.json({ error: 'Transaction not found' }, 404)
			}

			requestLogger.success({ transactionId: idResult.data })
			return c.json(transaction)
		} catch (error) {
			return handleError(c, error, 'transactions')
		}
	})

	/**
	 * 取引更新エンドポイント
	 * @route PUT /api/transactions/:id
	 */
	app.put('/:id', async (c) => {
		const requestLogger = createRequestLogger(c, {
			resource: 'transactions',
			operation: 'update',
		})

		const db = options.testDatabase || c.get('db')
		const service = new TransactionService(db)

		// ID検証
		const idResult = service.validateId(c.req.param('id'))
		if (!idResult.success) {
			requestLogger.warn('ID形式が無効', {
				validationErrors: idResult.errors,
			})
			return c.json({ error: idResult.errors[0].message, details: idResult.errors }, 400)
		}

		try {
			const body = await c.req.json()
			const result = await service.updateTransaction(idResult.data, body)

			if (!result.success) {
				if (result.notFound) {
					requestLogger.warn('対象トランザクションが見つからない', {
						transactionId: idResult.data,
					})
					return c.json({ error: 'Transaction not found' }, 404)
				}

				requestLogger.warn('バリデーションエラー', {
					validationErrors: result.errors,
					providedData: body,
				})
				return c.json({ error: result.errors![0].message, details: result.errors }, 400)
			}

			requestLogger.success({
				transactionId: idResult.data,
				updatedFields: Object.keys(body),
			})
			return c.json(result.data)
		} catch (error) {
			return handleError(c, error, 'transactions')
		}
	})

	/**
	 * 取引削除エンドポイント
	 * @route DELETE /api/transactions/:id
	 */
	app.delete('/:id', async (c) => {
		const requestLogger = createRequestLogger(c, {
			resource: 'transactions',
			operation: 'delete',
		})

		const db = options.testDatabase || c.get('db')
		const service = new TransactionService(db)

		// ID検証
		const idResult = service.validateId(c.req.param('id'))
		if (!idResult.success) {
			requestLogger.warn('ID形式が無効', {
				validationErrors: idResult.errors,
			})
			return c.json({ error: idResult.errors[0].message, details: idResult.errors }, 400)
		}

		try {
			const deleted = await service.deleteTransaction(idResult.data)

			if (!deleted) {
				requestLogger.warn('削除対象が見つからない', { transactionId: idResult.data })
				return c.json({ error: 'Transaction not found' }, 404)
			}

			requestLogger.success({ transactionId: idResult.data })
			return c.body(null, 204)
		} catch (error) {
			return handleError(c, error, 'transactions')
		}
	})

	return app
}

// デフォルトエクスポート（本番環境用）
const app = createTransactionsApp()
export default app
