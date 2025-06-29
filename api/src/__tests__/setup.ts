/**
 * テストセットアップファイル
 * Cloudflare Workers環境でのテスト実行に必要な共通設定を提供
 */

import { createDatabase, type Env } from '../db'
import { categories, transactions, subscriptions } from '../db/schema'

/**
 * テスト用のモックD1データベースを作成
 * Cloudflare Workers のvitest環境では実際のD1インスタンスが提供される
 */
export async function createTestDatabase(env: Env) {
	const db = createDatabase(env.DB)
	
	// テーブルの初期化（テスト実行前にクリーンな状態にする）
	// D1では外部キー制約を考慮した順序で削除
	try {
		await db.delete(subscriptions)
		await db.delete(transactions) 
		await db.delete(categories)
	} catch (error) {
		// テーブルが存在しない場合やその他のエラーは無視
		console.warn('Database cleanup warning:', error)
	}
	
	return db
}

/**
 * テスト用のサンプルカテゴリデータ
 */
export const mockCategories = [
	{
		id: 1,
		name: 'テスト収入カテゴリ',
		type: 'income' as const,
		color: '#4CAF50',
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-01'),
	},
	{
		id: 2,
		name: 'テスト支出カテゴリ',
		type: 'expense' as const,
		color: '#F44336',
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-01'),
	},
] as const

/**
 * テスト用のサンプル取引データ
 */
export const mockTransactions = [
	{
		id: 1,
		amount: 50000,
		type: 'income' as const,
		categoryId: 1,
		description: 'テスト給与',
		date: new Date('2024-01-15'),
		createdAt: new Date('2024-01-15'),
		updatedAt: new Date('2024-01-15'),
	},
	{
		id: 2,
		amount: 3000,
		type: 'expense' as const,
		categoryId: 2,
		description: 'テスト昼食代',
		date: new Date('2024-01-16'),
		createdAt: new Date('2024-01-16'),
		updatedAt: new Date('2024-01-16'),
	},
] as const

/**
 * テスト用のサンプルサブスクリプションデータ
 */
export const mockSubscriptions = [
	{
		id: 1,
		name: 'テストサブスク',
		amount: 1000,
		billingCycle: 'monthly' as const,
		nextBillingDate: new Date('2024-02-01'),
		categoryId: 2,
		description: 'テスト用定期支払い',
		isActive: true,
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-01'),
	},
] as const

/**
 * テストデータをデータベースに挿入するヘルパー関数
 */
export async function seedTestData(env: Env) {
	const db = await createTestDatabase(env)
	
	// カテゴリデータの挿入
	for (const category of mockCategories) {
		await db.insert(categories).values({
			name: category.name,
			type: category.type,
			color: category.color,
			createdAt: category.createdAt,
			updatedAt: category.updatedAt,
		})
	}
	
	// 取引データの挿入
	for (const transaction of mockTransactions) {
		await db.insert(transactions).values({
			amount: transaction.amount,
			type: transaction.type,
			categoryId: transaction.categoryId,
			description: transaction.description,
			date: transaction.date,
			createdAt: transaction.createdAt,
			updatedAt: transaction.updatedAt,
		})
	}
	
	// サブスクリプションデータの挿入
	for (const subscription of mockSubscriptions) {
		await db.insert(subscriptions).values({
			name: subscription.name,
			amount: subscription.amount,
			billingCycle: subscription.billingCycle,
			nextBillingDate: subscription.nextBillingDate,
			categoryId: subscription.categoryId,
			description: subscription.description,
			isActive: subscription.isActive,
			createdAt: subscription.createdAt,
			updatedAt: subscription.updatedAt,
		})
	}
	
	return db
}

/**
 * HTTPレスポンスの型定義（テスト用）
 */
export interface TestResponse {
	status: number
	json: () => Promise<any>
	text: () => Promise<string>
}

/**
 * APIレスポンスの検証ヘルパー
 */
export function expectSuccessResponse(response: TestResponse) {
	if (response.status < 200 || response.status >= 300) {
		throw new Error(`Expected success status, but got ${response.status}`)
	}
}

export function expectErrorResponse(response: TestResponse, expectedStatus: number) {
	if (response.status !== expectedStatus) {
		throw new Error(`Expected status ${expectedStatus}, but got ${response.status}`)
	}
}