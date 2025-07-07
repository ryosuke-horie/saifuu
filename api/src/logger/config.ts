/**
 * ログ設定システム
 *
 * 環境変数からロガー設定を生成し、ログレベルの制御を行う
 * 開発環境と本番環境で異なる最適化を適用
 */

import { LoggerConfig, LogLevel } from './types'

/**
 * 環境変数からロガー設定を生成
 *
 * 開発環境と本番環境で異なるデフォルト値を設定
 * 詳細なデバッグ情報は開発環境のみ、本番環境では最適化を重視
 *
 * @param env 環境変数オブジェクト
 * @returns ロガー設定
 */
export const createLoggerConfig = (env: any): LoggerConfig => {
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
 *
 * レベル比較に使用する数値を返す
 * 低い値ほど詳細なログレベル
 *
 * @param level ログレベル
 * @returns 数値（0-4）
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
		case 'fatal':
			return 4
		default:
			return 1 // デフォルトはinfo
	}
}

/**
 * 現在のログレベルで出力すべきかを判定
 *
 * 設定されたレベル以上のログのみ出力する
 * 例：設定がinfoの場合、debug は出力されない
 *
 * @param currentLevel 現在設定されているログレベル
 * @param targetLevel 出力対象のレベル
 * @returns 出力すべきかどうか
 */
export const shouldLog = (currentLevel: LogLevel, targetLevel: LogLevel): boolean => {
	return getLogLevelValue(targetLevel) >= getLogLevelValue(currentLevel)
}

/**
 * 環境別のデフォルト設定
 *
 * 開発環境：詳細なデバッグ情報、高頻度なフラッシュ
 * 本番環境：パフォーマンス最適化、バッファリング重視
 */
export const DEFAULT_CONFIG = {
	development: {
		level: 'debug' as LogLevel,
		bufferSize: 10,
		flushInterval: 1000,
	},
	production: {
		level: 'info' as LogLevel,
		bufferSize: 50,
		flushInterval: 5000,
	},
} as const

/**
 * 設定値の妥当性チェック
 *
 * 不正な設定値を検出し、適切なデフォルト値にフォールバック
 * システムの安定性を保つための防御的プログラミング
 *
 * @param config 検証対象の設定
 * @returns 検証・修正後の設定
 */
export const validateConfig = (config: LoggerConfig): LoggerConfig => {
	const validLevels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'fatal']

	// ログレベルの検証
	if (!validLevels.includes(config.level)) {
		console.warn(`Invalid log level: ${config.level}, defaulting to 'info'`)
		config.level = 'info'
	}

	// バッファサイズの検証
	if (config.bufferSize < 1 || config.bufferSize > 1000) {
		console.warn(`Invalid buffer size: ${config.bufferSize}, defaulting to 50`)
		config.bufferSize = 50
	}

	// フラッシュ間隔の検証
	if (config.flushInterval < 100 || config.flushInterval > 60000) {
		console.warn(`Invalid flush interval: ${config.flushInterval}, defaulting to 5000`)
		config.flushInterval = 5000
	}

	return config
}

/**
 * 設定情報の文字列化
 *
 * デバッグ目的での設定内容確認用
 * 機密情報は含まれないため、ログ出力も安全
 *
 * @param config ロガー設定
 * @returns 設定情報の文字列
 */
export const configToString = (config: LoggerConfig): string => {
	return JSON.stringify(
		{
			environment: config.environment,
			level: config.level,
			bufferSize: config.bufferSize,
			flushInterval: config.flushInterval,
			version: config.version,
		},
		null,
		2
	)
}
