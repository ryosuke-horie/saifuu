// D1対応版のデータベース接続モジュール

import type { D1Database } from '@cloudflare/workers-types'
import { drizzle } from 'drizzle-orm/d1'
import * as schema from './schema'

// Cloudflare Workers環境の型定義
export interface Env {
	DB: D1Database
}

// データベース接続を初期化する関数
// 開発環境・本番環境の両方でCloudflare D1を使用
export function createDatabase(binding: D1Database) {
	return drizzle(binding, { schema })
}

// 開発環境用のD1データベース接続
// wranglerが作成するローカルD1インスタンスを使用
export function createDevDatabase(binding: D1Database) {
	return drizzle(binding, { schema })
}

// テスト用のデータベース接続（統合テスト用）
export function createTestDatabase(binding: D1Database) {
	return drizzle(binding, { schema })
}

// 型推論のためのデータベース型
export type Database = ReturnType<typeof createDatabase>
export type DevDatabase = ReturnType<typeof createDevDatabase>
export type TestDatabase = ReturnType<typeof createTestDatabase>

// 共通のデータベースインターフェース
// D1環境で統一された型定義
// Drizzleの型システムを活用した型安全なデータベース操作
export type CommonDatabase = ReturnType<typeof createDatabase>

// 型安全性を保ちつつ、実行時の柔軟性を提供
// テスト環境などで使用される汎用的なデータベース型
export type AnyDatabase = Database | DevDatabase | TestDatabase

export { schema }
