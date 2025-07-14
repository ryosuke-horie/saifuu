/**
 * カテゴリマスターデータ
 *
 * フロントエンドとバックエンドで共通利用されるカテゴリ設定
 *
 * 設計方針:
 * - 固定カテゴリによる一貫性確保
 * - 収入・支出両方のカテゴリを包括
 * - 視覚的な識別のための色設定
 * - 既存のデータベースカテゴリとの互換性維持
 *
 * ⚠️ 重要な注意事項: numericIdの取り扱いについて
 * - numericIdは一度設定したら絶対に変更してはいけません
 * - このIDはデータベースのtransactionsとsubscriptionsテーブルから参照されています
 * - IDを変更すると既存のデータとの整合性が失われ、データ不整合が発生します
 * - 新しいカテゴリを追加する場合は、既存の最大IDより大きい値を使用してください
 * - カテゴリを削除する場合でも、IDの再利用は絶対に行わないでください
 */

export type CategoryType = 'expense'

export interface CategoryConfig {
	id: string
	numericId: number // データベースで使用する固定ID（絶対に変更不可）
	name: string
	type: CategoryType
	color: string
	description?: string
}

/**
 * 支出カテゴリ設定
 *
 * ⚠️ 注意: numericIdは既存データとの整合性を保つため、絶対に変更しないでください
 */
export const EXPENSE_CATEGORIES: CategoryConfig[] = [
	// 生活必需品関連
	{
		id: 'utilities',
		numericId: 1,
		name: '家賃・水道・光熱・通信費',
		type: 'expense',
		color: '#D35400',
		description: '家賃、電気、ガス、水道、インターネット、携帯電話',
	},
	{
		id: 'housing',
		numericId: 2,
		name: '住居費',
		type: 'expense',
		color: '#4ECDC4',
		description: '家賃、光熱費、住居関連費用',
	},
	{
		id: 'food',
		numericId: 3,
		name: '食費',
		type: 'expense',
		color: '#FF6B6B',
		description: '食材、外食、飲食代',
	},
	{
		id: 'transportation',
		numericId: 4,
		name: '交通費',
		type: 'expense',
		color: '#3498DB',
		description: '電車、バス、タクシー、ガソリン代',
	},

	// 仕事・学習関連
	{
		id: 'business',
		numericId: 5,
		name: '仕事・ビジネス',
		type: 'expense',
		color: '#8E44AD',
		description: '開発費、ツール、サービス、ビジネス関連',
	},
	{
		id: 'system_fee',
		numericId: 6,
		name: 'システム関係費',
		type: 'expense',
		color: '#9B59B6',
		description: 'システム利用料、サブスクリプション費用',
	},
	{
		id: 'books',
		numericId: 8,
		name: '書籍代',
		type: 'expense',
		color: '#1E8BC3',
		description: '書籍、電子書籍、雑誌',
	},

	{
		id: 'health',
		numericId: 10,
		name: '健康・フィットネス',
		type: 'expense',
		color: '#96CEB4',
		description: '医療費、薬代、ジム、スポーツ',
	},
	{
		id: 'shopping',
		numericId: 11,
		name: '買い物',
		type: 'expense',
		color: '#F39C12',
		description: '衣類、日用品、雑貨',
	},

	{
		id: 'other_expense',
		numericId: 12,
		name: 'その他',
		type: 'expense',
		color: '#FFEAA7',
		description: 'その他の支出',
	},
]

/**
 * 収入カテゴリ設定
 *
 * ⚠️ 注意: numericIdは既存データとの整合性を保つため、絶対に変更しないでください
 */
export const INCOME_CATEGORIES: CategoryConfig[] = []

/**
 * 全カテゴリ設定
 */
export const ALL_CATEGORIES: CategoryConfig[] = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]

/**
 * カテゴリタイプ別の設定取得
 */
export function getCategoriesByType(type: CategoryType): CategoryConfig[] {
	return EXPENSE_CATEGORIES
}

/**
 * IDによるカテゴリ検索
 */
export function getCategoryById(id: string): CategoryConfig | undefined {
	return ALL_CATEGORIES.find((category) => category.id === id)
}

/**
 * カテゴリ名による検索
 */
export function getCategoryByName(name: string): CategoryConfig | undefined {
	return ALL_CATEGORIES.find((category) => category.name === name)
}

/**
 * カテゴリ選択用オプション生成
 */
export function getCategoryOptions(type?: CategoryType): Array<{
	value: string
	label: string
	color: string
}> {
	const categories = type ? getCategoriesByType(type) : ALL_CATEGORIES

	return categories.map((category) => ({
		value: category.id,
		label: category.name,
		color: category.color,
	}))
}

/**
 * デフォルトカテゴリの取得
 */
export function getDefaultCategory(type: CategoryType): CategoryConfig {
	return EXPENSE_CATEGORIES[0]
}

/**
 * カテゴリ設定の妥当性検証
 */
export function validateCategoryConfig(): boolean {
	const allIds = ALL_CATEGORIES.map((c) => c.id)
	const uniqueIds = [...new Set(allIds)]

	// ID重複チェック
	if (allIds.length !== uniqueIds.length) {
		const duplicates = allIds.filter((id, index) => allIds.indexOf(id) !== index)
		console.error('Duplicate category IDs found:', duplicates)
		return false
	}

	// 必須フィールドチェック
	const invalidCategories = ALL_CATEGORIES.filter(
		(category) => !category.id || !category.name || !category.type || !category.color
	)

	if (invalidCategories.length > 0) {
		console.error('Invalid category configuration found:', invalidCategories)
		return false
	}

	// 色の形式チェック
	const invalidColors = ALL_CATEGORIES.filter(
		(category) => !category.color.match(/^#[0-9A-F]{6}$/i)
	)

	if (invalidColors.length > 0) {
		console.error('Invalid color format found:', invalidColors)
		return false
	}

	// タイプの妥当性チェック
	const invalidTypes = ALL_CATEGORIES.filter(
		(category) => category.type !== 'expense'
	)

	if (invalidTypes.length > 0) {
		console.error('Invalid category types found:', invalidTypes)
		return false
	}

	return true
}
