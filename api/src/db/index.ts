import { drizzle } from 'drizzle-orm/d1'
import * as schema from './schema'

// Cloudflare Workers環境の型定義
export interface Env {
	DB: D1Database
}

// データベース接続を初期化する関数
// 開発環境ではローカルのD1を使用し、本番環境では本番D1を使用
export function createDatabase(binding: D1Database) {
	return drizzle(binding, { schema })
}

// 型推論のためのデータベース型
export type Database = ReturnType<typeof createDatabase>
export { schema }
