import { ALL_CATEGORIES } from '@shared/config/categories'
import { and, eq, gte, lte, sum } from 'drizzle-orm'
import { type AnyDatabase } from '../db'
import { transactions } from '../db/schema'

/**
 * 収入統計の期間定義型
 * 日付計算で使用する期間データの型安全性を保証
 */
interface DateRange {
	readonly start: string
	readonly end: string
}

/**
 * 収入統計の期間計算結果型
 * 現在月・先月・今年の期間を管理
 */
interface StatisticsPeriods {
	readonly currentMonth: DateRange
	readonly lastMonth: DateRange
	readonly currentYear: DateRange
}

/**
 * データベースから取得する統計クエリ結果型
 * SQLクエリの結果を型安全に扱うため
 */
interface RawStatistics {
	readonly totalAmount: string | null
}

/**
 * カテゴリ別統計のデータベース結果型
 */
interface RawCategoryStatistics {
	readonly categoryId: number | null
	readonly totalAmount: string | null
}

/**
 * 検証済みカテゴリ統計型
 * null値が除外された安全な型
 */
interface ValidCategoryStatistics {
	readonly categoryId: number
	readonly totalAmount: string
}

/**
 * カテゴリ別収入内訳の最終出力型
 */
interface CategoryBreakdown {
	readonly categoryId: number
	readonly name: string
	readonly amount: number
	readonly percentage: number
}

/**
 * 収入統計レスポンスの型定義
 * Matt Pocock方針：readonlyで不変性を保証し、明示的な型定義
 */
export interface IncomeStatisticsResponse {
	readonly currentMonth: number
	readonly lastMonth: number
	readonly currentYear: number
	readonly monthOverMonth: number
	readonly categoryBreakdown: readonly CategoryBreakdown[]
}

/**
 * 収入統計計算のコア機能を提供するサービスクラス
 * 単一責任の原則：収入統計の計算のみに特化
 */
export class IncomeStatisticsService {
	/**
	 * データベースインスタンスを注入
	 * 依存性注入パターンでテスタビリティを向上
	 */
	constructor(private readonly db: AnyDatabase) {}

	/**
	 * 収入統計データを計算して返す
	 * メイン処理：外部から呼び出される唯一のパブリックメソッド
	 */
	async calculateIncomeStatistics(): Promise<IncomeStatisticsResponse> {
		// 1. 期間の計算
		const periods = this.calculateStatisticsPeriods()

		// 2. データベースクエリの並列実行（パフォーマンス最適化）
		const [currentMonthStats, lastMonthStats, currentYearStats, categoryStats] =
			await this.executeParallelQueries(periods)

		// 3. 統計値の計算
		const currentMonthTotal = this.extractAmount(currentMonthStats)
		const lastMonthTotal = this.extractAmount(lastMonthStats)
		const currentYearTotal = this.extractAmount(currentYearStats)

		// 4. 前月比計算
		const monthOverMonth = this.calculateMonthOverMonth(currentMonthTotal, lastMonthTotal)

		// 5. カテゴリ別内訳の処理
		const categoryBreakdown = this.processCategoryBreakdown(categoryStats, currentMonthTotal)

		// satisfiesキーワードで型安全性を保証
		return {
			currentMonth: currentMonthTotal,
			lastMonth: lastMonthTotal,
			currentYear: currentYearTotal,
			monthOverMonth,
			categoryBreakdown,
		} satisfies IncomeStatisticsResponse
	}

	/**
	 * 統計期間の計算
	 * 現在月・先月・今年の期間を計算する純粋関数
	 */
	private calculateStatisticsPeriods(): StatisticsPeriods {
		const now = new Date()
		const currentYear = now.getFullYear()
		const currentMonth = now.getMonth() + 1

		// 先月の計算（年またぎを考慮）
		const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1
		const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear

		// 日付文字列の生成（ゼロパディング）
		const formatMonth = (month: number): string => String(month).padStart(2, '0')

		return {
			currentMonth: {
				start: `${currentYear}-${formatMonth(currentMonth)}-01`,
				end: `${currentYear}-${formatMonth(currentMonth)}-31`,
			},
			lastMonth: {
				start: `${lastMonthYear}-${formatMonth(lastMonth)}-01`,
				end: `${lastMonthYear}-${formatMonth(lastMonth)}-31`,
			},
			currentYear: {
				start: `${currentYear}-01-01`,
				end: `${currentYear}-12-31`,
			},
		} satisfies StatisticsPeriods
	}

