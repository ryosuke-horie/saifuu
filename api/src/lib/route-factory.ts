import { eq } from 'drizzle-orm'
import type { Context } from 'hono'
import type { AnyDatabase } from '../db'
import { type LoggingVariables, logWithContext } from '../middleware/logging'

/**
 * バリデーションエラーの型定義
 */
export type ValidationError = {
	message: string
	path?: string
	type?: string
}

/**
 * バリデーション結果の型定義
 */
export type ValidationResult<T> =
	| { success: true; data: T }
	| { success: false; errors: ValidationError[] }

/**
 * CRUDハンドラーのオプション
 * テーブルやエンティティの型は使用時に推論される
 */
export interface CrudHandlerOptions<TNew, TUpdate> {
	/** データベーステーブルスキーマ */
	table: any
	/** リソース名（ログやエラーメッセージで使用） */
	resourceName: string
	/** 作成時のバリデーション関数 */
	validateCreate: (data: unknown) => ValidationResult<TNew>
	/** 更新時のバリデーション関数 */
	validateUpdate: (data: unknown) => ValidationResult<TUpdate>
	/** ID形式のバリデーション関数 */
	validateId: (id: string) => ValidationResult<number>
	/** データ変換関数（オプション） - エンティティにカテゴリ情報などを付加する場合に使用 */
	transformData?: (data: any[]) => any[]
	/** テスト用データベース（オプション） */
	testDatabase?: AnyDatabase
}

/**
 * CRUDハンドラーの戻り値の型
 */
export interface CrudHandlers {
	getAll: (c: Context<{ Variables: { db: AnyDatabase } & LoggingVariables }>) => Promise<Response>
	getById: (c: Context<{ Variables: { db: AnyDatabase } & LoggingVariables }>) => Promise<Response>
	create: (c: Context<{ Variables: { db: AnyDatabase } & LoggingVariables }>) => Promise<Response>
	update: (c: Context<{ Variables: { db: AnyDatabase } & LoggingVariables }>) => Promise<Response>
	delete: (c: Context<{ Variables: { db: AnyDatabase } & LoggingVariables }>) => Promise<Response>
}

/**
 * バリデーションエラーをAPIレスポンス形式に変換
 */
function formatValidationErrors(errors: ValidationError[]): {
	error: string
	details?: ValidationError[]
} {
	const mainError = errors[0]?.message || 'Validation failed'
	return {
		error: mainError,
		details: errors,
	}
}

/**
 * エラーレスポンスを生成するヘルパー関数
 */
function createErrorResponse(
	c: Context,
	error: unknown,
	resourceName: string,
	operation: string,
	additionalContext?: Record<string, any>
): Response {
	const errorMessage = error instanceof Error ? error.message : String(error)
	const stack = error instanceof Error ? error.stack : undefined

	logWithContext(c, 'error', `${resourceName}${operation}でエラーが発生`, {
		error: errorMessage,
		stack,
		resource: resourceName,
		operationType: operation.includes('取得')
			? 'read'
			: operation.includes('削除')
				? 'delete'
				: 'write',
		...additionalContext,
	})

	return c.json({ error: `Failed to ${operation} ${resourceName}` }, 500)
}

/**
 * CRUD操作のための汎用ハンドラーファクトリ
 * 共通のCRUD操作パターンを抽出し、コードの重複を削減する
 *
 * @template TNew - 新規作成時の型
 * @template TUpdate - 更新時の型
 * @param options CRUDハンドラーのオプション
 * @returns CRUD操作のハンドラー集合
 *
 * @example
 * ```typescript
 * const subscriptionHandlers = createCrudHandlers({
 *   table: subscriptions,
 *   resourceName: 'subscription',
 *   validateCreate: validateSubscriptionCreateWithZod,
 *   validateUpdate: validateSubscriptionUpdateWithZod,
 *   validateId: validateIdWithZod,
 *   transformData: (data) => addCategoryInfo(data)
 * })
 *
 * app.get('/', subscriptionHandlers.getAll)
 * app.get('/:id', subscriptionHandlers.getById)
 * app.post('/', subscriptionHandlers.create)
 * app.put('/:id', subscriptionHandlers.update)
 * app.delete('/:id', subscriptionHandlers.delete)
 * ```
 */
