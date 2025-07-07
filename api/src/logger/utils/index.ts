/**
 * ログユーティリティ関数
 *
 * ログ処理に関する汎用的な関数群
 * パフォーマンス測定、エラー処理、デバッグ支援機能を提供
 */

import { Logger, LogMeta } from '../types'

/**
 * 関数の実行時間を計測してログに記録
 *
 * パフォーマンス監視とボトルネック特定に使用
 * 成功・失敗を問わず実行時間を記録
 *
 * @param logger ロガーインスタンス
 * @param operationName 操作名
 * @param fn 実行する関数
 * @param meta 追加のメタデータ
 * @returns 関数の実行結果
 */
export const measureAndLog = async <T>(
	logger: Logger,
	operationName: string,
	fn: () => Promise<T>,
	meta: LogMeta = {}
): Promise<T> => {
	const startTime = Date.now()

	logger.debug(`${operationName} を開始`, {
		...meta,
		operationName,
		startTime: new Date(startTime).toISOString(),
	})

	try {
		const result = await fn()
		const duration = Date.now() - startTime

		logger.info(`${operationName} が完了`, {
			...meta,
			operationName,
			duration,
			success: true,
		})

		return result
	} catch (error) {
		const duration = Date.now() - startTime

		logger.error(`${operationName} が失敗`, {
			...meta,
			operationName,
			duration,
			success: false,
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		})

		throw error
	}
}

/**
 * 同期関数の実行時間を計測してログに記録
 *
 * 同期処理用のmeasureAndLog関数
 *
 * @param logger ロガーインスタンス
 * @param operationName 操作名
 * @param fn 実行する関数
 * @param meta 追加のメタデータ
 * @returns 関数の実行結果
 */
export const measureAndLogSync = <T>(
	logger: Logger,
	operationName: string,
	fn: () => T,
	meta: LogMeta = {}
): T => {
	const startTime = Date.now()

	logger.debug(`${operationName} を開始`, {
		...meta,
		operationName,
		startTime: new Date(startTime).toISOString(),
	})

	try {
		const result = fn()
		const duration = Date.now() - startTime

		logger.info(`${operationName} が完了`, {
			...meta,
			operationName,
			duration,
			success: true,
		})

		return result
	} catch (error) {
		const duration = Date.now() - startTime

		logger.error(`${operationName} が失敗`, {
			...meta,
			operationName,
			duration,
			success: false,
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		})

		throw error
	}
}

/**
 * エラーを安全にログに記録
 *
 * 様々な形式のエラーを統一的に処理
 * 機密情報の除去とスタックトレースの安全な出力
 *
 * @param logger ロガーインスタンス
 * @param error エラーオブジェクト
 * @param message 追加のメッセージ
 * @param meta 追加のメタデータ
 */
export const logError = (
	logger: Logger,
	error: unknown,
	message = 'エラーが発生しました',
	meta: LogMeta = {}
): void => {
	const errorMeta: LogMeta = {
		...meta,
		error: error instanceof Error ? error.message : String(error),
		errorType: error instanceof Error ? error.constructor.name : typeof error,
	}

	// スタックトレースの追加（Errorオブジェクトの場合）
	if (error instanceof Error && error.stack) {
		errorMeta.stack = error.stack
	}

	// 特定のエラータイプの処理
	if (error instanceof TypeError) {
		errorMeta.errorCategory = 'type_error'
	} else if (error instanceof RangeError) {
		errorMeta.errorCategory = 'range_error'
	} else if (error instanceof ReferenceError) {
		errorMeta.errorCategory = 'reference_error'
	} else {
		errorMeta.errorCategory = 'unknown_error'
	}

	logger.error(message, errorMeta)
}

/**
 * 条件付きログ出力
 *
 * 特定の条件を満たす場合のみログを出力
 * デバッグ時の詳細なログ制御に使用
 *
 * @param logger ロガーインスタンス
 * @param condition 出力条件
 * @param level ログレベル
 * @param message メッセージ
 * @param meta メタデータ
 */
export const conditionalLog = (
	logger: Logger,
	condition: boolean,
	level: 'debug' | 'info' | 'warn' | 'error' | 'fatal',
	message: string,
	meta: LogMeta = {}
): void => {
	if (condition) {
		logger[level](message, meta)
	}
}

