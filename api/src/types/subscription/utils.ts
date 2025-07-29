/**
 * サブスクリプションデータ変換・ユーティリティ関数
 * データベース型とAPI型の変換、バリデーション等
 */

import { ALL_CATEGORIES } from '../../../../shared/config/categories'
import type { ISODateString, NumericEntityId } from '../common'
import type { Category } from '../common/category'
import type { DbSubscription, Subscription, SubscriptionStatus } from './index'
import type { CreateSubscriptionRequest, UpdateSubscriptionRequest } from './requests'

// データベース型からAPI型への変換
export function transformDbSubscriptionToApi(
	dbSubscription: DbSubscription,
	category: Category | null = null
): Subscription {
	return {
		...dbSubscription,
		id: String(dbSubscription.id),
		category,
		status: dbSubscription.isActive ? 'active' : 'inactive',
	}
}

// 複数のサブスクリプションにカテゴリ情報を付加（DB結果用のオーバーロード）
export function addCategoryInfoToSubscriptions(
	subscriptions: (Omit<
		DbSubscription,
		'id' | 'categoryId' | 'createdAt' | 'updatedAt' | 'nextBillingDate'
	> & {
		id: number
		categoryId: number | null
		createdAt: string
		updatedAt: string
		nextBillingDate: string
	})[]
): Subscription[]
// 複数のサブスクリプションにカテゴリ情報を付加（型安全版）
export function addCategoryInfoToSubscriptions(subscriptions: DbSubscription[]): Subscription[]
// 実装
export function addCategoryInfoToSubscriptions(
	subscriptions: (
		| DbSubscription
		| (Omit<DbSubscription, 'id' | 'categoryId' | 'createdAt' | 'updatedAt' | 'nextBillingDate'> & {
				id: number
				categoryId: number | null
				createdAt: string
				updatedAt: string
				nextBillingDate: string
		  })
	)[]
): Subscription[] {
	const currentTimestamp = new Date().toISOString() as ISODateString

	// カテゴリマップを作成（検索効率化）
	const categoryMap = new Map(
		ALL_CATEGORIES.map((cat) => [
			cat.numericId,
			{
				id: cat.numericId as NumericEntityId<'Category'>,
				name: cat.name,
				type: cat.type,
				color: cat.color,
				createdAt: currentTimestamp,
				updatedAt: currentTimestamp,
			} as Category,
		])
	)

	return subscriptions.map((subscription) => ({
		...subscription,
		id: String(subscription.id),
		categoryId: subscription.categoryId as NumericEntityId<'Category'> | null,
		createdAt: subscription.createdAt as ISODateString,
		updatedAt: subscription.updatedAt as ISODateString,
		nextBillingDate: subscription.nextBillingDate as ISODateString,
		category: subscription.categoryId ? categoryMap.get(subscription.categoryId) || null : null,
		status: subscription.isActive ? 'active' : ('inactive' as SubscriptionStatus),
	}))
}

// 単一のサブスクリプションにカテゴリ情報を付加
export function addCategoryInfoToSubscription(subscription: DbSubscription): Subscription {
	return addCategoryInfoToSubscriptions([subscription])[0]
}

// 作成リクエストからデータベース用データへの変換
export function transformCreateRequestToDb(
	request: CreateSubscriptionRequest
): Omit<DbSubscription, 'id' | 'createdAt' | 'updatedAt'> {
	return {
		name: request.name,
		amount: request.amount,
		billingCycle: request.billingCycle,
		nextBillingDate: request.nextBillingDate as ISODateString,
		categoryId: request.categoryId
			? (Number.parseInt(request.categoryId) as NumericEntityId<'Category'>)
			: null,
		description: request.description || null,
		isActive: request.isActive ?? true,
	}
}

// 更新リクエストからデータベース用データへの変換
export function transformUpdateRequestToDb(
	request: UpdateSubscriptionRequest
): Partial<Omit<DbSubscription, 'id' | 'createdAt'>> {
	const updates: Partial<Omit<DbSubscription, 'id' | 'createdAt'>> = {
		updatedAt: new Date().toISOString() as ISODateString,
	}

	if (request.name !== undefined) {
		updates.name = request.name
	}

	if (request.amount !== undefined) {
		updates.amount = request.amount
	}

	if (request.billingCycle !== undefined) {
		updates.billingCycle = request.billingCycle
	}

	if (request.nextBillingDate !== undefined) {
		updates.nextBillingDate = request.nextBillingDate as ISODateString
	}

	if (request.categoryId !== undefined) {
		updates.categoryId = request.categoryId
			? (Number.parseInt(request.categoryId) as NumericEntityId<'Category'>)
			: null
	}

	if (request.description !== undefined) {
		updates.description = request.description
	}

	if (request.isActive !== undefined) {
		updates.isActive = request.isActive
	}

	return updates
}

// クエリパラメータのパース
export function parseSubscriptionQueryParams(query: Record<string, string | undefined>) {
	return {
		page: query.page ? Number.parseInt(query.page) : 1,
		limit: query.limit ? Number.parseInt(query.limit) : 20,
		isActive: query.isActive === 'true' ? true : query.isActive === 'false' ? false : undefined,
		categoryId: query.categoryId
			? (Number.parseInt(query.categoryId) as NumericEntityId<'Category'>)
			: undefined,
		billingCycle: query.billingCycle as 'monthly' | 'yearly' | 'weekly' | undefined,
		sortBy: (query.sortBy || 'nextBillingDate') as 'name' | 'amount' | 'nextBillingDate',
		sortOrder: (query.sortOrder || 'asc') as 'asc' | 'desc',
	}
}

// 次回請求日の計算
export function calculateNextBillingDate(
	currentDate: ISODateString,
	billingCycle: 'monthly' | 'yearly' | 'weekly'
): ISODateString {
	const date = new Date(currentDate)

	switch (billingCycle) {
		case 'weekly':
			date.setDate(date.getDate() + 7)
			break
		case 'monthly':
			date.setMonth(date.getMonth() + 1)
			break
		case 'yearly':
			date.setFullYear(date.getFullYear() + 1)
			break
	}

	return date.toISOString() as ISODateString
}
