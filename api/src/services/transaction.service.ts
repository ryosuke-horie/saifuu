/**
 * 取引サービス
 * 取引に関するビジネスロジックを管理
 *
 * 設計意図：
 * - 収入と支出の処理を統一的に扱う
 * - バリデーションとデータ変換の責任を持つ
 * - 高凝集・疎結合な設計
 */
import { eq } from 'drizzle-orm'
import type { AnyDatabase } from '../db'
import { type NewTransaction, type Transaction, transactions } from '../db/schema'
import { addCategoryInfo, type TransactionWithCategory } from '../utils/transaction-utils'
import type { ValidationError, ValidationResult } from '../validation/zod-validators'
import {
	validateIdWithZod,
	validateTransactionCreateWithZod,
	validateTransactionUpdateWithZod,
} from '../validation/zod-validators'
import {
	type ExpenseStats,
	type IncomeStats,
	type TransactionFilterParams,
	TransactionQueryService,
} from './transaction-query.service'

/**
 * 取引サービスクラス
 * 単一責任原則: 取引のビジネスロジックのみを担当
 */
export class TransactionService {
	private readonly queryService: TransactionQueryService

	constructor(private readonly db: AnyDatabase) {
		this.queryService = new TransactionQueryService(db)
	}

	/**
	 * フィルタリングされた取引一覧を取得
	 * カテゴリ情報を付加して返す
	 */
	async getTransactions(
		params: TransactionFilterParams
	): Promise<TransactionWithCategory<Transaction>[]> {
		const transactions = await this.queryService.findTransactions(params)
		return addCategoryInfo(transactions)
	}

	/**
	 * IDで取引を取得
	 * 存在チェックとカテゴリ情報の付加を行う
	 */
	async getTransactionById(id: number): Promise<TransactionWithCategory<Transaction> | null> {
		const [transaction] = await this.db
			.select()
			.from(transactions)
			.where(eq(transactions.id, id))
			.limit(1)

		if (!transaction) {
			return null
		}

		const [transactionWithCategory] = addCategoryInfo([transaction])
		return transactionWithCategory
	}

	/**
	 * 新しい取引を作成
	 * バリデーションとタイムスタンプの設定を行う
	 */
	async createTransaction(data: unknown): Promise<
		| {
				success: true
				data: TransactionWithCategory<Transaction>
		  }
		| {
				success: false
				errors: ValidationError[]
		  }
	> {
		// バリデーション
		const validationResult = validateTransactionCreateWithZod(data as NewTransaction)
		if (!validationResult.success) {
			return { success: false, errors: validationResult.errors }
		}

		// データ作成
		const newData = {
			...validationResult.data,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		}

		const [created] = await this.db.insert(transactions).values(newData).returning()

		const [transactionWithCategory] = addCategoryInfo([created])
		return { success: true, data: transactionWithCategory }
	}

	/**
	 * 既存の取引を更新
	 * タイプに基づいた適切なバリデーションを適用
	 */
	async updateTransaction(
		id: number,
		data: unknown
	): Promise<
		| {
				success: true
				data: TransactionWithCategory<Transaction>
		  }
		| {
				success: false
				errors?: ValidationError[]
				notFound?: boolean
		  }
	> {
		// 既存データの確認
		const existing = await this.getTransactionById(id)
		if (!existing) {
			return { success: false, notFound: true }
		}

		// タイプを保持したバリデーション
		const dataWithType = { ...(data as object), type: existing.type }
		const validationResult = validateTransactionUpdateWithZod(
			dataWithType as Partial<NewTransaction>
		)

		if (!validationResult.success) {
			return { success: false, errors: validationResult.errors }
		}

		// 更新実行
		const updateData = {
			...validationResult.data,
			updatedAt: new Date().toISOString(),
		}

		const [updated] = await this.db
			.update(transactions)
			.set(updateData)
			.where(eq(transactions.id, id))
			.returning()

		const [transactionWithCategory] = addCategoryInfo([updated])
		return { success: true, data: transactionWithCategory }
	}

	/**
	 * 取引を削除
	 */
	async deleteTransaction(id: number): Promise<boolean> {
		const result = await this.db.delete(transactions).where(eq(transactions.id, id)).returning()

		return result.length > 0
	}

	/**
	 * 収入統計を取得
	 */
	async getIncomeStats(): Promise<IncomeStats> {
		return await this.queryService.calculateIncomeStats()
	}

	/**
	 * 支出統計を取得
	 */
	async getExpenseStats(): Promise<ExpenseStats> {
		return await this.queryService.calculateExpenseStats()
	}

	/**
	 * IDバリデーション
	 * 外部からのID入力を検証
	 */
	validateId(id: unknown): ValidationResult<number> {
		return validateIdWithZod(id)
	}
}
