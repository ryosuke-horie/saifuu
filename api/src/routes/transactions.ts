import { ALL_CATEGORIES } from '@shared/config/categories'
import { and, count, eq, gte, lte, sum } from 'drizzle-orm'
import { Hono } from 'hono'
import { type AnyDatabase, type Env } from '../db'
import { type NewTransaction, type Transaction, transactions } from '../db/schema'
import { BadRequestError, errorHandler, handleError } from '../lib/error-handler'
import { createRequestLogger } from '../lib/logger'
import { createCrudHandlers } from '../lib/route-factory'
import { type LoggingVariables } from '../middleware/logging'
import { addCategoryInfo, type TransactionWithCategory } from '../utils/transaction-utils'
import {
	validateIdWithZod,
	validateTransactionCreateWithZod,
	validateTransactionUpdateWithZod,
} from '../validation/zod-validators'

/**
 * 収入統計情報のレスポンス型定義
 */
interface IncomeStatsResponse {
	currentMonth: number
	lastMonth: number
	currentYear: number
	monthOverMonth: number
	categoryBreakdown: Array<{
		categoryId: number
		name: string
		amount: number
		percentage: number
	}>
}

/**
 * 収入統計を処理するヘルパー関数
 * SQL集計関数を使用してパフォーマンス最適化
 * @param db - データベースインスタンス
 * @param requestLogger - リクエストロガー
 * @param c - Honoコンテキスト
 */