/**
 * オブジェクトのプロパティ変更をログに記録
 *
 * データベース更新時やステート変更時の追跡に使用
 * 変更前後の値を比較して差分を記録
 *
 * @param logger ロガーインスタンス
 * @param objectName オブジェクト名
 * @param oldValue 変更前の値
 * @param newValue 変更後の値
 * @param meta 追加のメタデータ
 */
export const logPropertyChange = (
	logger: Logger,
	objectName: string,
	oldValue: any,
	newValue: any,
	meta: LogMeta = {}
): void => {
	const changes: Record<string, any> = {}

	// プリミティブ値の場合
	if (typeof oldValue !== 'object' || typeof newValue !== 'object') {
		changes.oldValue = oldValue
		changes.newValue = newValue
	} else {
		// オブジェクトの場合は差分を計算
		const oldKeys = Object.keys(oldValue || {})
		const newKeys = Object.keys(newValue || {})
		const allKeys = [...new Set([...oldKeys, ...newKeys])]

		for (const key of allKeys) {
			const oldVal = oldValue?.[key]
			const newVal = newValue?.[key]

			if (oldVal !== newVal) {
				changes[key] = {
					from: oldVal,
					to: newVal,
				}
			}
		}
	}

	logger.info(`${objectName} が変更されました`, {
		...meta,
		objectName,
		changes,
	})
}

/**
 * APIリクエストの詳細をログに記録
 *
 * HTTPリクエストの詳細情報を構造化して記録
 * デバッグとモニタリングに使用
 *
 * @param logger ロガーインスタンス
 * @param method HTTPメソッド
 * @param path リクエストパス
 * @param statusCode レスポンスステータスコード
 * @param meta 追加のメタデータ
 */
export const logApiRequest = (
	logger: Logger,
	method: string,
	path: string,
	statusCode: number,
	meta: LogMeta = {}
): void => {
	const isError = statusCode >= 400
	const level = isError ? 'error' : 'info'
	const message = isError ? 'APIリクエストでエラーが発生' : 'APIリクエストが完了'

	logger[level](message, {
		...meta,
		method,
		path,
		statusCode,
		operationType: getOperationTypeFromMethod(method),
	})
}

/**
 * HTTPメソッドから操作タイプを判定
 *
 * RESTful APIの操作タイプを統一的に分類
 *
 * @param method HTTPメソッド
 * @returns 操作タイプ
 */
const getOperationTypeFromMethod = (method: string): 'read' | 'write' | 'delete' => {
	switch (method.toUpperCase()) {
		case 'GET':
			return 'read'
		case 'DELETE':
			return 'delete'
		case 'POST':
		case 'PUT':
		case 'PATCH':
			return 'write'
		default:
			return 'read'
	}
}

/**
 * データベース操作をログに記録
 *
 * データベースの CRUD 操作を統一的に記録
 * パフォーマンス監視とデバッグに使用
 *
 * @param logger ロガーインスタンス
 * @param operation 操作タイプ
 * @param table テーブル名
 * @param meta 追加のメタデータ
 */
export const logDatabaseOperation = (
	logger: Logger,
	operation: 'create' | 'read' | 'update' | 'delete',
	table: string,
	meta: LogMeta = {}
): void => {
	logger.info(`データベース操作: ${operation}`, {
		...meta,
		operation,
		table,
		operationType: operation === 'read' ? 'read' : 'write',
	})
}

/**
 * 文字列の長さを制限
 *
 * ログメッセージの長さを制限して出力を制御
 * 大きなデータのログ出力時に使用
 *
 * @param str 対象の文字列
 * @param maxLength 最大長
 * @returns 制限された文字列
 */
export const truncateString = (str: string, maxLength = 1000): string => {
	if (str.length <= maxLength) {
		return str
	}

	return str.substring(0, maxLength) + '...'
}

/**
 * 安全なJSON文字列化
 *
 * 循環参照エラーを回避したJSON文字列化
 * ログ出力時の安全性を確保
 *
 * @param obj 対象のオブジェクト
 * @returns JSON文字列
 */
export const safeStringify = (obj: any): string => {
	try {
		return JSON.stringify(obj, null, 2)
	} catch (error) {
		try {
			// 循環参照の回避
			const seen = new WeakSet()
			return JSON.stringify(
				obj,
				(key, value) => {
					if (typeof value === 'object' && value !== null) {
						if (seen.has(value)) {
							return '[Circular]'
						}
						seen.add(value)
					}
					return value
				},
				2
			)
		} catch (fallbackError) {
			return '[Unserializable Object]'
		}
	}
}