export function createCrudHandlers<TNew = any, TUpdate = any>(
	options: CrudHandlerOptions<TNew, TUpdate>
): CrudHandlers {
	const {
		table,
		resourceName,
		validateCreate,
		validateUpdate,
		validateId,
		transformData,
		testDatabase,
	} = options
	const resourceNameCapitalized = resourceName.charAt(0).toUpperCase() + resourceName.slice(1)

	return {
		/**
		 * 全件取得ハンドラー
		 */
		getAll: async (c: Context<{ Variables: { db: AnyDatabase } & LoggingVariables }>) => {
			logWithContext(c, 'info', `${resourceName}一覧取得を開始`, {
				operationType: 'read',
				resource: resourceName,
			})

			try {
				const db = testDatabase || c.get('db')
				let result = await db.select().from(table)

				// データ変換が指定されている場合は適用
				if (transformData) {
					result = transformData(result)
				}

				logWithContext(c, 'info', `${resourceName}一覧取得が完了`, {
					[`${resourceName}Count`]: result.length,
					resource: resourceName,
				})

				return c.json(result)
			} catch (error) {
				logWithContext(c, 'error', `${resourceName}一覧取得でエラーが発生`, {
					error: error instanceof Error ? error.message : String(error),
					stack: error instanceof Error ? error.stack : undefined,
					resource: resourceName,
					operationType: 'read',
					databaseOperation: 'select',
				})

				return c.json({ error: `Failed to fetch ${resourceName}` }, 500)
			}
		},

		/**
		 * ID指定取得ハンドラー
		 */
		getById: async (c: Context<{ Variables: { db: AnyDatabase } & LoggingVariables }>) => {
			const idParam = c.req.param('id')
			const idValidation = validateId(idParam)

			if (!idValidation.success) {
				logWithContext(c, 'warn', `${resourceName}詳細取得: バリデーションエラー - ID形式が無効`, {
					validationErrors: idValidation.errors,
					providedId: idParam,
				})
				return c.json(formatValidationErrors(idValidation.errors), 400)
			}

			const id = idValidation.data

			logWithContext(c, 'info', `${resourceName}詳細取得を開始`, {
				[`${resourceName}Id`]: id,
				operationType: 'read',
				resource: resourceName,
			})

			try {
				const db = testDatabase || c.get('db')
				let result = await db.select().from(table).where(eq(table.id, id))

				// データ変換が指定されている場合は適用
				if (transformData) {
					result = transformData(result)
				}

				if (result.length === 0) {
					logWithContext(c, 'warn', `${resourceName}詳細取得: 対象${resourceName}が見つからない`, {
						[`${resourceName}Id`]: id,
						resource: resourceName,
					})
					return c.json({ error: `${resourceNameCapitalized} not found` }, 404)
				}

				logWithContext(c, 'info', `${resourceName}詳細取得が完了`, {
					[`${resourceName}Id`]: id,
					resource: resourceName,
				})

				return c.json(result[0])
			} catch (error) {
				logWithContext(c, 'error', `${resourceName}詳細取得でエラーが発生`, {
					[`${resourceName}Id`]: id,
					error: error instanceof Error ? error.message : String(error),
					stack: error instanceof Error ? error.stack : undefined,
					resource: resourceName,
					operationType: 'read',
					databaseOperation: 'select',
				})

				return c.json({ error: `Failed to fetch ${resourceName}` }, 500)
			}
		},

		/**
		 * 作成ハンドラー
		 */
		create: async (c: Context<{ Variables: { db: AnyDatabase } & LoggingVariables }>) => {
			try {
				const body = await c.req.json()

				logWithContext(c, 'info', `${resourceName}作成を開始`, {
					operationType: 'write',
					resource: resourceName,
					requestData: body,
				})

				const validationResult = validateCreate(body)
				if (!validationResult.success) {
					logWithContext(c, 'warn', `${resourceName}作成: バリデーションエラー`, {
						validationError: 'validation_failed',
						errors: validationResult.errors,
						providedData: body,
					})
					return c.json(formatValidationErrors(validationResult.errors), 400)
				}

				const db = testDatabase || c.get('db')
				const newData = {
					...validationResult.data,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				}

				const result = await db.insert(table).values(newData).returning()
				const createdItem = Array.isArray(result) ? result[0] : result.results[0]

				logWithContext(c, 'info', `${resourceName}作成が完了`, {
					[`${resourceName}Id`]: createdItem.id,
					resource: resourceName,
					operationType: 'write',
				})

				return c.json(createdItem, 201)
			} catch (error) {
				logWithContext(c, 'error', `${resourceName}作成でエラーが発生`, {
					error: error instanceof Error ? error.message : String(error),
					stack: error instanceof Error ? error.stack : undefined,
					resource: resourceName,
					operationType: 'write',
					databaseOperation: 'insert',
				})

				return c.json({ error: `Failed to create ${resourceName}` }, 500)
			}
		},

		/**
		 * 更新ハンドラー
		 */
		update: async (c: Context<{ Variables: { db: AnyDatabase } & LoggingVariables }>) => {
			const idParam = c.req.param('id')
			const idValidation = validateId(idParam)

			if (!idValidation.success) {
				logWithContext(c, 'warn', `${resourceName}更新: バリデーションエラー - ID形式が無効`, {
					validationErrors: idValidation.errors,
					providedId: idParam,
				})
				return c.json(formatValidationErrors(idValidation.errors), 400)
			}

			const id = idValidation.data

			try {
				const body = await c.req.json()

				logWithContext(c, 'info', `${resourceName}更新を開始`, {
					[`${resourceName}Id`]: id,
					operationType: 'write',
					resource: resourceName,
					updateFields: Object.keys(body),
				})

				const validationResult = validateUpdate(body)
				if (!validationResult.success) {
					logWithContext(c, 'warn', `${resourceName}更新: バリデーションエラー`, {
						[`${resourceName}Id`]: id,
						validationError: 'validation_failed',
						errors: validationResult.errors,
						providedData: body,
					})
					return c.json(formatValidationErrors(validationResult.errors), 400)
				}

				const db = testDatabase || c.get('db')
				const updateData = {
					...validationResult.data,
					updatedAt: new Date().toISOString(),
				}

				const result = await db.update(table).set(updateData).where(eq(table.id, id)).returning()

				const results = Array.isArray(result) ? result : result.results
				if (results.length === 0) {
					logWithContext(c, 'warn', `${resourceName}更新: 対象${resourceName}が見つからない`, {
						[`${resourceName}Id`]: id,
						resource: resourceName,
					})
					return c.json({ error: `${resourceNameCapitalized} not found` }, 404)
				}

				logWithContext(c, 'info', `${resourceName}更新が完了`, {
					[`${resourceName}Id`]: id,
					resource: resourceName,
					operationType: 'write',
				})

				return c.json(results[0])
			} catch (error) {
				logWithContext(c, 'error', `${resourceName}更新でエラーが発生`, {
					[`${resourceName}Id`]: id,
					error: error instanceof Error ? error.message : String(error),
					stack: error instanceof Error ? error.stack : undefined,
					resource: resourceName,
					operationType: 'write',
					databaseOperation: 'update',
				})

				return c.json({ error: `Failed to update ${resourceName}` }, 500)
			}
		},

		/**
		 * 削除ハンドラー
		 */
		delete: async (c: Context<{ Variables: { db: AnyDatabase } & LoggingVariables }>) => {
			const idParam = c.req.param('id')
			const idValidation = validateId(idParam)

			if (!idValidation.success) {
				logWithContext(c, 'warn', `${resourceName}削除: バリデーションエラー - ID形式が無効`, {
					validationErrors: idValidation.errors,
					providedId: idParam,
				})
				return c.json(formatValidationErrors(idValidation.errors), 400)
			}

			const id = idValidation.data

			logWithContext(c, 'info', `${resourceName}削除を開始`, {
				[`${resourceName}Id`]: id,
				operationType: 'delete',
				resource: resourceName,
			})

			try {
				const db = testDatabase || c.get('db')
				const result = await db.delete(table).where(eq(table.id, id)).returning()

				const results = Array.isArray(result) ? result : result.results
				if (results.length === 0) {
					logWithContext(c, 'warn', `${resourceName}削除: 対象${resourceName}が見つからない`, {
						[`${resourceName}Id`]: id,
						resource: resourceName,
					})
					return c.json({ error: `${resourceNameCapitalized} not found` }, 404)
				}

				logWithContext(c, 'info', `${resourceName}削除が完了`, {
					[`${resourceName}Id`]: id,
					resource: resourceName,
					operationType: 'delete',
				})

				return c.json({ message: `${resourceNameCapitalized} deleted successfully` })
			} catch (error) {
				logWithContext(c, 'error', `${resourceName}削除でエラーが発生`, {
					[`${resourceName}Id`]: id,
					error: error instanceof Error ? error.message : String(error),
					stack: error instanceof Error ? error.stack : undefined,
					resource: resourceName,
					operationType: 'delete',
					databaseOperation: 'delete',
				})

				return c.json({ error: `Failed to delete ${resourceName}` }, 500)
			}
		},
	}
}