async function handleIncomeStats(
	db: AnyDatabase,
	requestLogger: ReturnType<typeof createRequestLogger>,
	c: { json: (object: unknown) => Response }
): Promise<Response> {
	const now = new Date()
	const currentYear = now.getFullYear()
	const currentMonth = now.getMonth() + 1
	const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1
	const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear

	// 日付範囲の計算
	const currentMonthStart = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`
	const currentMonthEnd = `${currentYear}-${String(currentMonth).padStart(2, '0')}-31`
	const lastMonthStart = `${lastMonthYear}-${String(lastMonth).padStart(2, '0')}-01`
	const lastMonthEnd = `${lastMonthYear}-${String(lastMonth).padStart(2, '0')}-31`
	const currentYearStart = `${currentYear}-01-01`
	const currentYearEnd = `${currentYear}-12-31`

	// SQL集計クエリを並列実行してパフォーマンス最適化
	const [currentMonthStats, lastMonthStats, currentYearStats, categoryStats] = await Promise.all([
		// 今月の収入統計
		db
			.select({
				totalAmount: sum(transactions.amount),
			})
			.from(transactions)
			.where(
				and(
					eq(transactions.type, 'income'),
					gte(transactions.date, currentMonthStart),
					lte(transactions.date, currentMonthEnd)
				)
			),

		// 先月の収入統計
		db
			.select({
				totalAmount: sum(transactions.amount),
			})
			.from(transactions)
			.where(
				and(
					eq(transactions.type, 'income'),
					gte(transactions.date, lastMonthStart),
					lte(transactions.date, lastMonthEnd)
				)
			),

		// 今年の収入統計
		db
			.select({
				totalAmount: sum(transactions.amount),
			})
			.from(transactions)
			.where(
				and(
					eq(transactions.type, 'income'),
					gte(transactions.date, currentYearStart),
					lte(transactions.date, currentYearEnd)
				)
			),

		// 今月のカテゴリ別収入統計
		db
			.select({
				categoryId: transactions.categoryId,
				totalAmount: sum(transactions.amount),
			})
			.from(transactions)
			.where(
				and(
					eq(transactions.type, 'income'),
					gte(transactions.date, currentMonthStart),
					lte(transactions.date, currentMonthEnd)
				)
			)
			.groupBy(transactions.categoryId),
	])

	// 統計データの集計
	const currentMonthTotal = Number(currentMonthStats[0]?.totalAmount || 0)
	const lastMonthTotal = Number(lastMonthStats[0]?.totalAmount || 0)
	const currentYearTotal = Number(currentYearStats[0]?.totalAmount || 0)

	// 前月比増減率の計算（先月が0の場合は0を返す）
	const monthOverMonth =
		lastMonthTotal === 0 ? 0 : ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100

	// カテゴリ別内訳の処理
	const categoryBreakdown = categoryStats
		.filter((stat) => stat.categoryId && stat.totalAmount)
		.map((stat) => {
			const category = ALL_CATEGORIES.find((cat) => cat.numericId === stat.categoryId)
			const amount = Number(stat.totalAmount)
			const percentage = currentMonthTotal === 0 ? 0 : (amount / currentMonthTotal) * 100

			return {
				categoryId: stat.categoryId!,
				name: category?.name || '不明なカテゴリ',
				amount,
				percentage: Math.round(percentage * 10) / 10, // 小数点第1位で四捨五入
			}
		})
		.sort((a, b) => b.amount - a.amount) // 金額の降順でソート

	const incomeStats: IncomeStatsResponse = {
		currentMonth: currentMonthTotal,
		lastMonth: lastMonthTotal,
		currentYear: currentYearTotal,
		monthOverMonth: Math.round(monthOverMonth * 10) / 10, // 小数点第1位で四捨五入
		categoryBreakdown,
	}

	requestLogger.success({
		...incomeStats,
		categoriesCount: categoryBreakdown.length,
	})

	return c.json(incomeStats)
}

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
		Transaction,
		TransactionWithCategory<Transaction>
	>({
		table: transactions,
		resourceName: 'transactions',
		validateCreate: (data: unknown) => validateTransactionCreateWithZod(data as NewTransaction),
		validateUpdate: (data: unknown) =>
			validateTransactionUpdateWithZod(data as Partial<NewTransaction>),
		validateId: validateIdWithZod,
		transformData: (data: Transaction[]) => addCategoryInfo(data),
		testDatabase: options.testDatabase,
	})

	/**
	 * 取引一覧を取得するエンドポイント（SQLクエリレベル最適化済み）
	 * @route GET /api/transactions
	 * @query {string} [type] - 取引タイプでフィルタ（income or expense）
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
			const queryParams = c.req.query()

			// 型安全なバリデーション（const assertionと配列includesを使用）
			const validTypes = ['income', 'expense'] as const
			type ValidType = (typeof validTypes)[number]

			const type = queryParams.type as string | undefined
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

			const categoryId = queryParams.categoryId
				? Number.parseInt(queryParams.categoryId)
				: undefined
			const startDate = queryParams.startDate
			const endDate = queryParams.endDate
			const limit = queryParams.limit ? Number.parseInt(queryParams.limit) : undefined
			const offset = queryParams.offset ? Number.parseInt(queryParams.offset) : undefined

			const db = options.testDatabase || c.get('db')

			// SQLレベルでのWHERE条件構築
			const conditions = []

			if (validatedType) {
				conditions.push(eq(transactions.type, validatedType))
			}
			if (categoryId !== undefined) {
				conditions.push(eq(transactions.categoryId, categoryId))
			}
			if (startDate) {
				conditions.push(gte(transactions.date, startDate))
			}
			if (endDate) {
				conditions.push(lte(transactions.date, endDate))
			}

			// SQLレベルでのクエリ構築とフィルタリング・ページネーション実行
			// Drizzle ORMのクエリビルダーでフィルタリングとページネーションを適用
			const whereCondition = conditions.length > 0 ? and(...conditions) : undefined

			// Drizzle ORMのクエリビルダーを使用（型システムの制約のため一時的にany使用）
			// biome-ignore lint/suspicious/noExplicitAny: Drizzle ORMのクエリビルダーの型互換性問題のため
			let selectQuery: any = db.select().from(transactions)

			if (whereCondition) {
				selectQuery = selectQuery.where(whereCondition)
			}

			// ページネーションの適用
			if (offset !== undefined) {
				selectQuery = selectQuery.offset(offset)
			}
			if (limit !== undefined) {
				selectQuery = selectQuery.limit(limit)
			}

			// クエリ実行
			const result = await selectQuery

			// カテゴリ情報を設定ファイルから補完
			const resultWithCategories = addCategoryInfo(result)

			requestLogger.success({
				transactionsCount: resultWithCategories.length,
			})

			return c.json(resultWithCategories)
		} catch (error) {
			return handleError(c, error, 'transactions')
		}
	})

	/**
	 * 取引統計情報を取得するエンドポイント（SQL集計関数使用で最適化済み）
	 * @route GET /api/transactions/stats
	 * @query {string} [type] - 統計タイプ（income: 収入統計、指定なし: 全体統計）
	 * @returns {object} 取引統計情報 - typeパラメータによって形式が変わる
	 *
	 * 全体統計（typeなし）のレスポンス:
	 * @returns {number} totalExpense - 総支出額
	 * @returns {number} totalIncome - 総収入額
	 * @returns {number} balance - 収支バランス
	 * @returns {number} transactionCount - 総取引件数
	 * @returns {number} expenseCount - 支出取引件数
	 * @returns {number} incomeCount - 収入取引件数
	 *
	 * 収入統計（type=income）のレスポンス:
	 * @returns {number} currentMonth - 今月の収入合計
	 * @returns {number} lastMonth - 先月の収入合計
	 * @returns {number} currentYear - 今年の収入合計
	 * @returns {number} monthOverMonth - 前月比増減率（%）
	 * @returns {Array} categoryBreakdown - カテゴリ別内訳
	 */
	app.get('/stats', async (c) => {
		const requestLogger = createRequestLogger(c, {
			resource: 'transactions',
			operation: 'stats',
		})

		try {
			const db = options.testDatabase || c.get('db')
			const queryParams = c.req.query()
			const type = queryParams.type as string | undefined

			// typeパラメータのバリデーション
			if (type && !['income', 'expense'].includes(type)) {
				requestLogger.warn('無効な統計タイプ', {
					validationError: 'invalid_stats_type',
					providedType: type,
				})
				throw new BadRequestError(
					'Invalid type parameter. Allowed values are "income" or "expense"'
				)
			}

			// 収入統計の場合
			if (type === 'income') {
				return await handleIncomeStats(db, requestLogger, c)
			}

			// 全体統計（従来のロジック）
			// SQL集計関数を使用してパフォーマンス最適化
			const [expenseStats, incomeStats, totalStats] = await Promise.all([
				// 支出統計
				db
					.select({
						totalAmount: sum(transactions.amount),
						count: count(transactions.id),
					})
					.from(transactions)
					.where(eq(transactions.type, 'expense')),

				// 収入統計
				db
					.select({
						totalAmount: sum(transactions.amount),
						count: count(transactions.id),
					})
					.from(transactions)
					.where(eq(transactions.type, 'income')),

				// 全体統計
				db
					.select({
						count: count(transactions.id),
					})
					.from(transactions),
			])

			// SQLの結果から統計データを構築
			const totalExpense = Number(expenseStats[0]?.totalAmount || 0)
			const expenseCount = Number(expenseStats[0]?.count || 0)
			const totalIncome = Number(incomeStats[0]?.totalAmount || 0)
			const incomeCount = Number(incomeStats[0]?.count || 0)
			const transactionCount = Number(totalStats[0]?.count || 0)
			const balance = totalIncome - totalExpense

			const stats = {
				totalExpense,
				totalIncome,
				balance,
				transactionCount,
				expenseCount,
				incomeCount,
			}

			requestLogger.success(stats)

			return c.json(stats)
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
