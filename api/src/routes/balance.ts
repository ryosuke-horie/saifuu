import { and, gte, lte } from 'drizzle-orm'
import { Hono } from 'hono'
import { type AnyDatabase, type Env } from '../db'
import { transactions } from '../db/schema'
import { errorHandler, handleError } from '../lib/error-handler'
import { createRequestLogger } from '../lib/logger'
import { type LoggingVariables } from '../middleware/logging'

/**
 * 収支サマリーレスポンスの型定義
 * 月間の収入・支出・残高と貯蓄率、トレンドを返す
 *
 * 設計意図: APIレスポンスとして必要最小限の情報を含む
 * 代替案: 前月比較や年間累計を含むことも検討したが、
 *         パフォーマンスと使用頻度を考慮して現在の形式を採用
 */
export interface BalanceSummaryResponse {
	income: number
	expense: number
	balance: number
	savingsRate: number
	trend: 'positive' | 'negative' | 'neutral'
}

/**
 * 収支バランスAPIのファクトリ関数
 * 月次の収支サマリーを提供する
 * @param options.testDatabase - テスト用データベースインスタンス（オプション）
 */
export function createBalanceApp(options: { testDatabase?: AnyDatabase } = {}) {
	const app = new Hono<{
		Bindings: Env
		Variables: {
			db: AnyDatabase
		} & LoggingVariables
	}>()

	// エラーハンドリングミドルウェアを適用
	app.use('*', errorHandler())

	/**
	 * 収支サマリーを取得するエンドポイント
	 * 現在の月の収入・支出・残高と貯蓄率、トレンドを返す
	 * @route GET /api/balance/summary
	 * @returns {BalanceSummaryResponse} 収支サマリー情報
	 */
	app.get('/summary', async (c) => {
		const requestLogger = createRequestLogger(c, {
			resource: 'balance',
			operation: 'summary',
		})

		try {
			const db = options.testDatabase || c.get('db')

			if (!db) {
				throw new Error('Database not initialized')
			}

			// 現在の月の開始日と終了日を計算
			const now = new Date()
			const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
			const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

			// ISO文字列に変換（データベースの日付形式に合わせる）
			const startDate = startOfMonth.toISOString()
			const endDate = endOfMonth.toISOString()

			// 現在月の取引を取得
			const monthlyTransactions = await db
				.select({
					amount: transactions.amount,
					type: transactions.type,
				})
				.from(transactions)
				.where(and(gte(transactions.date, startDate), lte(transactions.date, endDate)))

			// 収入と支出を集計
			const summary = calculateTransactionSummary(monthlyTransactions)

			// 残高を計算
			const balance = summary.income - summary.expense

			// 貯蓄率を計算
			const savingsRate = calculateSavingsRate(balance, summary.income)

			// トレンドを判定
			const trend = determineTrend(balance)

			const response: BalanceSummaryResponse = {
				income: summary.income,
				expense: summary.expense,
				balance,
				savingsRate,
				trend,
			}

			requestLogger.success({
				...response,
				period: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
			})

			return c.json(response)
		} catch (error) {
			return handleError(c, error, 'balance')
		}
	})

	return app
}

/**
 * 取引データから収入・支出を集計する
 *
 * 設計意図: 単一責任の原則に従い、集計ロジックを分離
 * 代替案: SQLでの集計も検討したが、複雑なクエリより
 *         TypeScriptでの処理の方が保守性が高いと判断
 */
function calculateTransactionSummary(transactions: Array<{ amount: number; type: string }>): {
	income: number
	expense: number
} {
	return transactions.reduce(
		(acc, transaction) => {
			if (transaction.type === 'income') {
				acc.income += transaction.amount
			} else if (transaction.type === 'expense') {
				acc.expense += transaction.amount
			}
			return acc
		},
		{
			income: 0,
			expense: 0,
		}
	)
}

/**
 * 貯蓄率を計算する（小数点第1位まで）
 *
 * 設計意図: 貯蓄率の計算ロジックを独立させ、テスト可能にする
 * 収入が0の場合は0%を返す（ゼロ除算を防ぐ）
 */
function calculateSavingsRate(balance: number, income: number): number {
	if (income <= 0) return 0
	return Math.round((balance / income) * 100 * 10) / 10
}

/**
 * 残高からトレンドを判定する
 *
 * 設計意図: トレンド判定のロジックを分離し、将来の拡張を容易にする
 * 代替案: より詳細なトレンド（大幅改善、微増など）も検討したが、
 *         UIの単純性を優先して3段階に留めた
 */
function determineTrend(balance: number): 'positive' | 'negative' | 'neutral' {
	if (balance > 0) return 'positive'
	if (balance < 0) return 'negative'
	return 'neutral'
}

// デフォルトエクスポート（本番環境用）
const app = createBalanceApp()
export default app
