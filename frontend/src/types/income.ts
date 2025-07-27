/**
 * 収入フォーム関連の型定義
 *
 * 収入管理機能で使用されるデータ型を定義
 */

import type { Category, Transaction, TransactionType } from "../lib/api/types";

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
	type: TransactionType;

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
 * 新規収入登録ダイアログのプロパティ
 */
export interface NewIncomeDialogProps {
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
	onSubmit: (data: IncomeFormData) => void;

	/**
	 * 送信中の状態
	 */
	isSubmitting?: boolean;

	/**
	 * カテゴリ一覧（フォームで選択肢として表示）
	 * 未指定の場合はグローバル設定から取得
	 */
	categories?: Category[];
}

/**
 * 収入編集ダイアログのプロパティ
 */
export interface EditIncomeDialogProps {
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
	 * IDと更新データを受け取る
	 */
	onSubmit: (id: string, data: IncomeFormData) => void;

	/**
	 * 送信中の状態
	 */
	isSubmitting?: boolean;

	/**
	 * 編集対象の取引データ
	 */
	transaction: Transaction | null;

	/**
	 * カテゴリ一覧（フォームで選択肢として表示）
	 * 未指定の場合はグローバル設定から取得
	 */
	categories?: Category[];
}

/**
 * 収入一覧表示用のプロパティ
 */
export interface IncomeListProps {
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
 * 収入統計カードのプロパティ
 */
export interface IncomeStatsProps {
	/**
	 * 今月の収入合計
	 */
	currentMonthTotal: number;

	/**
	 * 先月の収入合計
	 */
	lastMonthTotal: number;

	/**
	 * 今年の収入合計
	 */
	currentYearTotal: number;

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
 * 収入フィルターのプロパティ
 */
export interface IncomeFilterProps {
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
	 * 最小金額フィルター
	 */
	minAmount?: number;

	/**
	 * 最大金額フィルター
	 */
	maxAmount?: number;

	/**
	 * フィルター変更時のコールバック
	 */
	onFilterChange: (filters: IncomeFilterState) => void;

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
 * 収入フィルター状態の型
 */
export interface IncomeFilterState {
	categoryId?: string;
	dateFrom?: string;
	dateTo?: string;
	minAmount?: number;
	maxAmount?: number;
}

/**
 * 拡張されたフィルタリングオプション
 * IncomeFiltersコンポーネント用の型定義
 */
export type PeriodType =
	| "current_month"
	| "last_month"
	| "current_year"
	| "custom";

/**
 * IncomeFiltersコンポーネントのフィルター状態
 */
export interface IncomeFiltersState {
	/**
	 * 期間タイプ
	 */
	period?: PeriodType;

	/**
	 * カスタム期間の開始日（YYYY-MM-DD形式）
	 */
	dateFrom?: string;

	/**
	 * カスタム期間の終了日（YYYY-MM-DD形式）
	 */
	dateTo?: string;

	/**
	 * カテゴリIDの配列（複数選択可能）
	 */
	categoryIds?: string[];

	/**
	 * 最小金額
	 */
	minAmount?: number;

	/**
	 * 最大金額
	 */
	maxAmount?: number;
}

/**
 * IncomeFiltersコンポーネントのプロパティ
 */
export interface IncomeFiltersProps {
	/**
	 * フィルター変更時のコールバック
	 */
	onFiltersChange: (filters: IncomeFiltersState) => void;

	/**
	 * カテゴリ一覧
	 */
	categories: Category[];

	/**
	 * 初期フィルター状態（オプション）
	 */
	initialFilters?: IncomeFiltersState;

	/**
	 * 追加のCSSクラス名
	 */
	className?: string;

	/**
	 * URLパラメータとの同期を無効化（オプション）
	 */
	disableUrlSync?: boolean;
}
