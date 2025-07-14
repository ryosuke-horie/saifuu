import type { NewSubscription, NewTransaction } from '../../db/schema'

/**
 * テスト用データフィクスチャ
 * テストで使用するサンプルデータを定義
 */

/**
 * テスト用カテゴリデータ
 * 設定ファイルベースのカテゴリに移行したため、カテゴリ作成のテストデータは不要
 */

/**
 * テスト用サブスクリプションデータ
 */
export const testSubscriptions = {
	netflix: {
		name: 'Netflix',
		amount: 1980,
		billingCycle: 'monthly' as const,
		nextBillingDate: new Date('2024-02-01').toISOString(),
		categoryId: 1,
		description: '動画ストリーミングサービス',
		isActive: true,
		createdAt: new Date('2024-01-01').toISOString(),
		updatedAt: new Date('2024-01-01').toISOString(),
	} satisfies NewSubscription,

	spotify: {
		name: 'Spotify Premium',
		amount: 980,
		billingCycle: 'monthly' as const,
		nextBillingDate: new Date('2024-02-15').toISOString(),
		categoryId: 1,
		description: '音楽ストリーミングサービス',
		isActive: true,
		createdAt: new Date('2024-01-15').toISOString(),
		updatedAt: new Date('2024-01-15').toISOString(),
	} satisfies NewSubscription,

	github: {
		name: 'GitHub Pro',
		amount: 4,
		billingCycle: 'monthly' as const,
		nextBillingDate: new Date('2024-02-10').toISOString(),
		categoryId: 2,
		description: '開発ツール',
		isActive: true,
		createdAt: new Date('2024-01-10').toISOString(),
		updatedAt: new Date('2024-01-10').toISOString(),
	} satisfies NewSubscription,

	inactive: {
		name: 'Inactive Service',
		amount: 500,
		billingCycle: 'monthly' as const,
		nextBillingDate: new Date('2024-02-20').toISOString(),
		categoryId: 1,
		description: '停止中のサービス',
		isActive: false,
		createdAt: new Date('2024-01-20').toISOString(),
		updatedAt: new Date('2024-01-25').toISOString(),
	} satisfies NewSubscription,
}

/**
 * テスト用取引データ
 */
export const testTransactions = {
	groceries: {
		amount: 3500,
		type: 'expense' as const,
		categoryId: 1,
		description: '食材の買い物',
		date: new Date('2024-01-01').toISOString(),
		createdAt: new Date('2024-01-01').toISOString(),
		updatedAt: new Date('2024-01-01').toISOString(),
	} satisfies NewTransaction,

	salary: {
		amount: 300000,
		type: 'income' as const,
		categoryId: 3,
		description: '月給',
		date: new Date('2024-01-25').toISOString(),
		createdAt: new Date('2024-01-25').toISOString(),
		updatedAt: new Date('2024-01-25').toISOString(),
	} satisfies NewTransaction,
}

/**
 * 無効なデータパターン（バリデーションテスト用）
 */
export const invalidSubscriptionData = {
	missingName: {
		amount: 1000,
		billingCycle: 'monthly' as const,
		nextBillingDate: new Date('2024-02-01'),
		categoryId: 1,
		isActive: true,
	},

	negativeAmount: {
		name: 'Test Service',
		amount: -1000,
		billingCycle: 'monthly' as const,
		nextBillingDate: new Date('2024-02-01'),
		categoryId: 1,
		isActive: true,
	},

	invalidBillingCycle: {
		name: 'Test Service',
		amount: 1000,
		billingCycle: 'invalid' as unknown as 'monthly',
		nextBillingDate: new Date('2024-02-01'),
		categoryId: 1,
		isActive: true,
	},

	pastDate: {
		name: 'Test Service',
		amount: 1000,
		billingCycle: 'monthly' as const,
		nextBillingDate: new Date('2020-01-01'),
		categoryId: 1,
		isActive: true,
	},
}

/**
 * 無効な取引データパターン（バリデーションテスト用）
 */
export const invalidTransactionData = {
	missingAmount: {
		type: 'expense' as const,
		categoryId: 1,
		description: '金額が不足',
		date: new Date('2024-01-01').toISOString(),
	},

	negativeAmount: {
		amount: -1000,
		type: 'expense' as const,
		categoryId: 1,
		description: '負の金額',
		date: new Date('2024-01-01').toISOString(),
	},

	invalidType: {
		amount: 1000,
		type: 'invalid' as unknown as 'expense',
		categoryId: 1,
		description: '無効な種別',
		date: new Date('2024-01-01').toISOString(),
	},

	invalidDate: {
		amount: 1000,
		type: 'expense' as const,
		categoryId: 1,
		description: '無効な日付',
		date: 'invalid-date',
	},
}

/**
 * テスト用のHTTPリクエストペイロード
 */
export const testRequestPayloads = {
	createSubscription: testSubscriptions.netflix,
	updateSubscription: {
		name: 'Netflix Premium',
		amount: 2200,
		description: 'Netflix Premium Plan',
	},
	createTransaction: testTransactions.groceries,
	updateTransaction: {
		amount: 4000,
		description: 'スーパーマーケット',
	},
}
