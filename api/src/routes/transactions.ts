import { Hono } from 'hono'
import { type AnyDatabase, type Env } from '../db'
import { type Transaction as DbTransaction, type NewTransaction, transactions } from '../db/schema'
import { BadRequestError, errorHandler, handleError } from '../lib/error-handler'
import { createRequestLogger } from '../lib/logger'
import { createCrudHandlers } from '../lib/route-factory'
import { type LoggingVariables } from '../middleware/logging'
import { addCategoryInfoToTransactions, type Transaction } from '../types'
import {
	validateIdWithZod,
	validateTransactionCreateWithZod,
	validateTransactionUpdateWithZod,
} from '../validation/zod-validators'

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

	// CRUDハンドラーを作成（型パラメータを明示的に指定）
	const crudHandlers = createCrudHandlers<
		NewTransaction,
		Partial<NewTransaction>,
		DbTransaction,
		Transaction
	>({
		table: transactions,
		resourceName: 'transactions',
		validateCreate: (data: unknown) => validateTransactionCreateWithZod(data as NewTransaction),
		validateUpdate: (data: unknown) =>
			validateTransactionUpdateWithZod(data as Partial<NewTransaction>),
		validateId: validateIdWithZod,
		transformData: (data: DbTransaction[]) => addCategoryInfoToTransactions(data),
		testDatabase: options.testDatabase,
	})

	/**
	 * 取引一覧を取得するエンドポイント
	 * @route GET /api/transactions
	 * @query {string} [type] - 取引タイプでフィルタ（expense のみ）
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
			// クエリパラメータを取得
			const query = c.req.query()

			// 型安全なバリデーション（const assertionと配列includesを使用）
			const validTypes = ['income', 'expense'] as const
			type ValidType = (typeof validTypes)[number]

			const type = query.type as string | undefined
			const validatedType: ValidType | undefined =
				type && validTypes.includes(type as ValidType) ? (type as ValidType) : undefined

			// typeパラメータの検証
			if (type && !validatedType) {
				requestLogger.warn('無効なフィルタタイプ', {
					validationError: 'invalid_type_filter',
					providedType: type,
				})
				throw new BadRequestError('Invalid type filter. Allowed values are "income" or "expense"')
			}

			const categoryId = query.categoryId ? Number.parseInt(query.categoryId) : undefined
			const startDate = query.startDate
			const endDate = query.endDate
			const limit = query.limit ? Number.parseInt(query.limit) : undefined
			const offset = query.offset ? Number.parseInt(query.offset) : undefined

			const db = options.testDatabase || c.get('db')

			// データベースレベルでのクエリ構築（シンプルな実装）
			let result = await db.select().from(transactions)

			// WHERE条件をインメモリでフィルタリング（パフォーマンス改善は今後の課題）
			if (validatedType) {
				result = result.filter((tx) => tx.type === validatedType)
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
			const resultWithCategories = addCategoryInfoToTransactions(result)

			requestLogger.success({
				transactionsCount: resultWithCategories.length,
			})

			return c.json(resultWithCategories)
		} catch (error) {
			return handleError(c, error, 'transactions')
		}
	})

	/**
	 * 取引統計情報を取得するエンドポイント
	 * @route GET /api/transactions/stats
	 * @returns {object} 支出統計情報
	 * @returns {number} totalExpense - 総支出額
	 * @returns {number} transactionCount - 取引件数
	 */
	app.get('/stats', async (c) => {
		const requestLogger = createRequestLogger(c, {
			resource: 'transactions',
			operation: 'stats',
		})

		try {
			const db = options.testDatabase || c.get('db')

			// 基本統計の取得
			const allTransactions = await db
				.select({
					amount: transactions.amount,
					type: transactions.type,
				})
				.from(transactions)

			// 単一のreduceで統計を計算（O(n) パフォーマンス最適化）
			const stats = allTransactions.reduce(
				(acc, transaction) => {
					if (transaction.type === 'expense') {
						acc.totalExpense += transaction.amount
						acc.expenseCount++
					} else if (transaction.type === 'income') {
						acc.totalIncome += transaction.amount
						acc.incomeCount++
					}
					acc.transactionCount++
					return acc
				},
				{
					totalExpense: 0,
					totalIncome: 0,
					balance: 0,
					transactionCount: 0,
					expenseCount: 0,
					incomeCount: 0,
				}
			)

			// balanceを計算
			stats.balance = stats.totalIncome - stats.totalExpense

			requestLogger.success(stats)

			return c.json({ summary: stats })
		} catch (error) {
			return handleError(c, error, 'transactions')
		}
	})

	// 基本的なCRUD操作はファクトリハンドラーを使用
	app.post('/', crudHandlers.create)
	app.get('/:id', crudHandlers.getById)
	app.put('/:id', crudHandlers.update)
	app.delete('/:id', crudHandlers.delete)

	return app
}

// デフォルトエクスポート（本番環境用）
const app = createTransactionsApp()
export default app
