/**
 * APIロガーシステム
 *
 * Saifuu家計管理アプリケーションのAPIロギングシステム
 * Cloudflare Workers環境での高性能な構造化ログ機能を提供
 *
 * 主な機能：
 * - 構造化ログによる分析・検索の容易性
 * - 環境別最適化（開発・本番）
 * - パフォーマンス最適化（バッファリング・非同期処理）
 * - 豊富なユーティリティ関数
 * - 拡張可能なトランスポートシステム
 */

// 設定関連のエクスポート
export {
	configToString,
	createLoggerConfig,
	DEFAULT_CONFIG,
	getLogLevelValue,
	shouldLog,
	validateConfig,
} from './config'
// コアロガーのエクスポート
export { CloudflareLogger } from './core/cloudflare-logger'
// ファクトリー関数のエクスポート
/**
 * デフォルトロガーインスタンス取得
 *
 * アプリケーションの主要なエントリーポイント
 * 環境変数から自動的に設定を構築
 *
 * 使用例：
 * ```typescript
 * import { getDefaultLogger } from './logger';
 * const logger = getDefaultLogger(env);
 * logger.info('アプリケーションが開始されました');
 * ```
 *
 * @param env 環境変数オブジェクト
 * @returns 設定済みロガーインスタンス
 */
export {
	createLogger,
	createLogger as getDefaultLogger,
	getLoggerConfig,
	getLoggerIfInitialized,
	getLoggerInstance,
	isLoggerInitialized,
	resetLogger,
	safeLog,
	updateLoggerConfig,
} from './factory'
// トランスポートのエクスポート
export {
	ConsoleTransport,
	createConsoleTransport,
} from './transports/console-transport'
// 型定義のエクスポート
export type {
	LogEntry,
	LogFilter,
	LogFormatter,
	Logger,
	LoggerConfig,
	LogLevel,
	LogMeta,
	LogTransport,
} from './types'
// ユーティリティ関数のエクスポート
export {
	conditionalLog,
	logApiRequest,
	logDatabaseOperation,
	logError,
	logPropertyChange,
	measureAndLog,
	measureAndLogSync,
	safeStringify,
	truncateString,
} from './utils'

/**
 * 使用例とガイドライン
 *
 * 基本的な使用方法：
 * ```typescript
 * import { createLogger } from './logger';
 *
 * const logger = createLogger(env);
 * logger.info('操作が完了しました', { userId: '123', duration: 500 });
 * ```
 *
 * パフォーマンス測定：
 * ```typescript
 * import { measureAndLog } from './logger';
 *
 * const result = await measureAndLog(
 *   logger,
 *   'データベース操作',
 *   () => db.query.subscriptions.findMany(),
 *   { operationType: 'read' }
 * );
 * ```
 *
 * エラーハンドリング：
 * ```typescript
 * import { logError } from './logger';
 *
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   logError(logger, error, 'リスキー操作が失敗しました');
 * }
 * ```
 *
 * 環境変数の設定：
 * ```bash
 * # 開発環境
 * NODE_ENV=development
 * LOG_LEVEL=debug
 * LOG_BUFFER_SIZE=10
 * LOG_FLUSH_INTERVAL=1000
 *
 * # 本番環境
 * NODE_ENV=production
 * LOG_LEVEL=info
 * LOG_BUFFER_SIZE=100
 * LOG_FLUSH_INTERVAL=10000
 * ```
 */

/**
 * ログレベルガイドライン
 *
 * DEBUG: 詳細なデバッグ情報
 * - 関数の入出力詳細
 * - 内部状態の変化
 * - 開発環境でのみ出力
 *
 * INFO: 正常な操作の記録
 * - CRUD操作の完了
 * - ヘルスチェック結果
 * - 重要な状態変化
 *
 * WARN: 回復可能なエラー・警告
 * - リトライ処理
 * - パフォーマンス劣化
 * - 非推奨機能の使用
 *
 * ERROR: システムエラー・失敗
 * - データベース接続失敗
 * - 認証・認可エラー
 * - 予期しない例外
 *
 * FATAL: 致命的なエラー
 * - システム停止レベル
 * - 復旧不可能なエラー
 * - 重要なシステム障害
 */
