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
 *
 * @template TNew - 新規作成時のエンティティ型
 * @template TUpdate - 更新時のエンティティ型（通常はPartial<TNew>）
 */
export interface CrudHandlerOptions<TNew, TUpdate, TEntity = unknown, TTransformed = TEntity> {
	/**
	 * データベーステーブルスキーマ
	 *
	 * Drizzle ORMのsqliteTable()で定義されたテーブルオブジェクトを指定します。
	 * 実際の型は複雑なジェネリクスを含むため、any型を使用していますが、
	 * 実行時には以下の要件を満たす必要があります：
	 * - idカラムが定義されていること
	 * - Drizzle ORMのテーブルメソッド（select, insert, update, delete等）が使用可能なこと
	 *
	 * @example
	 * import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core'
	 * const users = sqliteTable('users', {
	 *   id: integer('id').primaryKey(),
	 *   name: text('name').notNull()
	 * })
	 */
	// biome-ignore lint/suspicious/noExplicitAny: Drizzle table types are complex and require any for flexibility
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
	transformData?: (data: TEntity[]) => TTransformed[]
	/** バッチ操作を使用するかどうか（D1環境でのトランザクション代替） */
	useBatch?: boolean
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
	/** バッチ操作を使用した作成（D1のトランザクション代替） */
	createWithBatch?: (
		c: Context<{ Variables: { db: AnyDatabase } & LoggingVariables }>
	) => Promise<Response>
	/** バッチ操作を使用した更新（D1のトランザクション代替） */
	updateWithBatch?: (
		c: Context<{ Variables: { db: AnyDatabase } & LoggingVariables }>
	) => Promise<Response>
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
 * Drizzle ORMのreturning()メソッドの戻り値を安全に処理する
 * 環境（D1 vs SQLite）によって異なる戻り値形式に対応
 */
function extractResult<T>(result: unknown): T | undefined {
	if (Array.isArray(result)) {
		return result[0] as T
	}

	// D1環境の場合、resultsプロパティにデータが含まれることがある
	if (result && typeof result === 'object' && 'results' in result) {
		const results = (result as { results: unknown }).results
		if (Array.isArray(results)) {
			return results[0] as T
		}
	}

	// その他の場合
	return result as T
}

/**
 * ID検証とレスポンス処理を共通化
 */
function validateAndExtractId(
	c: Context<{ Variables: { db: AnyDatabase } & LoggingVariables }>,
	resourceName: string,
	validateId: (id: string) => ValidationResult<number>
): { valid: false; response: Response } | { valid: true; id: number } {
	const idParam = c.req.param('id')
	const idValidation = validateId(idParam)

	if (!idValidation.success) {
		logWithContext(c, 'warn', `${resourceName}処理: バリデーションエラー - ID形式が無効`, {
			validationErrors: idValidation.errors,
			providedId: idParam,
		})
		return {
			valid: false,
			response: c.json(formatValidationErrors(idValidation.errors), 400),
		}
	}

	return {
		valid: true,
		id: idValidation.data,
	}
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
 * @note Cloudflare D1の制約により、従来のSQLトランザクション（BEGIN/COMMIT/ROLLBACK）は
 *       サポートされていません。代わりにバッチAPIを使用することで、複数の操作を
 *       原子的に実行できます。バッチ内のいずれかの操作が失敗した場合、
 *       すべての操作がロールバックされます。
 *
 * @example
 * ```typescript
 * const subscriptionHandlers = createCrudHandlers({
 *   table: subscriptions,
 *   resourceName: 'subscription',
 *   validateCreate: validateSubscriptionCreateWithZod,
 *   validateUpdate: validateSubscriptionUpdateWithZod,
 *   validateId: validateIdWithZod,
 *   transformData: (data) => addCategoryInfo(data),
 *   useBatch: true // バッチ操作を有効化
 * })
 *
 * app.get('/', subscriptionHandlers.getAll)
 * app.get('/:id', subscriptionHandlers.getById)
 * app.post('/', subscriptionHandlers.create)
 * app.put('/:id', subscriptionHandlers.update)
 * app.delete('/:id', subscriptionHandlers.delete)
 * ```
 */
export function createCrudHandlers<
	TNew = unknown,
	TUpdate = unknown,
	TEntity = unknown,
	TTransformed = TEntity,
>(options: CrudHandlerOptions<TNew, TUpdate, TEntity, TTransformed>): CrudHandlers {
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
					result = transformData(result) as unknown as typeof result
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
			const idResult = validateAndExtractId(c, resourceName, validateId)
			if (!idResult.valid) {
				return idResult.response
			}
			const id = idResult.id

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
					result = transformData(result) as unknown as typeof result
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
				const createdItem = extractResult<TNew & { id: number }>(result)

				if (!createdItem) {
					throw new Error('Failed to create item - no data returned')
				}

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
			const idResult = validateAndExtractId(c, resourceName, validateId)
			if (!idResult.valid) {
				return idResult.response
			}
			const id = idResult.id

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

				const updatedItem = extractResult<TUpdate & { id: number }>(result)
				if (!updatedItem) {
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

				return c.json(updatedItem)
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
			const idResult = validateAndExtractId(c, resourceName, validateId)
			if (!idResult.valid) {
				return idResult.response
			}
			const id = idResult.id

			logWithContext(c, 'info', `${resourceName}削除を開始`, {
				[`${resourceName}Id`]: id,
				operationType: 'delete',
				resource: resourceName,
			})

			try {
				const db = testDatabase || c.get('db')
				const result = await db.delete(table).where(eq(table.id, id)).returning()

				const deletedItem = extractResult<{ id: number }>(result)
				if (!deletedItem) {
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

				return c.body(null, 204)
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
