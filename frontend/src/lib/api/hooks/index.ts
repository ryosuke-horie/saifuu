/**
 * API React フック エクスポート
 *
 * React コンポーネントで使用するAPIフックを統一的にエクスポート
 */

// サブスクリプション関連フック
export {
	subscriptionHooks,
	useActiveSubscriptions,
	useCreateSubscription,
	useDeleteSubscription,
	useInactiveSubscriptions,
	useSubscription,
	useSubscriptionStats,
	useSubscriptions,
	useToggleSubscriptionStatus,
	useUpdateSubscription,
} from "./useSubscriptions";

// 統合フックオブジェクト（将来のカテゴリ・取引フック追加用）
import {
	useActiveSubscriptions,
	useCreateSubscription,
	useDeleteSubscription,
	useInactiveSubscriptions,
	useSubscription,
	useSubscriptionStats,
	useSubscriptions,
	useToggleSubscriptionStatus,
	useUpdateSubscription,
} from "./useSubscriptions";

export const apiHooks = {
	subscriptions: {
		useSubscriptions,
		useSubscription,
		useCreateSubscription,
		useUpdateSubscription,
		useDeleteSubscription,
		useSubscriptionStats,
		useActiveSubscriptions,
		useInactiveSubscriptions,
		useToggleSubscriptionStatus,
	},
	// 将来的に追加予定:
	// categories: categoryHooks,
	// transactions: transactionHooks,
} as const;