	/**
	 * データベースクエリの並列実行
	 * Promise.allでパフォーマンス最適化
	 */
	private async executeParallelQueries(periods: StatisticsPeriods) {
		return Promise.all([
			this.queryPeriodStatistics(periods.currentMonth),
			this.queryPeriodStatistics(periods.lastMonth),
			this.queryPeriodStatistics(periods.currentYear),
			this.queryCategoryStatistics(periods.currentMonth),
		] as const)
	}

	/**
	 * 期間指定収入統計クエリ
	 * 共通化された期間クエリ処理
	 */
	private async queryPeriodStatistics(period: DateRange): Promise<RawStatistics[]> {
		return this.db
			.select({
				totalAmount: sum(transactions.amount),
			})
			.from(transactions)
			.where(
				and(
					eq(transactions.type, 'income'),
					gte(transactions.date, period.start),
					lte(transactions.date, period.end)
				)
			)
	}

	/**
	 * カテゴリ別収入統計クエリ
	 * 今月のカテゴリ別収入を取得
	 */
	private async queryCategoryStatistics(period: DateRange): Promise<RawCategoryStatistics[]> {
		return this.db
			.select({
				categoryId: transactions.categoryId,
				totalAmount: sum(transactions.amount),
			})
			.from(transactions)
			.where(
				and(
					eq(transactions.type, 'income'),
					gte(transactions.date, period.start),
					lte(transactions.date, period.end)
				)
			)
			.groupBy(transactions.categoryId)
	}

	/**
	 * SQLクエリ結果から金額を安全に抽出
	 * nullチェックと型変換を集約
	 */
	private extractAmount(statistics: RawStatistics[]): number {
		const amount = statistics[0]?.totalAmount
		return amount ? Number(amount) : 0
	}

	/**
	 * 前月比増減率の計算
	 * ゼロ除算を防ぐロジックを含む純粋関数
	 */
	private calculateMonthOverMonth(current: number, last: number): number {
		if (last === 0) return 0
		const rate = ((current - last) / last) * 100
		return Math.round(rate * 10) / 10 // 小数点第1位で四捨五入
	}

	/**
	 * カテゴリ別内訳データの処理
	 * フィルタリング、マッピング、ソートを実行
	 */
	private processCategoryBreakdown(
		categoryStats: RawCategoryStatistics[],
		totalAmount: number
	): CategoryBreakdown[] {
		return categoryStats
			.filter(this.isValidCategoryStatistics)
			.map((stat) => this.mapToCategoryBreakdown(stat, totalAmount))
			.sort((a, b) => b.amount - a.amount) // 金額降順ソート
	}

	/**
	 * カテゴリ統計の有効性チェック
	 * 型ガード関数として使用
	 */
	private isValidCategoryStatistics(stat: RawCategoryStatistics): stat is ValidCategoryStatistics {
		return stat.categoryId !== null && stat.totalAmount !== null
	}

	/**
	 * カテゴリ統計データをレスポンス形式にマッピング
	 * カテゴリ名の解決と割合計算を実行
	 */
	private mapToCategoryBreakdown(
		stat: ValidCategoryStatistics,
		totalAmount: number
	): CategoryBreakdown {
		const category = ALL_CATEGORIES.find((cat) => cat.numericId === stat.categoryId)
		const amount = Number(stat.totalAmount)
		const percentage = totalAmount === 0 ? 0 : (amount / totalAmount) * 100

		return {
			categoryId: stat.categoryId,
			name: category?.name || '不明なカテゴリ',
			amount,
			percentage: Math.round(percentage * 10) / 10, // 小数点第1位で四捨五入
		} satisfies CategoryBreakdown
	}
}
