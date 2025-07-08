/**
 * ログレベルの定義
 * debug: 詳細なデバッグ情報（開発環境のみ）
 * info: 正常な操作の記録
 * warn: 回復可能なエラー・警告
 * error: システムエラー・失敗
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/**
 * ログメタデータの型定義
 * APIリクエストに関連する追加情報を格納
 */
export interface LogMeta {
	requestId?: string
	userId?: string
	operationType?: 'read' | 'write' | 'delete'
	duration?: number
	path?: string
	method?: string
	statusCode?: number
	data?: Record<string, unknown>
	error?: string
	stack?: string
	[key: string]: unknown
}

/**
 * ログエントリの構造定義
 * 全てのログが従う統一フォーマット
 */
export interface LogEntry {
	timestamp: string
	level: LogLevel
	message: string
	requestId: string
	environment: 'development' | 'production'
	service: 'saifuu-api'
	version: string
	meta: LogMeta
}

/**
 * ログ設定の型定義
 */
export interface LoggerConfig {
	environment: 'development' | 'production'
	level: LogLevel
	bufferSize: number
	flushInterval: number
	version: string
}

/**
 * ロガーインターフェース
 * 全てのロガー実装が従う共通インターフェース
 */
export interface Logger {
	debug(message: string, meta?: LogMeta): void
	info(message: string, meta?: LogMeta): void
	warn(message: string, meta?: LogMeta): void
	error(message: string, meta?: LogMeta): void
}
