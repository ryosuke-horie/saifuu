import { Hono } from 'hono'
import { ALL_CATEGORIES } from '../../../shared/config/categories'
import { type AnyDatabase, type Env } from '../db'
import { type NewSubscription, type Subscription, subscriptions } from '../db/schema'
import { createCrudHandlers } from '../lib/route-factory'
import { type LoggingVariables } from '../middleware/logging'
import {
	validateIdWithZod,
	validateSubscriptionCreateWithZod,
	validateSubscriptionUpdateWithZod,
} from '../validation/zod-validators'

// カテゴリ情報の型定義
interface CategoryInfo {
	id: number
	name: string
	type: string
	color: string
	createdAt: string
	updatedAt: string
}

// カテゴリ情報付きサブスクリプションの型定義
interface SubscriptionWithCategory extends Subscription {
	category: CategoryInfo | null
}

/**
 * カテゴリ情報を付加するデータ変換関数
 * subscriptions配列の各要素にカテゴリマスタから対応するカテゴリ情報を付加する
 *
 * @param data - サブスクリプションデータの配列
 * @returns カテゴリ情報が付加されたサブスクリプションデータの配列
 */
function addCategoryInfo(data: Subscription[]): SubscriptionWithCategory[] {
	const currentTimestamp = new Date().toISOString()

	return data.map((subscription) => {
		const category = ALL_CATEGORIES.find((cat) => cat.numericId === subscription.categoryId)

		return {
			...subscription,
			category: category
				? {
						id: category.numericId,
						name: category.name,
						type: category.type,
						color: category.color,
						createdAt: currentTimestamp,
						updatedAt: currentTimestamp,
					}
				: null,
		}
	})
}

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
	const handlers = createCrudHandlers<NewSubscription, Partial<NewSubscription>>({
		table: subscriptions,
		resourceName: 'subscription',
		validateCreate: (data: unknown) =>
			validateSubscriptionCreateWithZod(data as Partial<NewSubscription>),
		validateUpdate: (data: unknown) =>
			validateSubscriptionUpdateWithZod(data as Partial<NewSubscription>),
		validateId: validateIdWithZod,
		transformData: addCategoryInfo as (data: any[]) => any[],
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
