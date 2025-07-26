import { Context, MiddlewareHandler } from 'hono'
import { type Env } from '../db'
import { type LoggingVariables, logWithContext } from '../middleware/logging'

/**
 * APIエラーの基底クラス
 * すべてのカスタムエラーはこのクラスを継承する
 *
 * 設計意図: HTTPステータスコードとエラーメッセージを統一的に扱うことで、
 * エラーレスポンスの一貫性を保証する
 */
export class ApiError extends Error {
	public readonly statusCode: number

	constructor(message: string, statusCode = 500) {
		super(message)
		this.name = 'ApiError'
		this.statusCode = statusCode
		// プロトタイプチェーンを正しく設定（TypeScriptでのクラス継承対応）
		Object.setPrototypeOf(this, ApiError.prototype)
	}
}

/**
 * バリデーションエラー用のクラス
 * 400エラーとして処理される
 *
 * 使用例: フォームの入力値検証失敗時
 */
export class ValidationError extends ApiError {
	public readonly errors: ValidationErrorDetail[]

	constructor(message: string, errors: ValidationErrorDetail[]) {
		super(message, 400)
		this.name = 'ValidationError'
		this.errors = errors
		Object.setPrototypeOf(this, ValidationError.prototype)
	}
}

/**
 * リソースが見つからない場合のエラー
 * 404エラーとして処理される
 */
export class NotFoundError extends ApiError {
	constructor(message: string) {
		super(message, 404)
		this.name = 'NotFoundError'
		Object.setPrototypeOf(this, NotFoundError.prototype)
	}
}

/**
 * 不正なリクエストエラー
 * 400エラーとして処理される
 *
 * 使用例: クエリパラメータの値制限、APIの使用方法が不正な場合
 */
export class BadRequestError extends ApiError {
	constructor(message: string) {
		super(message, 400)
		this.name = 'BadRequestError'
		Object.setPrototypeOf(this, BadRequestError.prototype)
	}
}

/**
 * データベース関連のエラー
 * 500エラーとして処理される
 */
export class DatabaseError extends ApiError {
	public readonly originalError?: Error

	constructor(message: string, originalError?: Error) {
		super(message, 500)
		this.name = 'DatabaseError'
		this.originalError = originalError
		Object.setPrototypeOf(this, DatabaseError.prototype)
	}
}

/**
 * バリデーションエラーの詳細情報
 */
export interface ValidationErrorDetail {
	field?: string
	message: string
}

/**
 * エラーレスポンスの型定義
 * APIクライアントが受け取るエラーレスポンスの形式を統一
 */
export interface ErrorResponse {
	error: string
	details?: ValidationErrorDetail[]
}

/**
 * HTTPステータスコードからログレベルを決定
 */
function getLogLevel(statusCode: number): 'error' | 'warn' {
	return statusCode >= 500 ? 'error' : 'warn'
}

/**
 * エラーオブジェクトからエラー情報を抽出
 */
function extractErrorInfo(error: unknown): {
	message: string
	stack?: string
} {
	if (error instanceof Error) {
		return {
			message: error.message,
			stack: error.stack,
		}
	}
	return {
		message: String(error),
	}
}

/**
 * エラーをハンドリングしてレスポンスを返す
 * @param c Honoコンテキスト
 * @param error エラーオブジェクト
 * @param resource リソース名（ログ用）
 * @returns HTTPレスポンス
 */
export function handleError<T extends { Variables: LoggingVariables }>(
	c: Context<T>,
	error: unknown,
	resource = 'unknown'
): Response {
	// ValidationErrorの場合
	if (error instanceof ValidationError) {
		logWithContext(c, 'warn', error.message, {
			resource,
			errors: error.errors,
		})
		const response: ErrorResponse = {
			error: error.message,
			details: error.errors,
		}
		return c.json(response, error.statusCode as 400)
	}

	// NotFoundErrorの場合
	if (error instanceof NotFoundError) {
		logWithContext(c, 'warn', error.message, {
			resource,
		})
		const response: ErrorResponse = {
			error: error.message,
		}
		return c.json(response, error.statusCode as 404)
	}

	// BadRequestErrorの場合
	if (error instanceof BadRequestError) {
		logWithContext(c, 'warn', error.message, {
			resource,
		})
		const response: ErrorResponse = {
			error: error.message,
		}
		return c.json(response, error.statusCode as 400)
	}

	// DatabaseErrorの場合
	if (error instanceof DatabaseError) {
		logWithContext(c, 'error', error.message, {
			resource,
			error: error.originalError?.message || error.message,
			stack: error.originalError?.stack,
		})
		const response: ErrorResponse = {
			error: error.message,
		}
		return c.json(response, error.statusCode as 500)
	}

	// その他のApiErrorの場合
	if (error instanceof ApiError) {
		const logLevel = getLogLevel(error.statusCode)
		logWithContext(c, logLevel, error.message, {
			resource,
			statusCode: error.statusCode,
		})
		const response: ErrorResponse = {
			error: error.message,
		}
		return c.json(response, error.statusCode as 400 | 401 | 403 | 404 | 500 | 502 | 503)
	}

	// 予期しないエラーの場合
	const errorInfo = extractErrorInfo(error)
	const defaultMessage = '予期しないエラーが発生しました'

	logWithContext(c, 'error', defaultMessage, {
		resource,
		error: errorInfo.message,
		stack: errorInfo.stack,
	})

	const response: ErrorResponse = {
		error: defaultMessage,
	}
	return c.json(response, 500)
}

/**
 * エラーハンドリングミドルウェア
 * すべてのエラーをキャッチして適切なレスポンスを返す
 *
 * 使用方法:
 * app.use(errorHandler())
 *
 * 注意: このミドルウェアは他のルートハンドラーより前に登録する
 * （ミドルウェアは登録順に実行され、エラーハンドリングは全体をラップする必要があるため）
 */
export function errorHandler(): MiddlewareHandler<{
	Bindings: Env
	Variables: LoggingVariables
}> {
	return async (c, next) => {
		try {
			await next()
		} catch (error) {
			// エラーレスポンスを返すが、エラーは再スローしない
			// （ミドルウェアチェーンを適切に終了させるため）
			return handleError(c, error)
		}
	}
}
