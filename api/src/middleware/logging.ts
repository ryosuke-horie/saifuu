import { Context, MiddlewareHandler } from 'hono'
import { type Env } from '../db'
import { LoggerFactory } from '../logger/factory'
import { Logger, LogMeta } from '../logger/types'

/**
 * 拡張されたHonoコンテキストのVariables型定義
 * ロガーインスタンスとリクエストIDを含む
 */
export interface LoggingVariables {
	logger: Logger
	requestId: string
}

/**
 * ロギングミドルウェアが適用されたHonoコンテキストの型定義
 */
export type LoggingContext = Context<{
	Bindings: Env
	Variables: LoggingVariables
}>

/**
 * HTTPメソッドとパスから操作タイプを判定
 * @param method HTTPメソッド
 * @param _path リクエストパス（将来的にパスベースの判定で使用予定）
 * @returns 操作タイプ ('read' | 'write' | 'delete')
 */
function getOperationType(method: string, _path: string): 'read' | 'write' | 'delete' {
	const normalizedMethod = method.toUpperCase()

	// DELETEメソッドは削除操作
	if (normalizedMethod === 'DELETE') {
		return 'delete'
	}

	// GET、HEAD、OPTIONSは読み取り操作
	if (['GET', 'HEAD', 'OPTIONS'].includes(normalizedMethod)) {
		return 'read'
	}

	// POST、PUT、PATCHは書き込み操作
	if (['POST', 'PUT', 'PATCH'].includes(normalizedMethod)) {
		return 'write'
	}

	// その他は書き込み操作として扱う（安全側に倒す）
	return 'write'
}

/**
 * レスポンスステータスコードからログレベルを判定
 * @param statusCode HTTPステータスコード
 * @returns ログレベル
 */
function getLogLevelFromStatus(statusCode: number): 'info' | 'warn' | 'error' {
	if (statusCode >= 500) {
		return 'error' // サーバーエラー
	}
	if (statusCode >= 400) {
		return 'warn' // クライアントエラー
	}
	return 'info' // 正常・リダイレクト
}

/**
 * リクエストメタデータを構築
 * @param c Honoコンテキスト
 * @param requestId リクエストID
 * @param additionalMeta 追加メタデータ
 * @returns ログメタデータ
 */
function buildRequestMeta(
	c: Context,
	requestId: string,
	additionalMeta: Partial<LogMeta> = {}
): LogMeta {
	const req = c.req
	const method = req.method
	const path = req.path

	return {
		requestId,
		method,
		path,
		operationType: getOperationType(method, path),
		userAgent: req.header('user-agent') || 'unknown',
		contentType: req.header('content-type') || undefined,
		acceptLanguage: req.header('accept-language') || undefined,
		...additionalMeta,
	}
}

/**
 * ログ記録用ミドルウェア
 *
 * 機能:
 * - リクエストIDの自動生成
 * - レスポンス時間の測定
 * - 全APIリクエストの自動ログ記録
 * - エラーハンドリングとログ記録
 * - コンテキストへのロガーとリクエストIDの追加
 *
 * @param env 環境変数（初回のみ必要）
 * @returns Honoミドルウェア
 */
export function loggingMiddleware(env?: Record<string, string>): MiddlewareHandler<{
	Bindings: Env
	Variables: LoggingVariables
}> {
	return async (c, next) => {
		// リクエストIDの生成
		const requestId = crypto.randomUUID()

		// ロガーインスタンスの取得
		const logger = LoggerFactory.getInstance(env)

		// コンテキストに追加
		c.set('logger', logger)
		c.set('requestId', requestId)

		// レスポンス時間測定開始
		const startTime = Date.now()

		// リクエスト開始ログ
		const requestMeta = buildRequestMeta(c, requestId)
		logger.info(`Request started: ${requestMeta.method} ${requestMeta.path}`, requestMeta)

		try {
			// 次のミドルウェア・ハンドラーを実行
			await next()

			// 完了時のログ記録
			const duration = Date.now() - startTime
			const statusCode = c.res.status
			const logLevel = getLogLevelFromStatus(statusCode)

			const completeMeta = buildRequestMeta(c, requestId, {
				duration,
				statusCode,
				responseSize: c.res.headers.get('content-length') || undefined,
			})

			// 500エラーの場合は、エラーレスポンスとして扱う
			if (statusCode >= 500) {
				logger.error(
					`Request failed: ${requestMeta.method} ${requestMeta.path} - ${statusCode} (${duration}ms)`,
					completeMeta
				)
			} else {
				logger[logLevel](
					`Request completed: ${requestMeta.method} ${requestMeta.path} - ${statusCode} (${duration}ms)`,
					completeMeta
				)
			}
		} catch (error) {
			// 例外が発生した場合のログ記録
			const duration = Date.now() - startTime
			const statusCode = c.res?.status || 500

			const errorMeta = buildRequestMeta(c, requestId, {
				duration,
				statusCode,
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
			})

			logger.error(
				`Request exception: ${requestMeta.method} ${requestMeta.path} - ${statusCode} (${duration}ms)`,
				errorMeta
			)

			// エラーを再スロー（通常のエラーハンドリングを継続）
			throw error
		}
	}
}

/**
 * コンテキストからロガーインスタンスを取得
 * @param c Honoコンテキスト（LoggingVariablesを含む任意のコンテキスト）
 * @returns ロガーインスタンス
 */
export function getLogger<T extends { Variables: LoggingVariables }>(c: Context<T>): Logger {
	const logger = c.get('logger') as Logger
	if (!logger) {
		throw new Error('Logger not found in context. Ensure loggingMiddleware is applied.')
	}
	return logger
}

/**
 * コンテキストからリクエストIDを取得
 * @param c Honoコンテキスト（LoggingVariablesを含む任意のコンテキスト）
 * @returns リクエストID
 */
export function getRequestId<T extends { Variables: LoggingVariables }>(c: Context<T>): string {
	const requestId = c.get('requestId') as string
	if (!requestId) {
		throw new Error('Request ID not found in context. Ensure loggingMiddleware is applied.')
	}
	return requestId
}

/**
 * コンテキストからロガーとリクエストIDを同時に取得
 * @param c Honoコンテキスト（LoggingVariablesを含む任意のコンテキスト）
 * @returns ロガーインスタンスとリクエストID
 */
export function getLoggerContext<T extends { Variables: LoggingVariables }>(
	c: Context<T>
): { logger: Logger; requestId: string } {
	return {
		logger: getLogger(c),
		requestId: getRequestId(c),
	}
}

/**
 * コンテキストに紐づいたロガーでメッセージを記録
 * リクエストIDを自動的に含める便利関数
 * @param c Honoコンテキスト（LoggingVariablesを含む任意のコンテキスト）
 * @param level ログレベル
 * @param message メッセージ
 * @param meta 追加メタデータ
 */
export function logWithContext<T extends { Variables: LoggingVariables }>(
	c: Context<T>,
	level: 'debug' | 'info' | 'warn' | 'error',
	message: string,
	meta: Partial<LogMeta> = {}
): void {
	const { logger, requestId } = getLoggerContext(c)

	const contextMeta: LogMeta = {
		requestId,
		...meta,
	}

	logger[level](message, contextMeta)
}
