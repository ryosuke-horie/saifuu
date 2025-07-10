/**
 * サブスクリプション関連の型定義
 *
 * サブスクリプション管理機能で使用されるデータ型を定義
 */

// 基本型をlib/api/types.tsからインポート
import type { BillingCycle, Category } from "../lib/api/types";

// 基本型をre-export
export type { BillingCycle } from "../lib/api/types";

/**
 * フロントエンド用のサブスクリプションデータ
 * APIレスポンスから変換されたフロントエンド表示用の型
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
	category: Category;

	/**
	 * アクティブ状態
	 */
	isActive: boolean;

	/**
	 * 説明（オプション）
	 */
	description?: string;
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
	 * データ再取得用のコールバック
	 */
	onRefresh?: () => void;

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

/**
 * サブスクリプションフォームデータ
 * フォーム入力時に使用する型（カテゴリはIDで管理）
 */
export interface SubscriptionFormData {
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
	 * カテゴリID（旧フィールドとの互換性のため、APIでは categoryId を使用）
	 */
	categoryId: string;

	/**
	 * アクティブ状態
	 */
	isActive?: boolean;

	/**
	 * 説明（オプション）
	 */
	description?: string;
}

/**
 * サブスクリプションフォームのプロパティ
 */
export interface SubscriptionFormProps {
	/**
	 * フォーム送信時のコールバック
	 */
	onSubmit: (data: SubscriptionFormData) => void;

	/**
	 * キャンセル時のコールバック
	 */
	onCancel: () => void;

	/**
	 * 送信中の状態
	 */
	isSubmitting?: boolean;

	/**
	 * 編集用の初期データ（オプション）
	 */
	initialData?: SubscriptionFormData;

	/**
	 * カテゴリ一覧（フォームで選択肢として表示）
	 */
	categories: Category[];

	/**
	 * 追加のCSSクラス名
	 */
	className?: string;
}

/**
 * 新規サブスクリプション登録ダイアログのプロパティ
 */
export interface NewSubscriptionDialogProps {
	/**
	 * ダイアログの表示状態
	 */
	isOpen: boolean;

	/**
	 * ダイアログを閉じる際のコールバック関数
	 */
	onClose: () => void;

	/**
	 * フォーム送信時のコールバック
	 * 新規サブスクリプションデータを受け取る
	 */
	onSubmit: (data: SubscriptionFormData) => void;

	/**
	 * 送信中の状態
	 */
	isSubmitting?: boolean;

	/**
	 * カテゴリ一覧（フォームで選択肢として表示）
	 * 省略時はグローバル設定のカテゴリを使用
	 */
	categories?: Category[];
}
