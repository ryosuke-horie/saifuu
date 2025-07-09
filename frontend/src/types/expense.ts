/**
 * 支出・収入フォーム関連の型定義
 *
 * 支出・収入管理機能で使用されるデータ型を定義
 */

import type { Category, Transaction, TransactionType } from "../lib/api/types";

// 基本型をre-export
export type { TransactionType } from "../lib/api/types";

/**
 * 支出・収入フォームデータ
 * フォーム入力時に使用する型（カテゴリはIDで管理）
 */
export interface ExpenseFormData {
	/**
	 * 金額（円）
	 */
	amount: number;

	/**
	 * 取引種別（収入または支出）
	 */
	type: TransactionType | null;

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
 * 支出・収入フォームのプロパティ
 */
export interface ExpenseFormProps {
	/**
	 * フォーム送信時のコールバック
	 */
	onSubmit: (data: ExpenseFormData) => void;

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
	initialData?: ExpenseFormData;

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
 * 新規支出・収入登録ダイアログのプロパティ
 */
export interface NewExpenseDialogProps {
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
	 * 新規取引データを受け取る
	 */
	onSubmit: (data: ExpenseFormData) => void;

	/**
	 * 送信中の状態
	 */
	isSubmitting?: boolean;

	/**
	 * カテゴリ一覧（フォームで選択肢として表示）
	 */
	categories: Category[];
}

/**
 * 支出・収入一覧表示用のプロパティ
 */
export interface ExpenseListProps {
	/**
	 * 取引データの配列
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
	 * データ再取得用のコールバック
	 */
	onRefresh?: () => void;

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

/**
 * 新規取引登録ボタンのプロパティ
 */
export interface NewExpenseButtonProps {
	/**
	 * クリック時のハンドラー
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
 * 取引フィルターのプロパティ
 */
export interface ExpenseFilterProps {
	/**
	 * 取引種別フィルター
	 */
	type?: TransactionType;

	/**
	 * カテゴリフィルター
	 */
	categoryId?: string;

	/**
	 * 期間フィルター（開始日）
	 */
	dateFrom?: string;

	/**
	 * 期間フィルター（終了日）
	 */
	dateTo?: string;

	/**
	 * フィルター変更時のコールバック
	 */
	onFilterChange: (filters: ExpenseFilterState) => void;

	/**
	 * カテゴリ一覧
	 */
	categories: Category[];

	/**
	 * 追加のCSSクラス名
	 */
	className?: string;
}

/**
 * フィルター状態の型
 */
export interface ExpenseFilterState {
	type?: TransactionType;
	categoryId?: string;
	dateFrom?: string;
	dateTo?: string;
}
