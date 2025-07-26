/**
 * 取引クエリサービス
 * データベースクエリの構築と実行を担当
 * 
 * 設計意図：
 * - SQLクエリビルダーのロジックを集約
 * - 型安全なクエリ構築
 * - パフォーマンス最適化
 */
import { and, between, eq, gte, lte, type SQL } from 'drizzle-orm'
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
		
		let query = this.db
			.select()
			.from(transactions)
			.$dynamic()

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
	 */
	async calculateIncomeStats(): Promise<IncomeStats> {
		const incomeTransactions = await this.db
			.select({
				amount: transactions.amount,
			})
			.from(transactions)
			.where(eq(transactions.type, 'income'))

		const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0)
		const incomeCount = incomeTransactions.length

		return {
			totalIncome,
			incomeCount,
		}
	}

	/**
	 * 支出統計を計算
	 * 支出のみを対象に集計
	 */
	async calculateExpenseStats(): Promise<ExpenseStats> {
		const expenseTransactions = await this.db
			.select({
				amount: transactions.amount,
			})
			.from(transactions)
			.where(eq(transactions.type, 'expense'))

		const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0)
		
		// 全取引数を取得（要件に応じて支出のみか全体かを選択）
		const allTransactions = await this.db
			.select()
			.from(transactions)
		
		const transactionCount = allTransactions.length

		return {
			totalExpense,
			transactionCount,
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