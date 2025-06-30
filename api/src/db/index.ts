import { drizzle } from 'drizzle-orm/d1'
import * as schema from './schema'

// Cloudflare Workers環境の型定義
export interface Env {
	DB: D1Database
}

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
 * 必要なデータベーステーブルを作成する関数
 * 本番環境では通常マイグレーションで作成されているが、
 * テスト環境では動的に作成する必要がある
 */
async function ensureTablesExist(d1: D1Database): Promise<void> {
	const tablesExist = await checkTablesExist(d1)

	if (!tablesExist) {
		// マイグレーションSQLと完全に一致するテーブル作成SQL
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
					// テスト環境以外では警告を出さない（本番では通常マイグレーションで作成済み）
					if (process.env.NODE_ENV === 'test') {
						console.warn(`Table creation failed: ${result.error}`)
					}
				}
			} catch (error) {
				// CREATE TABLE IF NOT EXISTS なので、既に存在する場合のエラーは無視
				const errorMessage = error instanceof Error ? error.message : String(error)
				if (
					!errorMessage.includes('already exists') &&
					!errorMessage.includes('table categories already exists')
				) {
					// テスト環境以外では致命的なエラーとして扱わない
					if (process.env.NODE_ENV === 'test') {
						throw error
					}
				}
			}
		}
	}
}

// データベース接続を初期化する関数
// 開発環境ではローカルのD1を使用し、本番環境では本番D1を使用
// テスト環境では必要に応じてテーブルを自動作成
export function createDatabase(binding: D1Database) {
	return drizzle(binding, { schema })
}

/**
 * テスト環境を検出する関数
 * Cloudflare Workers環境では様々な方法で検出する
 */
function isTestEnvironment(): boolean {
	// 複数の条件で検出
	try {
		return (
			process.env.NODE_ENV === 'test' ||
			(globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV ===
				'test' ||
			typeof (globalThis as Record<string, unknown>).VITEST !== 'undefined' ||
			typeof (globalThis as Record<string, unknown>).__VITEST__ !== 'undefined' ||
			// Vitestの実行コンテキストを検出
			typeof (globalThis as Record<string, unknown>).vi !== 'undefined'
		)
	} catch {
		return false
	}
}

/**
 * テスト環境対応のデータベース作成関数
 * テーブルの存在を確認し、必要に応じて作成してからDrizzleインスタンスを返す
 */
export async function createDatabaseWithTables(binding: D1Database) {
	await ensureTablesExist(binding)
	return drizzle(binding, { schema })
}

/**
 * 環境に応じたデータベース作成
 * テスト環境では自動的にテーブル作成を行い、本番環境では通常のcreateDatabase
 */
export async function createDatabaseForEnvironment(binding: D1Database) {
	if (isTestEnvironment()) {
		return await createDatabaseWithTables(binding)
	}
	return createDatabase(binding)
}

// 型推論のためのデータベース型
export type Database = ReturnType<typeof createDatabase>
export { schema }
