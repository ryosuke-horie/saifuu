import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { ALL_CATEGORIES } from '../../../shared/config/categories'
import { type AnyDatabase, type Env } from '../db'
import { type NewSubscription, subscriptions } from '../db/schema'
import { type LoggingVariables, logWithContext } from '../middleware/logging'
import {
	type ValidationError,
	validateIdWithZod,
	validateSubscriptionCreateWithZod,
	validateSubscriptionUpdateWithZod,
} from '../validation/zod-validators'

/**
 * バリデーションエラーをAPIレスポンス形式に変換
 */
function formatValidationErrors(errors: ValidationError[]): {
	error: string
	details?: ValidationError[]
} {
	// 最初のエラーメッセージを主エラーとして使用
	const mainError = errors[0]?.message || 'Validation failed'
	return {
		error: mainError,
		details: errors,
	}
}

/**
 * サブスクリプションAPIのファクトリ関数（Zodバリデーション版）
 * テスト時にはテスト用データベースを注入可能にする
 * @param options.testDatabase - テスト用データベースインスタンス（オプション）
 */
export function createSubscriptionsApp(options: { testDatabase?: AnyDatabase } = {}) {
	const app = new Hono<{
		Bindings: Env
		Variables: {
			db: AnyDatabase
		} & LoggingVariables
	}>()

	// サブスクリプション一覧取得
	app.get('/', async (c) => {
		// 構造化ログ: サブスクリプション一覧取得操作の開始
		logWithContext(c, 'info', 'サブスクリプション一覧取得を開始', {
			operationType: 'read',
			resource: 'subscriptions',
		})

		try {
			const db = options.testDatabase || c.get('db')
			const result = await db.select().from(subscriptions)

			// カテゴリ情報を設定ファイルから補完
			const resultWithCategories = result.map((sub) => {
				const category = ALL_CATEGORIES.find((cat) => cat.numericId === sub.categoryId)
				return {
					...sub,
					category: category
						? {
								id: category.numericId,
								name: category.name,
								type: category.type,
								color: category.color,
								createdAt: new Date().toISOString(),
								updatedAt: new Date().toISOString(),
							}
						: null,
				}
			})

			// 構造化ログ: サブスクリプション一覧取得成功時のログ
			logWithContext(c, 'info', 'サブスクリプション一覧取得が完了', {
				subscriptionsCount: resultWithCategories.length,
				resource: 'subscriptions',
			})

			return c.json(resultWithCategories)
		} catch (error) {
			// 構造化ログ: エラー時の詳細ログ
			logWithContext(c, 'error', 'サブスクリプション一覧取得でエラーが発生', {
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
				resource: 'subscriptions',
				operationType: 'read',
				databaseOperation: 'select',
			})

			return c.json({ error: 'Failed to fetch subscriptions' }, 500)
		}
	})

	// サブスクリプション詳細取得
	app.get('/:id', async (c) => {
		const idParam = c.req.param('id')
		const idValidation = validateIdWithZod(idParam)

		// Check if ID is valid
		if (!idValidation.success) {
			logWithContext(c, 'warn', 'サブスクリプション詳細取得: バリデーションエラー - ID形式が無効', {
				validationErrors: idValidation.errors,
				providedId: idParam,
			})
			return c.json(formatValidationErrors(idValidation.errors), 400)
		}

		const id = idValidation.data

		// 構造化ログ: サブスクリプション詳細取得操作の開始
		logWithContext(c, 'info', 'サブスクリプション詳細取得を開始', {
			subscriptionId: id,
			operationType: 'read',
			resource: 'subscriptions',
		})

		try {
			const db = options.testDatabase || c.get('db')
			const result = await db.select().from(subscriptions).where(eq(subscriptions.id, id))

			// カテゴリ情報を設定ファイルから補完
			const resultWithCategories = result.map((sub) => {
				const category = ALL_CATEGORIES.find((cat) => cat.numericId === sub.categoryId)
				return {
					...sub,
					category: category
						? {
								id: category.numericId,
								name: category.name,
								type: category.type,
								color: category.color,
								createdAt: new Date().toISOString(),
								updatedAt: new Date().toISOString(),
							}
						: null,
				}
			})

			if (result.length === 0) {
				// 構造化ログ: サブスクリプションが見つからない場合
				logWithContext(
					c,
					'warn',
					'サブスクリプション詳細取得: 対象サブスクリプションが見つからない',
					{
						subscriptionId: id,
						resource: 'subscriptions',
					}
				)
				return c.json({ error: 'Subscription not found' }, 404)
			}

			// 構造化ログ: サブスクリプション詳細取得成功時のログ
			logWithContext(c, 'info', 'サブスクリプション詳細取得が完了', {
				subscriptionId: id,
				subscriptionName: resultWithCategories[0].name,
				resource: 'subscriptions',
			})

			return c.json(resultWithCategories[0])
		} catch (error) {
			// 構造化ログ: エラー時の詳細ログ
			logWithContext(c, 'error', 'サブスクリプション詳細取得でエラーが発生', {
				subscriptionId: id,
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
				resource: 'subscriptions',
				operationType: 'read',
				databaseOperation: 'select',
			})

			return c.json({ error: 'Failed to fetch subscription' }, 500)
		}
	})

	// サブスクリプション作成
	app.post('/', async (c) => {
		try {
			const body = (await c.req.json()) as NewSubscription

			// 構造化ログ: サブスクリプション作成操作の開始（バリデーション前）
			logWithContext(c, 'info', 'サブスクリプション作成を開始', {
				operationType: 'write',
				resource: 'subscriptions',
				requestData: {
					name: body.name,
					amount: body.amount,
					billingCycle: body.billingCycle,
					categoryId: body.categoryId,
				},
			})

			const db = options.testDatabase || c.get('db')

			// Zodバリデーションを使用
			const validationResult = validateSubscriptionCreateWithZod(body)
			if (!validationResult.success) {
				logWithContext(c, 'warn', 'サブスクリプション作成: バリデーションエラー', {
					validationError: 'validation_failed',
					errors: validationResult.errors,
					providedData: {
						name: body.name,
						amount: body.amount,
						billingCycle: body.billingCycle,
					},
				})
				return c.json(formatValidationErrors(validationResult.errors), 400)
			}

			const newSubscription: NewSubscription = {
				name: body.name,
				amount: body.amount,
				billingCycle: body.billingCycle,
				nextBillingDate: body.nextBillingDate,
				categoryId: body.categoryId ? Number(body.categoryId) : undefined,
				description: body.description,
				isActive: body.isActive ?? true,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			}

			const result = await db.insert(subscriptions).values(newSubscription).returning()

			// 構造化ログ: サブスクリプション作成成功時のログ
			logWithContext(c, 'info', 'サブスクリプション作成が完了', {
				subscriptionId: result[0].id,
				subscriptionName: result[0].name,
				amount: result[0].amount,
				billingCycle: result[0].billingCycle,
				resource: 'subscriptions',
				operationType: 'write',
			})

			return c.json(result[0], 201)
		} catch (error) {
			// 構造化ログ: エラー時の詳細ログ
			logWithContext(c, 'error', 'サブスクリプション作成でエラーが発生', {
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
				resource: 'subscriptions',
				operationType: 'write',
				databaseOperation: 'insert',
			})

			const errorMessage = error instanceof Error ? error.message : 'Failed to create subscription'
			return c.json({ error: errorMessage }, 500)
		}
	})

	// サブスクリプション更新
	app.put('/:id', async (c) => {
		const idParam = c.req.param('id')
		const idValidation = validateIdWithZod(idParam)

		// Check if ID is valid
		if (!idValidation.success) {
			logWithContext(c, 'warn', 'サブスクリプション更新: バリデーションエラー - ID形式が無効', {
				validationErrors: idValidation.errors,
				providedId: idParam,
			})
			return c.json(formatValidationErrors(idValidation.errors), 400)
		}

		const id = idValidation.data

		try {
			const body = (await c.req.json()) as Partial<NewSubscription>

			// 構造化ログ: サブスクリプション更新操作の開始
			logWithContext(c, 'info', 'サブスクリプション更新を開始', {
				subscriptionId: id,
				operationType: 'write',
				resource: 'subscriptions',
				updateFields: Object.keys(body),
			})

			// Zodバリデーションを使用
			const validationResult = validateSubscriptionUpdateWithZod(body)
			if (!validationResult.success) {
				logWithContext(c, 'warn', 'サブスクリプション更新: バリデーションエラー', {
					subscriptionId: id,
					validationError: 'validation_failed',
					errors: validationResult.errors,
					providedData: {
						name: body.name,
						amount: body.amount,
						billingCycle: body.billingCycle,
					},
				})
				return c.json(formatValidationErrors(validationResult.errors), 400)
			}

			const db = options.testDatabase || c.get('db')

			const updateData = {
				...body,
				categoryId: body.categoryId !== undefined ? Number(body.categoryId) : undefined,
				updatedAt: new Date().toISOString(),
			}

			const result = await db
				.update(subscriptions)
				.set(updateData)
				.where(eq(subscriptions.id, id))
				.returning()

			if (result.length === 0) {
				// 構造化ログ: サブスクリプションが見つからない場合
				logWithContext(c, 'warn', 'サブスクリプション更新: 対象サブスクリプションが見つからない', {
					subscriptionId: id,
					resource: 'subscriptions',
				})
				return c.json({ error: 'Subscription not found' }, 404)
			}

			// 構造化ログ: サブスクリプション更新成功時のログ
			logWithContext(c, 'info', 'サブスクリプション更新が完了', {
				subscriptionId: id,
				subscriptionName: result[0].name,
				resource: 'subscriptions',
				operationType: 'write',
			})

			return c.json(result[0])
		} catch (error) {
			// 構造化ログ: エラー時の詳細ログ
			logWithContext(c, 'error', 'サブスクリプション更新でエラーが発生', {
				subscriptionId: id,
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
				resource: 'subscriptions',
				operationType: 'write',
				databaseOperation: 'update',
			})

			return c.json({ error: 'Failed to update subscription' }, 500)
		}
	})

	// サブスクリプション削除
	app.delete('/:id', async (c) => {
		const idParam = c.req.param('id')
		const idValidation = validateIdWithZod(idParam)

		// Check if ID is valid
		if (!idValidation.success) {
			logWithContext(c, 'warn', 'サブスクリプション削除: バリデーションエラー - ID形式が無効', {
				validationErrors: idValidation.errors,
				providedId: idParam,
			})
			return c.json(formatValidationErrors(idValidation.errors), 400)
		}

		const id = idValidation.data

		// 構造化ログ: サブスクリプション削除操作の開始
		logWithContext(c, 'info', 'サブスクリプション削除を開始', {
			subscriptionId: id,
			operationType: 'delete',
			resource: 'subscriptions',
		})

		try {
			const db = options.testDatabase || c.get('db')

			const result = await db.delete(subscriptions).where(eq(subscriptions.id, id)).returning()

			if (result.length === 0) {
				// 構造化ログ: 削除対象サブスクリプションが見つからない場合
				logWithContext(c, 'warn', 'サブスクリプション削除: 対象サブスクリプションが見つからない', {
					subscriptionId: id,
					resource: 'subscriptions',
				})
				return c.json({ error: 'Subscription not found' }, 404)
			}

			// 構造化ログ: サブスクリプション削除成功時のログ
			logWithContext(c, 'info', 'サブスクリプション削除が完了', {
				subscriptionId: id,
				deletedSubscriptionName: result[0].name,
				resource: 'subscriptions',
				operationType: 'delete',
			})

			return c.json({ message: 'Subscription deleted successfully' })
		} catch (error) {
			// 構造化ログ: エラー時の詳細ログ
			logWithContext(c, 'error', 'サブスクリプション削除でエラーが発生', {
				subscriptionId: id,
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
				resource: 'subscriptions',
				operationType: 'delete',
				databaseOperation: 'delete',
			})

			return c.json({ error: 'Failed to delete subscription' }, 500)
		}
	})

	return app
}

// デフォルトエクスポート（本番環境用）
const app = createSubscriptionsApp()
export default app
