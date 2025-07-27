/**
 * 収入フォーム関連の型定義
 *
 * 収入管理機能で使用されるデータ型を定義
 */

import type { Category, Transaction } from "../lib/api/types";

// 基本型をre-export
export type { TransactionType } from "../lib/api/types";

/**
 * 収入フォームデータ
 * フォーム入力時に使用する型（カテゴリはIDで管理）
 */
export interface IncomeFormData {
	/**
	 * 金額（円）- 収入の場合は正の値のみ
	 */
	amount: number;

	/**
	 * 取引種別（常に収入）
	 */
	type: "income";

	/**
	 * 説明・メモ（オプション）
	 */
	description?: string;

	/**
	 * 取引日（YYYY-MM-DD形式）
	 */
	date: string;

	/**
	 * カテゴリID（選択されたカテゴリのID）
	 */
	categoryId?: string;
}

/**
 * 収入フォームのプロパティ
 */
export interface IncomeFormProps {
	/**
	 * フォーム送信時のコールバック
	 */
	onSubmit: (data: IncomeFormData) => void;

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
	initialData?: IncomeFormData;

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
 * 収入一覧表示用のプロパティ
 */
export interface IncomeListProps {
	/**
	 * 取引データの配列（収入のみ）
	 */
	transactions: Transaction[];

	/**
	 * ローディング状態
	 */
	isLoading?: boolean;

	/**
	 * エラー状態
	 */
	error?: string | null;

	/**
	 * 編集時のコールバック
	 */
	onEdit?: (transaction: Transaction) => void;

	/**
	 * 削除時のコールバック
	 */
	onDelete?: (transactionId: string) => void;

	/**
	 * 追加のCSSクラス名
	 */
	className?: string;
}
