import { ALL_CATEGORIES } from '../../../shared/src/config/categories'
import { Hono } from 'hono'
import { type AnyDatabase, type Env } from '../db'
import { type NewSubscription, type Subscription, subscriptions } from '../db/schema'
import { createCrudHandlers } from '../lib/route-factory'
import { type LoggingVariables, logWithContext } from '../middleware/logging'
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
 * 設計意図：フロントエンドでのカテゴリ名表示のため、アプリケーション層で結合処理を実装
 * 代替案：
 * - DB層でのJOIN処理も検討したが、カテゴリマスタが設定ファイルベースのため現在の方式を採用
 * - GraphQL等でのリゾルバーでの結合も可能だが、RESTful APIのシンプルさを優先
 *
 * パフォーマンス考慮：
 * - カテゴリ数は少数（10件程度）のため、O(n*m)の計算量でも実用上問題なし
 * - タイムスタンプは関数実行時に1回だけ生成し、全レコードで共有
 *
 * @param data - サブスクリプションデータの配列
 * @returns カテゴリ情報が付加されたサブスクリプションデータの配列
 */
function addCategoryInfo(data: Subscription[]): SubscriptionWithCategory[] {
	const currentTimestamp = new Date().toISOString()

	// カテゴリをMapに変換して検索を高速化（O(1)）
	const categoryMap = new Map(ALL_CATEGORIES.map((cat) => [cat.numericId, cat]))

	return data.map((subscription) => {
		const category =
			subscription.categoryId !== null ? categoryMap.get(subscription.categoryId) : undefined

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
	const handlers = createCrudHandlers<
		NewSubscription,
		Partial<NewSubscription>,
		Subscription,
		SubscriptionWithCategory
	>({
		table: subscriptions,
		resourceName: 'subscription',
		validateCreate: validateSubscriptionCreateWithZod,
		validateUpdate: validateSubscriptionUpdateWithZod,
		validateId: validateIdWithZod,
		transformData: addCategoryInfo,
		testDatabase: options.testDatabase,
	})

	// ルーティング設定
	// statsエンドポイントを先に定義（:idより前に配置する必要がある）
	app.get('/stats', async (c) => {
		const db = options.testDatabase || c.get('db')
		if (!db) {
			throw new Error('Database not initialized')
		}

		try {
			// すべてのサブスクリプションを取得
			const allSubscriptions = await db.select().from(subscriptions)

			// 月額合計を計算
			const monthlyTotal = allSubscriptions.reduce((sum, sub) => {
				// billingCycleに応じて月額換算
				let monthlyAmount = sub.amount
				if (sub.billingCycle === 'yearly') {
					monthlyAmount = Math.round(sub.amount / 12)
				} else if (sub.billingCycle === 'weekly') {
					monthlyAmount = Math.round(sub.amount * 4.33) // 52週/12ヶ月 ≈ 4.33
				}
				return sum + monthlyAmount
			}, 0)

			// アクティブなサブスクリプション数
			const activeCount = allSubscriptions.filter((sub) => sub.isActive).length

			return c.json({
				stats: {
					totalMonthlyAmount: monthlyTotal,
					activeCount,
					totalCount: allSubscriptions.length,
				},
			})
		} catch (error) {
			logWithContext(c, 'error', 'Failed to get subscription stats', {
				error: error instanceof Error ? error.message : String(error),
			})
			return c.json({ error: 'Failed to get subscription stats' }, 500)
		}
	})

	// 通常のCRUDエンドポイント
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
