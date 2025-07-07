/**
 * APIロガーの型定義
 *
 * Cloudflare Workers環境での高性能ログ機能を提供するための型定義
 * 構造化ログによる分析・検索の容易性を実現
 */

/**
 * ログレベルの定義
 *
 * debug: 詳細なデバッグ情報（開発環境のみ）
 * info: 正常な操作の記録
 * warn: 回復可能なエラー・警告
 * error: システムエラー・失敗
 * fatal: 致命的なエラー（システム停止レベル）
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

/**
 * ログメタデータの型定義
 *
 * APIリクエストに関連する追加情報を格納
 * 構造化ログによる分析・検索の効率化を実現
 */
export interface LogMeta {
	/** リクエストID（トレーシング用） */
	requestId?: string
	/** ユーザーID（認証済みリクエストの場合） */
	userId?: string
	/** 操作の種類（read/write/delete） */
	operationType?: 'read' | 'write' | 'delete'
	/** 処理時間（ミリ秒） */
	duration?: number
	/** APIパス */
	path?: string
	/** HTTPメソッド */
	method?: string
	/** HTTPステータスコード */
	statusCode?: number
	/** 追加のデータ（リクエストボディ、レスポンスデータ等） */
	data?: Record<string, unknown>
	/** エラーメッセージ */
	error?: string
	/** スタックトレース */
	stack?: string
	/** その他の任意のメタデータ */
	[key: string]: unknown
}

/**
 * ログエントリの構造定義
 *
 * 全てのログが従う統一フォーマット
 * 検索・分析の容易性を実現するための標準化された構造
 */
export interface LogEntry {
	/** ログの生成時刻（ISO 8601形式） */
	timestamp: string
	/** ログレベル */
	level: LogLevel
	/** ログメッセージ */
	message: string
	/** リクエストID（トレーシング用） */
	requestId: string
	/** 実行環境（development/production） */
	environment: 'development' | 'production'
	/** サービス名（固定値: saifuu-api） */
	service: 'saifuu-api'
	/** アプリケーションバージョン */
	version: string
	/** 追加のメタデータ */
	meta: LogMeta
}

/**
 * ログ設定の型定義
 *
 * 環境に応じたログ動作のカスタマイズを可能にする
 * パフォーマンス最適化とCloudflare Workers制約への対応
 */
export interface LoggerConfig {
	/** 実行環境 */
	environment: 'development' | 'production'
	/** 最小出力レベル */
	level: LogLevel
	/** バッファサイズ（本番環境でのバッチ処理用） */
	bufferSize: number
	/** バッファフラッシュ間隔（ミリ秒） */
	flushInterval: number
	/** アプリケーションバージョン */
	version: string
}

/**
 * ロガーインターフェース
 *
 * 全てのロガー実装が従う共通インターフェース
 * デバッグからエラー対応まで、統一的なログ出力を提供
 *
 * 設計原則：
 * - シンプルで直感的なAPI
 * - 高パフォーマンス（Cloudflare Workers制約対応）
 * - 構造化ログによる分析容易性
 * - 環境に応じた最適化
 */
export interface Logger {
	/**
	 * DEBUGレベルのログを出力
	 *
	 * 詳細なデバッグ情報を記録
	 * 開発環境でのみ出力される
	 *
	 * @param message ログメッセージ
	 * @param meta 追加のメタデータ
	 */
	debug(message: string, meta?: LogMeta): void

	/**
	 * INFOレベルのログを出力
	 *
	 * 正常な操作の記録
	 * CRUD操作の完了、ヘルスチェック結果等
	 *
	 * @param message ログメッセージ
	 * @param meta 追加のメタデータ
	 */
	info(message: string, meta?: LogMeta): void

	/**
	 * WARNレベルのログを出力
	 *
	 * 回復可能なエラー・警告
	 * リトライ処理、パフォーマンス劣化等
	 *
	 * @param message ログメッセージ
	 * @param meta 追加のメタデータ
	 */
	warn(message: string, meta?: LogMeta): void

	/**
	 * ERRORレベルのログを出力
	 *
	 * システムエラー・失敗
	 * データベース接続失敗、認証・認可エラー等
	 *
	 * @param message ログメッセージ
	 * @param meta 追加のメタデータ
	 */
	error(message: string, meta?: LogMeta): void

	/**
	 * FATALレベルのログを出力
	 *
	 * 致命的なエラー（システム停止レベル）
	 * 復旧不可能なエラー、重要なシステム障害等
	 *
	 * @param message ログメッセージ
	 * @param meta 追加のメタデータ
	 */
	fatal(message: string, meta?: LogMeta): void
}

/**
 * ログ出力先の型定義
 *
 * 将来的な拡張性を考慮した設計
 * 現在はコンソール出力のみ、今後外部サービス連携も可能
 */
export interface LogTransport {
	/** ログエントリの出力処理 */
	write(entry: LogEntry): Promise<void>
	/** 出力先のクリーンアップ */
	close?(): Promise<void>
}

/**
 * ログフィルターの型定義
 *
 * ログ出力の条件制御
 * 環境、レベル、メタデータによる柔軟なフィルタリング
 */
export interface LogFilter {
	/** フィルタリング条件の判定 */
	shouldLog(entry: LogEntry): boolean
}

/**
 * ログフォーマッターの型定義
 *
 * ログエントリの出力形式をカスタマイズ
 * 環境に応じた最適な出力形式を提供
 */
export interface LogFormatter {
	/** ログエントリの文字列フォーマット */
	format(entry: LogEntry): string
}
