/**
 * フロントエンド固有の拡張型定義
 *
 * APIレスポンスにカテゴリ情報を含む場合の型定義
 */

import type {
	Category as BaseCategory,
	Subscription,
	Transaction,
} from "@shared/types";

/**
 * フロントエンド用の拡張カテゴリ型
 * numericIdフィールドを追加（後方互換性のため）
 */
export interface Category extends BaseCategory {
	numericId?: number;
}

/**
 * カテゴリ情報付きの取引型
 */
export interface TransactionWithCategory extends Transaction {
	category?: Category | null;
}

/**
 * カテゴリ情報付きのサブスクリプション型
 */
export interface SubscriptionWithCategory extends Subscription {
	category?: Category | null;
}
