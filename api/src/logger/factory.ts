import { createLoggerConfig, validateConfig } from './config'
import { CloudflareLogger } from './core/cloudflare-logger'
import type { Logger, LoggerConfig } from './types'

/**
 * ロガーファクトリー
 *
 * Cloudflare Workers環境での統一的なロガー管理を提供
 * - シングルトンパターンによる単一インスタンス管理
 * - 環境別の設定の自動切り替え
 * - フォールバック機能による堅牢性の確保
 * - エラー時の適切なフォールバック
 */

// モジュールレベルでの状態管理
let loggerInstance: Logger | null = null
let loggerConfig: LoggerConfig | null = null

/**
 * ロガーインスタンスを取得
 *
 * 初回作成時には環境変数が必要
 * 以降は作成済みのインスタンスを返す
 *
 * @param env 環境変数（初回作成時のみ必要）
 * @returns ロガーインスタンス
 */
export function getLoggerInstance(env?: Record<string, unknown>): Logger {
	if (!loggerInstance) {
		if (!env) {
			throw new Error('環境変数がロガーの初期化に必要です')
		}

		try {
			// 設定の作成と検証
			loggerConfig = validateConfig(createLoggerConfig(env))

			// ロガーインスタンスの作成
			loggerInstance = new CloudflareLogger(loggerConfig)

			// 初期化完了ログ
			loggerInstance.info('ロガーシステムが初期化されました', {
				environment: loggerConfig.environment,
				level: loggerConfig.level,
				version: loggerConfig.version,
			})
		} catch (error) {
			console.error('ロガーの初期化に失敗しました:', error)

			// フォールバックインスタンスの作成
			loggerInstance = createFallbackLogger()
			loggerInstance.error('ロガーの初期化に失敗しました', {
				error: error instanceof Error ? error.message : String(error),
			})
		}
	}

	return loggerInstance
}

/**
 * フォールバックロガーの作成
 *
 * 通常の初期化が失敗した場合に使用
 * 最低限の機能を提供する簡易ロガー
 */
function createFallbackLogger(): Logger {
	const fallbackConfig: LoggerConfig = {
		environment: 'development',
		level: 'info',
		bufferSize: 10,
		flushInterval: 1000,
		version: '1.0.0',
	}

	return new CloudflareLogger(fallbackConfig)
}

/**
 * ロガーインスタンスをリセット
 *
 * テスト時やアプリケーション再起動時に使用
 * 既存のインスタンスを適切にクリーンアップ
 */
export function resetLogger(): void {
	if (loggerInstance) {
		// CloudflareLoggerのクリーンアップ
		if ('destroy' in loggerInstance) {
			;(loggerInstance as CloudflareLogger).destroy()
		}

		loggerInstance = null
	}

	loggerConfig = null
}

/**
 * 現在の設定を取得
 *
 * デバッグ・監視目的で使用
 * 設定内容の確認や問題の診断に有用
 */
export function getLoggerConfig(): LoggerConfig | null {
	return loggerConfig
}

/**
 * ロガーが初期化済みかを確認
 *
 * 条件付きログ出力の実装に使用
 * 初期化前のログ出力エラーを防ぐ
 */
export function isLoggerInitialized(): boolean {
	return loggerInstance !== null
}

/**
 * 設定を更新
 *
 * 実行時の設定変更に使用
 * 注意：既存のインスタンスは破棄され、新しいインスタンスが作成される
 */
export function updateLoggerConfig(newConfig: LoggerConfig): void {
	// 既存のインスタンスをクリーンアップ
	resetLogger()

	// 新しい設定で再初期化
	loggerConfig = validateConfig(newConfig)
	loggerInstance = new CloudflareLogger(loggerConfig)

	loggerInstance.info('ロガー設定が更新されました', {
		environment: loggerConfig.environment,
		level: loggerConfig.level,
		version: loggerConfig.version,
	})
}

/**
 * ロガーインスタンスを取得するヘルパー関数
 *
 * より簡潔な記述を可能にするヘルパー関数
 * アプリケーションコード内での使用を推奨
 *
 * @param env 環境変数（初回作成時のみ必要）
 * @returns ロガーインスタンス
 */
export const createLogger = (env?: Record<string, unknown>): Logger => {
	return getLoggerInstance(env)
}

/**
 * 現在のロガーインスタンスを取得（初期化済みの場合のみ）
 *
 * 初期化前の呼び出しではnullを返す
 * エラーハンドリングが不要な場合に使用
 *
 * @returns ロガーインスタンスまたはnull
 */
export const getLoggerIfInitialized = (): Logger | null => {
	return loggerInstance
}

/**
 * 安全なログ出力関数群
 *
 * 初期化前でもエラーにならない安全なログ出力
 * 外部モジュールや初期化前のコードでの使用を推奨
 */
export const safeLog = {
	debug: (message: string, meta?: Record<string, unknown>) => {
		const logger = getLoggerIfInitialized()
		if (logger) logger.debug(message, meta)
	},

	info: (message: string, meta?: Record<string, unknown>) => {
		const logger = getLoggerIfInitialized()
		if (logger) logger.info(message, meta)
	},

	warn: (message: string, meta?: Record<string, unknown>) => {
		const logger = getLoggerIfInitialized()
		if (logger) logger.warn(message, meta)
	},

	error: (message: string, meta?: Record<string, unknown>) => {
		const logger = getLoggerIfInitialized()
		if (logger) {
			logger.error(message, meta)
		} else {
			// フォールバック: 初期化前のエラーはconsole.errorに出力
			console.error(`[ERROR] ${message}`, meta)
		}
	},
}
