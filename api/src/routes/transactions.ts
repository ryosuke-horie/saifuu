import { and, count, desc, eq, gte, lte, sum } from 'drizzle-orm'
import { Hono } from 'hono'
import { type AnyDatabase, type Env } from '../db'
import { type NewTransaction, type Transaction, transactions } from '../db/schema'
import { BadRequestError, errorHandler, handleError } from '../lib/error-handler'
import { createRequestLogger } from '../lib/logger'
import { createCrudHandlers } from '../lib/route-factory'
import { type LoggingVariables } from '../middleware/logging'
import { IncomeStatisticsService } from '../services/income-statistics.service'
import { addCategoryInfo, type TransactionWithCategory } from '../utils/transaction-utils'
import {
	validateIdWithZod,
	validateTransactionCreateWithZod,
	validateTransactionUpdateWithZod,
} from '../validation/zod-validators'

/**
 * 統計タイプの定数定義
 * Matt Pocock方針：const assertionで型安全性を保証
 */
const STATISTICS_TYPES = ['income', 'expense'] as const
type StatisticsType = (typeof STATISTICS_TYPES)[number]

/**
 * 取引タイプの定数定義
 * バリデーションで使用する有効な取引タイプ
 */
const TRANSACTION_TYPES = ['income', 'expense'] as const
type TransactionType = (typeof TRANSACTION_TYPES)[number]

/**
 * 取引タイプの型ガード関数
 * Matt Pocock方針：type guardで型安全性を保証
 * @param value - 検証対象の値
 * @returns 有効な取引タイプかどうか
 */
function isValidTransactionType(value: string): value is TransactionType {
	return TRANSACTION_TYPES.includes(value as TransactionType)
}

/**
 * 統計タイプの型ガード関数
 * @param value - 検証対象の値
 * @returns 有効な統計タイプかどうか
 */
function isValidStatisticsType(value: string): value is StatisticsType {
	return STATISTICS_TYPES.includes(value as StatisticsType)
}

/**
 * 取引タイプの検証とキャスト
 * @param type - 検証対象の文字列
 * @returns 有効な取引タイプまたはundefined
 */
function validateTransactionType(type: string | undefined): TransactionType | undefined {
	return type && isValidTransactionType(type) ? type : undefined
}

/**
 * 統計タイプの検証とキャスト
 * @param type - 検証対象の文字列
 * @returns 有効な統計タイプまたはundefined
 */
function validateStatisticsType(type: string | undefined): StatisticsType | undefined {
	return type && isValidStatisticsType(type) ? type : undefined
}

/**
 * 収入統計を処理するヘルパー関数
 * リファクタリング：IncomeStatisticsServiceに処理を委譲
 * 単一責任の原則に従い、ルーティング層はHTTPハンドリングのみに集中
 * @param db - データベースインスタンス
 * @param requestLogger - リクエストロガー
 * @param c - Honoコンテキスト
 */
async function handleIncomeStats(
	db: AnyDatabase,
	requestLogger: ReturnType<typeof createRequestLogger>,
	c: { json: (object: unknown) => Response }
): Promise<Response> {
	// 依存性注入パターンでサービスを初期化
	const incomeStatsService = new IncomeStatisticsService(db)

	// ビジネスロジックをサービス層に委譲
	const incomeStats = await incomeStatsService.calculateIncomeStatistics()

	// ログ出力（統計情報と追加メトリクス）
	requestLogger.success({
		...incomeStats,
		categoriesCount: incomeStats.categoryBreakdown.length,
	})

	return c.json(incomeStats)
}

/**
 * 全体統計のレスポンス型定義
 * Matt Pocock方針：明示的で具体的な型定義
 */
interface OverallStatisticsResponse {
	readonly totalExpense: number
	readonly totalIncome: number
	readonly balance: number
	readonly transactionCount: number
	readonly expenseCount: number
	readonly incomeCount: number
}

/**
 * 全体統計を計算する関数
 * 支出・収入・全体の統計データを並列で取得し集計
 * @param db - データベースインスタンス
 * @returns 全体統計データ
 */
async function calculateOverallStatistics(db: AnyDatabase): Promise<OverallStatisticsResponse> {
	// SQL集計クエリを並列実行してパフォーマンス最適化
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
	] as const)

	// SQLの結果から統計データを安全に抽出
	const totalExpense = Number(expenseStats[0]?.totalAmount || 0)
	const expenseCount = Number(expenseStats[0]?.count || 0)
	const totalIncome = Number(incomeStats[0]?.totalAmount || 0)
	const incomeCount = Number(incomeStats[0]?.count || 0)
	const transactionCount = Number(totalStats[0]?.count || 0)
	const balance = totalIncome - totalExpense

	// satisfiesで型安全性を保証
	return {
		totalExpense,
		totalIncome,
		balance,
		transactionCount,
		expenseCount,
		incomeCount,
	} satisfies OverallStatisticsResponse
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

			// 型安全なバリデーション（定数配列とtype guardを使用）
			const type = queryParams.type as string | undefined
			const validatedType: TransactionType | undefined = validateTransactionType(type)

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

			// 日付降順でソート（新しいデータを先に取得）
			// 暫定対応: 100件リミット問題を解決するため新しいデータを優先的に取得
			selectQuery = selectQuery.orderBy(desc(transactions.date))

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

			// 型安全な統計タイプのバリデーション
			const validatedStatsType: StatisticsType | undefined = validateStatisticsType(type)

			// typeパラメータのバリデーション
			if (type && !validatedStatsType) {
				requestLogger.warn('無効な統計タイプ', {
					validationError: 'invalid_stats_type',
					providedType: type,
				})
				throw new BadRequestError(
					'Invalid type parameter. Allowed values are "income" or "expense"'
				)
			}

			// 収入統計の場合（型安全にチェック）
			if (validatedStatsType === 'income') {
				return await handleIncomeStats(db, requestLogger, c)
			}

			// 全体統計の処理
			const overallStats = await calculateOverallStatistics(db)

			requestLogger.success(overallStats)

			return c.json(overallStats)
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
