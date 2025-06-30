/**
 * サブスクリプション関連の型定義
 *
 * サブスクリプション管理機能で使用されるデータ型を定義
 */

/**
 * 請求サイクル
 */
export type BillingCycle = "monthly" | "yearly";

/**
 * サブスクリプションカテゴリ
 */
export type SubscriptionCategory =
	| "entertainment"
	| "work"
	| "lifestyle"
	| "other";

/**
 * サブスクリプションデータ
 */
export interface Subscription {
	/**
	 * サブスクリプションID
	 */
	id: string;

	/**
	 * サービス名
	 */
	name: string;

	/**
	 * 月額料金（円）
	 */
	amount: number;

	/**
	 * 請求サイクル
	 */
	billingCycle: BillingCycle;

	/**
	 * 次回請求日（YYYY-MM-DD形式）
	 */
	nextBillingDate: string;

	/**
	 * カテゴリ
	 */
	category: SubscriptionCategory;
}

/**
 * サブスクリプション一覧表示用のプロパティ
 */
export interface SubscriptionListProps {
	/**
	 * サブスクリプションデータの配列
	 */
	subscriptions: Subscription[];

	/**
	 * ローディング状態
	 */
	isLoading?: boolean;

	/**
	 * エラー状態
	 */
	error?: string | null;

	/**
	 * 追加のCSSクラス名
	 */
	className?: string;
}

/**
 * 新規登録ボタンのプロパティ
 */
export interface NewSubscriptionButtonProps {
	/**
	 * クリック時のハンドラー（現在はUIのみなので空実装）
	 */
	onClick?: () => void;

	/**
	 * ボタンの無効状態
	 */
	disabled?: boolean;

	/**
	 * 追加のCSSクラス名
	 */
	className?: string;
}
