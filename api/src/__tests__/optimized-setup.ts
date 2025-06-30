/**
 * 最適化されたテストセットアップファイル
 * データベース初期化の効率化とテスト実行パフォーマンスの向上を目的とする
 */

import { createDatabase } from '../db'
import { categories, subscriptions, transactions } from '../db/schema'

// Test environment type (compatible with ProvidedEnv from 'cloudflare:test')
interface TestEnv {
	DB: D1Database
}

// データベース初期化状態のキャッシュ（テスト実行中の重複初期化を防ぐ）
let isDbInitialized = false
let initializationPromise: Promise<void> | null = null

/**
 * データベーステーブルが存在するかをチェックする関数
 * 最適化: より効率的なテーブル存在チェック
 */
async function checkTablesExist(d1: D1Database): Promise<boolean> {
	try {
		// 各テーブルの存在を直接チェック（より効率的）
		const requiredTables = ['categories', 'transactions', 'subscriptions']

		for (const tableName of requiredTables) {
			try {
				// より軽量なテーブル存在チェック
				const result = await d1.prepare(`PRAGMA table_info(${tableName})`).all()
				if (!result.success || !result.results || result.results.length === 0) {
					console.log(`Table ${tableName} does not exist`)
					return false
				}
			} catch (error) {
				console.log(`Error checking table ${tableName}:`, error)
				return false
			}
		}

		console.log('All required tables exist')
		return true
	} catch (error) {
		console.log('Error in checkTablesExist:', error)
		// エラーが発生した場合はテーブルが存在しないと判断
		return false
	}
}

/**
 * データベーステーブルを作成する関数
 * 最適化: バッチ実行とエラーハンドリングの改善
 */
async function createTables(d1: D1Database): Promise<void> {
	// テーブル作成SQLの配列（マイグレーションファイルと完全一致）
	const createTableStatements = [
		// 1. カテゴリテーブル（他テーブルから参照される）
		`CREATE TABLE IF NOT EXISTS \`categories\` (
			\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
			\`name\` text NOT NULL,
			\`type\` text NOT NULL,
			\`color\` text,
			\`created_at\` integer NOT NULL,
			\`updated_at\` integer NOT NULL
		)`,
		// 2. サブスクリプションテーブル（マイグレーションファイルの順序に従う）
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
		// 3. トランザクションテーブル（マイグレーションファイルの順序に従う）
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

	// 各テーブルを順次作成（外部キー制約の順序を保持）
	for (const [index, statement] of createTableStatements.entries()) {
		try {
			console.log(`Creating table ${index + 1}...`)
			const result = await d1.prepare(statement).run()
			if (!result.success) {
				console.error(`Failed to create table ${index + 1}: ${result.error}`)
				throw new Error(`Failed to create table ${index + 1}: ${result.error}`)
			}
			console.log(`Successfully created table ${index + 1}`)
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error)
			// 既存テーブルのエラーは無視、その他は報告
			if (
				!errorMessage.includes('already exists') &&
				!errorMessage.includes('table already exists')
			) {
				console.error(`Table creation error for statement ${index + 1}:`, error)
				throw error
			}
			console.log(`Table ${index + 1} already exists, skipping`)
		}
	}
}

/**
 * データベース初期化の同期化
 * 複数のテストが同時にデータベース初期化を試みることを防ぐ
 */
async function ensureDatabaseInitialized(env: TestEnv): Promise<void> {
	if (isDbInitialized) {
		return
	}

	// 既に初期化プロセスが進行中の場合は、それを待つ
	if (initializationPromise) {
		await initializationPromise
		return
	}

	// 初期化プロセスを開始
	initializationPromise = (async () => {
		const tablesExist = await checkTablesExist(env.DB)
		if (!tablesExist) {
			await createTables(env.DB)
		}
		isDbInitialized = true
	})()

	await initializationPromise
	initializationPromise = null
}

/**
 * テスト用のモックD1データベースを作成（最適化版）
 * 重複する初期化処理を削減し、テスト実行を高速化
 */
export async function createTestDatabase(env: TestEnv) {
	// データベース初期化の同期化
	await ensureDatabaseInitialized(env)

	const db = createDatabase(env.DB)

	// テーブルの初期化（テスト実行前にクリーンな状態にする）
	// 最適化: バッチでクリーンアップを実行
	try {
		// 外部キー制約を考慮した順序で削除
		await Promise.all([
			db
				.delete(subscriptions)
				.execute()
				.catch(() => {}), // エラーを無視
			db
				.delete(transactions)
				.execute()
				.catch(() => {}),
		])
		// カテゴリは最後に削除（外部キー制約）
		await db
			.delete(categories)
			.execute()
			.catch(() => {})
	} catch (error) {
		// クリーンアップエラーは警告として記録するが、テストは継続
		console.warn('Database cleanup warning:', error)
	}

	return db
}

