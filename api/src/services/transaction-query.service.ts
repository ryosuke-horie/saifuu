/**
 * 取引クエリサービス
 * データベースクエリの構築と実行を担当
 *
 * 設計意図：
 * - SQLクエリビルダーのロジックを集約
 * - 型安全なクエリ構築
 * - パフォーマンス最適化
 */
import { and, between, eq, gte, lte, type SQL, sql } from 'drizzle-orm'
import type { AnyDatabase } from '../db'
import { type Transaction, transactions } from '../db/schema'

/**
 * 取引フィルターパラメータの型定義
 * Matt Pocock方針: 明確で再利用可能な型定義
 */
export type TransactionFilterParams = {
	type?: 'income' | 'expense'
	categoryId?: number
	startDate?: string
	endDate?: string
	limit?: number
	offset?: number
}

/**
 * 統計情報の型定義
 * 収入と支出で異なる統計情報を明確に型付け
 */
export type IncomeStats = {
	totalIncome: number
	incomeCount: number
}

export type ExpenseStats = {
	totalExpense: number
	transactionCount: number
}

export type TransactionStats = IncomeStats | ExpenseStats

/**
 * 取引クエリサービスクラス
 * 単一責任原則: データベースクエリの構築と実行のみを担当
 */
export class TransactionQueryService {
	constructor(private readonly db: AnyDatabase) {}

	/**
	 * フィルタリングされた取引一覧を取得
	 * SQLレベルでフィルタリングを行い、パフォーマンスを最適化
	 */
	async findTransactions(params: TransactionFilterParams): Promise<Transaction[]> {
		const conditions = this.buildWhereConditions(params)

		let query = this.db.select().from(transactions).$dynamic()

		// WHERE条件を追加
		if (conditions.length > 0) {
			query = query.where(and(...conditions))
		}

		// ページネーション
		if (params.limit !== undefined) {
			query = query.limit(params.limit)
		}
		if (params.offset !== undefined) {
			query = query.offset(params.offset)
		}

		return await query
	}

	/**
	 * 収入統計を計算
	 * 収入のみを対象に集計
	 * SQLの集約関数を使用してデータベースレベルで効率的に計算
	 */
	async calculateIncomeStats(): Promise<IncomeStats> {
		const result = await this.db
			.select({
				totalIncome: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
				incomeCount: sql<number>`COUNT(*)`,
			})
			.from(transactions)
			.where(eq(transactions.type, 'income'))

		// 結果は必ず1行返される
		const stats = result[0]

		return {
			totalIncome: Number(stats.totalIncome),
			incomeCount: Number(stats.incomeCount),
		}
	}

	/**
	 * 支出統計を計算
	 * 支出のみを対象に集計
	 * SQLの集約関数を使用してデータベースレベルで効率的に計算
	 */
	async calculateExpenseStats(): Promise<ExpenseStats> {
		// 支出の合計と件数を1つのクエリで取得
		const expenseResult = await this.db
			.select({
				totalExpense: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
				expenseCount: sql<number>`COUNT(*)`,
			})
			.from(transactions)
			.where(eq(transactions.type, 'expense'))

		// 全取引数を取得（支出のみではなく全体）
		const totalResult = await this.db
			.select({
				transactionCount: sql<number>`COUNT(*)`,
			})
			.from(transactions)

		const expenseStats = expenseResult[0]
		const totalStats = totalResult[0]

		return {
			totalExpense: Number(expenseStats.totalExpense),
			transactionCount: Number(totalStats.transactionCount),
		}
	}

	/**
	 * WHERE条件を構築
	 * 各フィルター条件をSQL条件に変換
	 */
	private buildWhereConditions(params: TransactionFilterParams): SQL[] {
		const conditions: SQL[] = []

		if (params.type) {
			conditions.push(eq(transactions.type, params.type))
		}

		if (params.categoryId !== undefined) {
			conditions.push(eq(transactions.categoryId, params.categoryId))
		}

		// 日付範囲フィルター
		if (params.startDate && params.endDate) {
			conditions.push(between(transactions.date, params.startDate, params.endDate))
		} else if (params.startDate) {
			conditions.push(gte(transactions.date, params.startDate))
		} else if (params.endDate) {
			conditions.push(lte(transactions.date, params.endDate))
		}

		return conditions
	}
}
