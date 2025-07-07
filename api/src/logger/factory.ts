/**
 * ロガーファクトリー
 *
 * ロガーインスタンスの作成・管理を行うファクトリークラス
 * シングルトンパターンによる効率的なインスタンス管理
 * 環境変数からの設定自動構築
 */

import { createLoggerConfig, validateConfig } from './config'
import { CloudflareLogger } from './core/cloudflare-logger'
import { Logger, LoggerConfig } from './types'

/**
 * ロガーファクトリークラス
 *
 * 設計原則：
 * - シングルトンパターンによる単一インスタンス管理
 * - 環境変数からの自動設定構築
 * - テスト時のリセット機能
 * - エラー時の適切なフォールバック
 */
export class LoggerFactory {
	private static instance: Logger | null = null
	private static config: LoggerConfig | null = null

	/**
	 * ロガーインスタンスを取得
	 *
	 * 初回作成時には環境変数が必要
	 * 以降は作成済みのインスタンスを返す
	 *
	 * @param env 環境変数（初回作成時のみ必要）
	 * @returns ロガーインスタンス
	 */
	static getInstance(env?: any): Logger {
		if (!LoggerFactory.instance) {
			if (!env) {
				throw new Error('環境変数がロガーの初期化に必要です')
			}

			try {
				// 設定の作成と検証
				LoggerFactory.config = validateConfig(createLoggerConfig(env))

				// ロガーインスタンスの作成
				LoggerFactory.instance = new CloudflareLogger(LoggerFactory.config)

				// 初期化完了ログ
				LoggerFactory.instance.info('ロガーシステムが初期化されました', {
					environment: LoggerFactory.config.environment,
					level: LoggerFactory.config.level,
					version: LoggerFactory.config.version,
				})
			} catch (error) {
				console.error('ロガーの初期化に失敗しました:', error)

				// フォールバックインスタンスの作成
				LoggerFactory.instance = LoggerFactory.createFallbackLogger()
				LoggerFactory.instance.error('ロガーの初期化に失敗しました', {
					error: error instanceof Error ? error.message : String(error),
				})
			}
		}

		return LoggerFactory.instance
	}

	/**
	 * フォールバックロガーの作成
	 *
	 * 通常の初期化が失敗した場合に使用
	 * 最低限の機能を提供する簡易ロガー
	 */
	private static createFallbackLogger(): Logger {
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
	static reset(): void {
		if (LoggerFactory.instance) {
			// CloudflareLoggerのクリーンアップ
			if ('destroy' in LoggerFactory.instance) {
				;(LoggerFactory.instance as CloudflareLogger).destroy()
			}

			LoggerFactory.instance = null
		}

		LoggerFactory.config = null
	}

	/**
	 * 現在の設定を取得
	 *
	 * デバッグ・監視目的で使用
	 * 設定内容の確認や問題の診断に有用
	 */
	static getConfig(): LoggerConfig | null {
		return LoggerFactory.config
	}

	/**
	 * ロガーが初期化済みかを確認
	 *
	 * 条件付きログ出力の実装に使用
	 * 初期化前のログ出力エラーを防ぐ
	 */
	static isInitialized(): boolean {
		return LoggerFactory.instance !== null
	}

	/**
	 * 設定を更新
	 *
	 * 実行時の設定変更に使用
	 * 注意：既存のインスタンスは破棄され、新しいインスタンスが作成される
	 */
	static updateConfig(newConfig: LoggerConfig): void {
		// 既存のインスタンスをクリーンアップ
		LoggerFactory.reset()

		// 新しい設定で再初期化
		LoggerFactory.config = validateConfig(newConfig)
		LoggerFactory.instance = new CloudflareLogger(LoggerFactory.config)

		LoggerFactory.instance.info('ロガー設定が更新されました', {
			environment: LoggerFactory.config.environment,
			level: LoggerFactory.config.level,
			version: LoggerFactory.config.version,
		})
	}
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
export const createLogger = (env?: any): Logger => {
	return LoggerFactory.getInstance(env)
}

/**
 * ロガーの初期化チェック付きヘルパー関数
 *
 * 初期化されていない場合はnullを返す
 * エラーを発生させたくない場合に使用
 *
 * @returns ロガーインスタンスまたはnull
 */
export const getLoggerIfInitialized = (): Logger | null => {
	return LoggerFactory.isInitialized() ? LoggerFactory.getInstance() : null
}

/**
 * 安全なログ出力ヘルパー関数
 *
 * ロガーが初期化されていない場合は無視
 * 条件付きログ出力の実装に使用
 */
export const safeLog = {
	debug: (message: string, meta?: any) => {
		const logger = getLoggerIfInitialized()
		if (logger) logger.debug(message, meta)
	},

	info: (message: string, meta?: any) => {
		const logger = getLoggerIfInitialized()
		if (logger) logger.info(message, meta)
	},

	warn: (message: string, meta?: any) => {
		const logger = getLoggerIfInitialized()
		if (logger) logger.warn(message, meta)
	},

	error: (message: string, meta?: any) => {
		const logger = getLoggerIfInitialized()
		if (logger) logger.error(message, meta)
	},

	fatal: (message: string, meta?: any) => {
		const logger = getLoggerIfInitialized()
		if (logger) logger.fatal(message, meta)
	},
}
