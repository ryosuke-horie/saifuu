import { Hono } from 'hono'
import { type AnyDatabase, type Env } from '../db'
import {
	type Subscription as DbSubscription,
	type NewSubscription,
	subscriptions,
} from '../db/schema'
import { createCrudHandlers } from '../lib/route-factory'
import { type LoggingVariables } from '../middleware/logging'
import { addCategoryInfoToSubscriptions, type Subscription } from '../types'
import {
	validateIdWithZod,
	validateSubscriptionCreateWithZod,
	validateSubscriptionUpdateWithZod,
} from '../validation/zod-validators'

// カテゴリ情報付加のための変換関数は types/subscription/utils.ts に移動済み
// addCategoryInfoToSubscriptions を使用

/**
 * サブスクリプションAPIのファクトリ関数（CRUDファクトリ版）
 * CRUDファクトリパターンを使用してコードの重複を削減
 * @param options.testDatabase - テスト用データベースインスタンス（オプション）
 */
export function createSubscriptionsApp(options: { testDatabase?: AnyDatabase } = {}) {
	const app = new Hono<{
		Bindings: Env
		Variables: {
			db: AnyDatabase
		} & LoggingVariables
	}>()

	// CRUDハンドラーを作成
	const handlers = createCrudHandlers<
		NewSubscription,
		Partial<NewSubscription>,
		DbSubscription,
		Subscription
	>({
		table: subscriptions,
		resourceName: 'subscription',
		validateCreate: validateSubscriptionCreateWithZod,
		validateUpdate: validateSubscriptionUpdateWithZod,
		validateId: validateIdWithZod,
		transformData: addCategoryInfoToSubscriptions,
		testDatabase: options.testDatabase,
	})

	// ルーティング設定
	app.get('/', handlers.getAll)
	app.get('/:id', handlers.getById)
	app.post('/', handlers.create)
	app.put('/:id', handlers.update)
	app.delete('/:id', handlers.delete)

	return app
}

// デフォルトエクスポート（本番環境用）
const app = createSubscriptionsApp()
export default app
