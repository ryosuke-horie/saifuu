/**
 * フロントエンド固有の拡張型定義
 *
 * APIレスポンスにカテゴリ情報を含む場合の型定義
 */

import type { Category, Subscription, Transaction } from "@shared/types";

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
