/**
 * テストセットアップファイル
 * Cloudflare Workers環境でのテスト実行に必要な共通設定を提供
 */

import { createDatabase } from '../db'

// Test environment type (compatible with ProvidedEnv from 'cloudflare:test')
interface TestEnv {
	DB: D1Database
}

import { categories, subscriptions, transactions } from '../db/schema'

/**
 * データベーステーブルが存在するかをチェックする関数
 */
async function checkTablesExist(d1: D1Database): Promise<boolean> {
	try {
		const result = await d1
			.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
			.all()

		const tableNames = result.results?.map((row) => (row as { name: string }).name) || []
		const requiredTables = ['categories', 'transactions', 'subscriptions']

		return requiredTables.every((table) => tableNames.includes(table))
	} catch (_error) {
		// エラーが発生した場合はテーブルが存在しないと判断
		return false
	}
}

/**
 * データベーステーブルを作成する関数
 * マイグレーションSQLを使用してテーブルを作成
 * 実際のmigrationファイルと完全に一致するSQLを使用
 */
async function createTables(d1: D1Database): Promise<void> {
	// 0000_unknown_lilith.sqlの実際の内容を使用（バックティックを使用）
	const migrationStatements = [
		`CREATE TABLE IF NOT EXISTS \`categories\` (
			\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
			\`name\` text NOT NULL,
			\`type\` text NOT NULL,
			\`color\` text,
			\`created_at\` integer NOT NULL,
			\`updated_at\` integer NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS \`subscriptions\` (
			\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
			\`name\` text NOT NULL,
			\`amount\` real NOT NULL,
			\`billing_cycle\` text DEFAULT 'monthly' NOT NULL,
			\`next_billing_date\` integer NOT NULL,
			\`category_id\` integer,
			\`description\` text,
			\`is_active\` integer DEFAULT true NOT NULL,
			\`created_at\` integer NOT NULL,
			\`updated_at\` integer NOT NULL,
			FOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE no action
		)`,
		`CREATE TABLE IF NOT EXISTS \`transactions\` (
			\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
			\`amount\` real NOT NULL,
			\`type\` text NOT NULL,
			\`category_id\` integer,
			\`description\` text,
			\`date\` integer NOT NULL,
			\`created_at\` integer NOT NULL,
			\`updated_at\` integer NOT NULL,
			FOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE no action
		)`,
	]

	// 各ステートメントを順番に実行
	for (const statement of migrationStatements) {
		try {
			const result = await d1.prepare(statement).run()
			if (!result.success) {
				console.warn(`Table creation failed: ${result.error}`)
			}
		} catch (error) {
			// CREATE TABLE IF NOT EXISTS なので、既に存在する場合のエラーは無視
			// しかし、その他のエラーは報告
			const errorMessage = error instanceof Error ? error.message : String(error)
			if (
				!errorMessage.includes('already exists') &&
				!errorMessage.includes('table categories already exists')
			) {
				console.error('Table creation error:', error)
				throw error
			}
		}
	}
}

/**
 * テスト用のデータベースが正しく初期化されているかを確認し、必要に応じて修正する
 * より安全で確実なテーブル作成を行う
 */
export async function ensureTestDatabaseInitialized(env: TestEnv): Promise<void> {
	// まずテーブル存在チェック
	const tablesExist = await checkTablesExist(env.DB)

	if (!tablesExist) {
		// テーブルが存在しない場合は作成
		await createTables(env.DB)

		// 作成後に再度チェック
		const tablesExistAfter = await checkTablesExist(env.DB)
		if (!tablesExistAfter) {
			throw new Error('Failed to create required database tables for testing')
		}
	}
}

/**
 * テスト用のモックD1データベースを作成
 * Cloudflare Workers のvitest環境では実際のD1インスタンスが提供される
 * より堅牢なテーブル作成とクリーンアップを実装
 */
export async function createTestDatabase(env: TestEnv) {
	// データベース初期化を確実に実行
	await ensureTestDatabaseInitialized(env)

	const db = createDatabase(env.DB)

	// テーブルの初期化（テスト実行前にクリーンな状態にする）
	// D1では外部キー制約を考慮した順序で削除
	try {
		// 外部キー制約がある場合は子テーブルから削除
		await db.delete(subscriptions).execute()
		await db.delete(transactions).execute()
		await db.delete(categories).execute()
	} catch (error) {
		// テーブルが存在しない場合などのエラーは無視
		// ただし、ログに記録して状況を把握できるようにする
		const errorMessage = error instanceof Error ? error.message : String(error)
		if (!errorMessage.includes('no such table')) {
			console.warn('Database cleanup warning:', error)
		}
	}

	return db
}

/**
 * テスト用のデータベース接続を取得（テーブルクリアしない）
 * 既存のデータを保持したまま、データベース操作を行う場合に使用
 */
export async function getTestDatabase(env: TestEnv) {
	// データベース初期化を確実に実行
	await ensureTestDatabaseInitialized(env)

	return createDatabase(env.DB)
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
 * より堅牢なエラーハンドリングを実装
 */
export async function seedTestData(env: TestEnv) {
	const db = await createTestDatabase(env)

	try {
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
	} catch (error) {
		console.error('Failed to seed test data:', error)
		throw error
	}

	return db
}

/**
 * HTTPレスポンスの型定義（テスト用）
 */
export interface TestResponse {
	status: number
	json: () => Promise<unknown>
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
