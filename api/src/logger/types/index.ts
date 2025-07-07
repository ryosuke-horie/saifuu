/**
 * APIロガーの型定義
 *
 * Cloudflare Workers環境での高性能な構造化ログ機能を提供するための型定義
 */

/**
 * ログメタデータ構造
 *
 * APIリクエストとレスポンスに関連する追加情報を構造化して保存
 * 開発・運用時のデバッグとトラブルシューティングを効率化
 */
export interface LogMeta {
	/** リクエスト一意識別子 - トレーシングに使用 */
	requestId?: string

	/** ユーザー識別子 - 認証後のユーザーIDを記録 */
	userId?: string

	/** 操作の種類 - データベース操作の分類 */
	operationType?: 'read' | 'write' | 'delete'

	/** 処理時間（ミリ秒） - パフォーマンス監視に使用 */
	duration?: number

	/** APIパス - リクエストされたエンドポイント */
	path?: string

	/** HTTPメソッド - GET, POST, PUT, DELETE等 */
	method?: string

	/** HTTPステータスコード - レスポンスステータス */
	statusCode?: number

	/** 追加データ - 任意の構造化データ */
	data?: Record<string, any>

	/** 追加のキー・バリューペア - 柔軟なメタデータ拡張 */
	[key: string]: any
}

/**
 * ログレベル
 *
 * 各ログの重要度を表現
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/**
 * ログエントリ
 *
 * 実際にログとして記録される完全な構造
 */
export interface LogEntry {
	/** ログ生成時刻 - ISO 8601形式 */
	timestamp: string

	/** ログレベル */
	level: LogLevel

	/** ログメッセージ */
	message: string

	/** リクエスト識別子 */
	requestId: string

	/** 実行環境 */
	environment: 'development' | 'production'

	/** サービス名 */
	service: 'saifuu-api'

	/** アプリケーションバージョン */
	version: string

	/** メタデータ */
	meta: LogMeta
}

/**
 * ロガーインターフェース
 *
 * 各ログレベルでのログ出力メソッドを定義
 */
export interface Logger {
	/** デバッグレベル - 詳細なデバッグ情報 */
	debug(message: string, meta?: LogMeta): void

	/** 情報レベル - 正常な操作の記録 */
	info(message: string, meta?: LogMeta): void

	/** 警告レベル - 回復可能なエラー */
	warn(message: string, meta?: LogMeta): void

	/** エラーレベル - システムエラー */
	error(message: string, meta?: LogMeta): void
}

/**
 * ロガー設定
 *
 * 環境別のロガー動作設定
 */
export interface LoggerConfig {
	/** 実行環境 */
	environment: 'development' | 'production'

	/** 最小ログレベル */
	level: LogLevel

	/** バッファサイズ - 本番環境でのバッチ処理用 */
	bufferSize: number

	/** フラッシュ間隔（ミリ秒） - バッファクリア頻度 */
	flushInterval: number

	/** アプリケーションバージョン */
	version: string
}
