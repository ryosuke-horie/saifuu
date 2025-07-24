import { CloudflareLogger } from './cloudflare-logger'
import { createLoggerConfig } from './config'
import { Logger, LoggerConfig } from './types'

/**
 * 環境変数の型定義（config.tsから再利用のため再定義）
 */
interface EnvironmentVariables {
	NODE_ENV?: string
	LOG_LEVEL?: string
	LOG_BUFFER_SIZE?: string
	LOG_FLUSH_INTERVAL?: string
	VERSION?: string
	[key: string]: string | undefined
}

/**
 * ロガーインスタンスの作成・管理
 */
// biome-ignore lint/complexity/noStaticOnlyClass: Factory pattern requires static-only class for singleton management
export class LoggerFactory {
	private static instance: Logger | null = null
	private static config: LoggerConfig | null = null

	/**
	 * ロガーインスタンスを取得
	 * @param env 環境変数（初回作成時のみ必要）
	 * @returns ロガーインスタンス
	 */
	static getInstance(env?: EnvironmentVariables): Logger {
		if (!LoggerFactory.instance) {
			if (!env) {
				throw new Error('Environment variables required for logger initialization')
			}

			LoggerFactory.config = createLoggerConfig(env)
			LoggerFactory.instance = new CloudflareLogger(LoggerFactory.config)
		}

		return LoggerFactory.instance
	}

	/**
	 * ロガーインスタンスをリセット
	 * テスト時に使用
	 */
	static reset(): void {
		if (LoggerFactory.instance && 'destroy' in LoggerFactory.instance) {
			;(LoggerFactory.instance as CloudflareLogger).destroy()
		}
		LoggerFactory.instance = null
		LoggerFactory.config = null
	}

	/**
	 * 現在の設定を取得
	 */
	static getConfig(): LoggerConfig | null {
		return LoggerFactory.config
	}
}

/**
 * ロガーインスタンスを取得するヘルパー関数
 */
export const createLogger = (env?: EnvironmentVariables): Logger => {
	return LoggerFactory.getInstance(env)
}

/**
 * テスト用のロガーインスタンス
 */
export const testLogger: Logger = {
	debug: () => {},
	info: () => {},
	warn: () => {},
	error: () => {},
}