/**
 * テスト用のデータベース接続を取得（テーブルクリアしない）
 * 既存のデータを保持したまま、データベース操作を行う場合に使用（最適化版）
 */
export async function getTestDatabase(env: TestEnv) {
	// データベース初期化の同期化
	await ensureDatabaseInitialized(env)

	return createDatabase(env.DB)
}

/**
 * テスト用のサンプルカテゴリデータ
 * 最適化: タイムスタンプの標準化
 */
export const mockCategories = [
	{
		id: 1,
		name: 'テスト収入カテゴリ',
		type: 'income' as const,
		color: '#4CAF50',
		createdAt: new Date('2024-01-01T00:00:00.000Z'),
		updatedAt: new Date('2024-01-01T00:00:00.000Z'),
	},
	{
		id: 2,
		name: 'テスト支出カテゴリ',
		type: 'expense' as const,
		color: '#F44336',
		createdAt: new Date('2024-01-01T00:00:00.000Z'),
		updatedAt: new Date('2024-01-01T00:00:00.000Z'),
	},
] as const

/**
 * テスト用のサンプル取引データ
 * 最適化: タイムスタンプの標準化
 */
export const mockTransactions = [
	{
		id: 1,
		amount: 50000,
		type: 'income' as const,
		categoryId: 1,
		description: 'テスト給与',
		date: new Date('2024-01-15T00:00:00.000Z'),
		createdAt: new Date('2024-01-15T00:00:00.000Z'),
		updatedAt: new Date('2024-01-15T00:00:00.000Z'),
	},
	{
		id: 2,
		amount: 3000,
		type: 'expense' as const,
		categoryId: 2,
		description: 'テスト昼食代',
		date: new Date('2024-01-16T00:00:00.000Z'),
		createdAt: new Date('2024-01-16T00:00:00.000Z'),
		updatedAt: new Date('2024-01-16T00:00:00.000Z'),
	},
] as const

/**
 * テスト用のサンプルサブスクリプションデータ
 * 最適化: タイムスタンプの標準化
 */
export const mockSubscriptions = [
	{
		id: 1,
		name: 'テストサブスク',
		amount: 1000,
		billingCycle: 'monthly' as const,
		nextBillingDate: new Date('2024-02-01T00:00:00.000Z'),
		categoryId: 2,
		description: 'テスト用定期支払い',
		isActive: true,
		createdAt: new Date('2024-01-01T00:00:00.000Z'),
		updatedAt: new Date('2024-01-01T00:00:00.000Z'),
	},
] as const

/**
 * テストデータをデータベースに挿入するヘルパー関数（最適化版）
 * バッチ挿入でパフォーマンスを向上
 */
export async function seedTestData(env: TestEnv) {
	const db = await createTestDatabase(env)

	try {
		// カテゴリデータの挿入（バッチ処理）
		const categoryInserts = mockCategories.map((category) =>
			db.insert(categories).values({
				name: category.name,
				type: category.type,
				color: category.color,
				createdAt: category.createdAt,
				updatedAt: category.updatedAt,
			})
		)
		await Promise.all(categoryInserts)

		// 取引データの挿入（バッチ処理）
		const transactionInserts = mockTransactions.map((transaction) =>
			db.insert(transactions).values({
				amount: transaction.amount,
				type: transaction.type,
				categoryId: transaction.categoryId,
				description: transaction.description,
				date: transaction.date,
				createdAt: transaction.createdAt,
				updatedAt: transaction.updatedAt,
			})
		)
		await Promise.all(transactionInserts)

		// サブスクリプションデータの挿入（バッチ処理）
		const subscriptionInserts = mockSubscriptions.map((subscription) =>
			db.insert(subscriptions).values({
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
		)
		await Promise.all(subscriptionInserts)
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
 * APIレスポンスの検証ヘルパー（最適化版）
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

/**
 * テスト実行時間の測定ヘルパー
 * パフォーマンス監視用
 */
export class TestTimer {
	private startTime: number

	constructor() {
		this.startTime = performance.now()
	}

	elapsed(): number {
		return performance.now() - this.startTime
	}

	reset(): void {
		this.startTime = performance.now()
	}
}

/**
 * データベース初期化状態をリセットする関数
 * テストスイート間での状態リセット用
 */
export function resetDatabaseInitializationState(): void {
	isDbInitialized = false
	initializationPromise = null
}
