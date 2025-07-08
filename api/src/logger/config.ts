import { LoggerConfig, LogLevel } from './types'

/**
 * 環境変数の型定義
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
 * 環境変数からロガー設定を生成
 * @param env 環境変数オブジェクト
 * @returns ロガー設定
 */
export const createLoggerConfig = (env: EnvironmentVariables): LoggerConfig => {
	const isDevelopment = env.NODE_ENV === 'development'

	return {
		environment: isDevelopment ? 'development' : 'production',
		level: (env.LOG_LEVEL as LogLevel) || (isDevelopment ? 'debug' : 'info'),
		bufferSize: Number(env.LOG_BUFFER_SIZE) || (isDevelopment ? 10 : 50),
		flushInterval: Number(env.LOG_FLUSH_INTERVAL) || (isDevelopment ? 1000 : 5000),
		version: env.VERSION || '1.0.0',
	}
}

/**
 * ログレベルの数値変換
 * レベル比較に使用
 */
export const getLogLevelValue = (level: LogLevel): number => {
	switch (level) {
		case 'debug':
			return 0
		case 'info':
			return 1
		case 'warn':
			return 2
		case 'error':
			return 3
		default:
			return 1
	}
}

/**
 * 現在のログレベルで出力すべきかを判定
 * @param currentLevel 現在のログレベル
 * @param targetLevel 出力対象のレベル
 * @returns 出力すべきかどうか
 */
export const shouldLog = (currentLevel: LogLevel, targetLevel: LogLevel): boolean => {
	return getLogLevelValue(targetLevel) >= getLogLevelValue(currentLevel)
}
