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

// リソース名の日本語マッピング
// プロダクション用リソースは日本語、テスト・開発用リソースは英語のまま維持
const RESOURCE_NAME_MAP: Record<string, string> = {
	// プロダクション用リソース
	subscriptions: 'サブスクリプション',
	transactions: '取引',
	categories: 'カテゴリ',
	// テスト・開発用リソース（英語のまま維持）
	test: 'test',
	items: 'items',
	workflow: 'workflow',
	workflow_data: 'workflow_data',
} as const

// 操作名の日本語マッピング
// 主要な操作は日本語化、開発・デバッグ用操作は英語のまま維持
const OPERATION_NAME_MAP: Record<string, string> = {
	// 基本CRUD操作
	list: '一覧取得',
	get: '詳細取得',
	create: '作成',
	update: '更新',
	delete: '削除',
	// データベース操作
	findMany: '一覧取得',
	findOne: '詳細取得',
	insert: '登録',
	// 集計・分析操作
	stats: '統計取得',
	// 開発・デバッグ用操作（英語のまま維持）
	execute: 'execute',
	process: 'process',
} as const

/**
 * 操作タイプを判定する
 *
 * 設計意図: ログの分類と分析を効率化するため、操作を3つのタイプに分類
 * - read: 参照系操作（分析用、レスポンスタイム監視）
 * - write: 更新系操作（データ整合性監視、パフォーマンス追跡）
 * - delete: 削除系操作（監査ログ、重要操作の追跡）
 *
 * 代替案検討:
 * 1. HTTPメソッドベースでの判定 → リソース操作名の方が意味的に正確
 * 2. より細かい分類（create/update分離）→ 現状のユースケースでは過剰
 * 3. 設定ファイルでの管理 → 操作追加時の柔軟性は高いが、現時点では複雑度が増す
 *
 * 注意: includes()使用により'updateMany'が'update'を含むため誤判定される可能性がある
 * 将来的に厳密な判定が必要になった場合は完全一致または特定パターンでの判定に変更
 */
function getOperationType(operation: string): 'read' | 'write' | 'delete' {
	const operationLower = operation.toLowerCase()

	// 完全一致での判定を優先
	if (READ_OPERATIONS.includes(operationLower as any)) {
		return 'read'
	}
	if (DELETE_OPERATIONS.includes(operationLower as any)) {
		return 'delete'
	}

	// 部分一致での判定（完全一致しない場合のフォールバック）
	// ただし誤判定を防ぐため、単語境界を考慮
	if (
		READ_OPERATIONS.some((op) => {
			// 操作名が完全に一致するか、操作名で始まり次が大文字または_の場合
			const regex = new RegExp(`^${op}(?:[A-Z_]|$)`, 'i')
			return regex.test(operation)
		})
	) {
		return 'read'
	}
	if (
		DELETE_OPERATIONS.some((op) => {
			const regex = new RegExp(`^${op}(?:[A-Z_]|$)`, 'i')
			return regex.test(operation)
		})
	) {
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
 *
 * 設計意図: 多様なエラー型に対応し、ログ出力時の安全性を確保
 * - Errorオブジェクト: message と stack を抽出
 * - 非Errorオブジェクト: 安全な文字列化を試行
 * - 循環参照・シリアライズ不可: フォールバックメッセージ
 *
 * 代替案: util.inspect()の使用も検討したが、Cloudflare Workers環境での利用不可
 */
function extractErrorDetails(error: Error | unknown): { error: string; stack?: string } {
	if (error instanceof Error) {
		return { error: error.message, stack: error.stack }
	}

	// 非Errorオブジェクトの安全な文字列化
	try {
		if (typeof error === 'object' && error !== null) {
			// 循環参照を避けるためJSON.stringifyを試行
			return { error: JSON.stringify(error) }
		}
		return { error: String(error) }
	} catch {
		// 循環参照などで失敗した場合のフォールバック
		return { error: '[Unserializable Error Object]' }
	}
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
	// Cloudflare Workers環境でのperformance API利用可能性を考慮
	// performance.now()が利用可能な場合は高精度計測、そうでない場合はDate.now()にフォールバック
	const startTime =
		typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()

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
		// 実行時間を計算（performance.now()の場合はマイクロ秒精度）
		const endTime =
			typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()
		const duration = Math.round((endTime - startTime) * 1000) / 1000

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
		// エラー時も実行時間を計算
		const endTime =
			typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()
		const duration = Math.round((endTime - startTime) * 1000) / 1000
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
