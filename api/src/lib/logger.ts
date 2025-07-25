import type { Context } from 'hono'
import type { LogMeta } from '../logger/types'
import { getLogger, getRequestId, type LoggingVariables } from '../middleware/logging'

/**
 * ログコンテキストの型定義
 */
export interface LogContext {
	resource: string
	operation: string
	meta?: LogMeta
}

/**
 * リクエストログのオプション
 */
export interface RequestLogOptions extends LogContext {
	message?: string
}

/**
 * リクエストロガーインターフェース
 */
export interface RequestLogger {
	success(result?: any): void
	error(error: Error | unknown): void
	warn(message: string, meta?: LogMeta): void
}

// 定数定義
const READ_OPERATIONS = ['list', 'get', 'find', 'findMany', 'findOne', 'count', 'stats'] as const
const DELETE_OPERATIONS = ['delete', 'remove', 'destroy'] as const

const RESOURCE_NAME_MAP: Record<string, string> = {
	subscriptions: 'サブスクリプション',
	transactions: '取引',
	categories: 'カテゴリ',
	test: 'test',
	items: 'items',
	workflow: 'workflow',
	workflow_data: 'workflow_data',
} as const

const OPERATION_NAME_MAP: Record<string, string> = {
	list: '一覧取得',
	get: 'get',
	create: '作成',
	update: '更新',
	delete: '削除',
	findMany: '一覧取得',
	findOne: '詳細取得',
	insert: '登録',
	stats: '統計取得',
	execute: 'execute',
	process: 'process',
} as const

/**
 * 操作タイプを判定する
 */
function getOperationType(operation: string): 'read' | 'write' | 'delete' {
	const operationLower = operation.toLowerCase()

	if (READ_OPERATIONS.some((op) => operationLower.includes(op))) {
		return 'read'
	}
	if (DELETE_OPERATIONS.some((op) => operationLower.includes(op))) {
		return 'delete'
	}
	return 'write'
}

/**
 * リソース名を日本語に変換
 */
function getResourceName(resource: string): string {
	return RESOURCE_NAME_MAP[resource] || resource
}

/**
 * 操作名を日本語に変換
 */
function getOperationName(operation: string): string {
	return OPERATION_NAME_MAP[operation] || operation
}

/**
 * エラー詳細を抽出するヘルパー関数
 */
function extractErrorDetails(error: Error | unknown): { error: string; stack?: string } {
	if (error instanceof Error) {
		return { error: error.message, stack: error.stack }
	}
	return { error: String(error) }
}

/**
 * ログメッセージを生成する汎用関数
 */
function generateLogMessage(resource: string, operation: string, suffix: string): string {
	const resourceName = getResourceName(resource)
	const operationName = getOperationName(operation)
	return `${resourceName}${operationName}${suffix}`
}

/**
 * 開始メッセージを生成
 */
function generateStartMessage(resource: string, operation: string, customMessage?: string): string {
	return customMessage || generateLogMessage(resource, operation, 'を開始')
}

/**
 * 完了メッセージを生成
 */
function generateCompleteMessage(resource: string, operation: string): string {
	return generateLogMessage(resource, operation, 'が完了')
}

/**
 * エラーメッセージを生成
 */
function generateErrorMessage(resource: string, operation: string): string {
	return generateLogMessage(resource, operation, 'でエラーが発生')
}

/**
 * リクエスト処理のロギングユーティリティ
 * 開始、成功、エラーを一貫した形式で記録
 */
export function createRequestLogger<E extends { Variables: LoggingVariables }>(
	context: Context<E>,
	options: RequestLogOptions
): RequestLogger {
	const logger = getLogger(context)
	const requestId = getRequestId(context)
	const { resource, operation, meta = {}, message } = options
	const operationType = getOperationType(operation)

	// 開始ログ
	const startMessage = generateStartMessage(resource, operation, message)
	logger.info(startMessage, {
		...meta,
		requestId,
		operationType,
		resource,
		operation,
	})

	return {
		success(result?: any): void {
			const completeMessage = generateCompleteMessage(resource, operation)
			logger.info(completeMessage, {
				...meta,
				requestId,
				resource,
				operation,
				result,
			})
		},

		error(error: Error | unknown): void {
			const errorMessage = generateErrorMessage(resource, operation)
			const errorDetails = extractErrorDetails(error)

			logger.error(errorMessage, {
				...meta,
				...errorDetails,
				requestId,
				resource,
				operation,
			})
		},

		warn(warningMessage: string, additionalMeta?: LogMeta): void {
			const fullMessage = `${getResourceName(resource)}${getOperationName(operation)}: ${warningMessage}`
			logger.warn(fullMessage, {
				...meta,
				...additionalMeta,
				requestId,
				resource,
				operation,
			})
		},
	}
}

/**
 * データベース操作のロギングラッパー
 * 実行時間の計測とエラーハンドリングを含む
 */
export async function logDatabaseOperation<T, E extends { Variables: LoggingVariables }>(
	context: Context<E>,
	resource: string,
	operation: string,
	dbOperation: () => Promise<T>,
	input?: any
): Promise<T> {
	const logger = getLogger(context)
	const requestId = getRequestId(context)
	const operationType = getOperationType(operation)
	const startTime = Date.now()

	// 開始ログ
	logger.info(`データベース操作を開始: ${resource}.${operation}`, {
		requestId,
		resource,
		operation,
		operationType,
		input,
	})

	try {
		const result = await dbOperation()
		const duration = Date.now() - startTime

		// 成功ログ
		logger.info(`データベース操作が完了: ${resource}.${operation}`, {
			requestId,
			resource,
			operation,
			operationType,
			duration,
			result,
		})

		return result
	} catch (error) {
		const duration = Date.now() - startTime
		const errorDetails = extractErrorDetails(error)

		// エラーログ
		logger.error(`データベース操作でエラーが発生: ${resource}.${operation}`, {
			...errorDetails,
			requestId,
			resource,
			operation,
			operationType,
			duration,
			input,
		})

		throw error
	}
}

/**
 * バリデーションエラーのロギング
 * フィールドレベルのエラー詳細を記録
 */
export function logValidationError<E extends { Variables: LoggingVariables }>(
	context: Context<E>,
	resource: string,
	operation: string,
	errors: Array<{ field: string; message: string }>,
	additionalMeta?: LogMeta
): void {
	const logger = getLogger(context)
	const requestId = getRequestId(context)

	logger.warn(`バリデーションエラー: ${resource}.${operation}`, {
		requestId,
		resource,
		operation,
		validationErrors: errors,
		errorCount: errors.length,
		...additionalMeta,
	})
}
