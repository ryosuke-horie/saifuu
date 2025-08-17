/**
 * 収入フォーム関連の型定義
 *
 * 収入管理機能で使用されるデータ型を定義
 */

import type { Category, Transaction } from "../lib/api/types";

// 基本型をre-export
export type { TransactionType } from "../lib/api/types";

/**
 * カテゴリ別収入内訳
 */
export interface CategoryBreakdown {
	readonly categoryId: string;
	readonly name: string;
	readonly amount: number;
	readonly percentage: number;
}

/**
 * 収入統計レスポンスの型定義
 * APIから返される収入統計データの構造
 */
export interface IncomeStatistics {
	readonly currentMonth: number;
	readonly lastMonth: number;
	readonly currentYear: number;
	readonly monthOverMonth: number;
	readonly categoryBreakdown: readonly CategoryBreakdown[];
}

/**
 * IncomeStatsコンポーネントのプロパティ型
 */
export interface IncomeStatsProps {
	readonly stats: IncomeStatistics;
	readonly isLoading?: boolean;
	readonly error?: Error | null;
}

/**
 * IncomeStats型のエイリアス（後方互換性のため）
 */
export type IncomeStats = IncomeStatistics;

/**
 * カテゴリ別グラフデータ
 */
export interface IncomeCategoryData {
	categoryId: string;
	name: string;
	amount: number;
	percentage: number;
	color?: string;
}

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
	 * 成功時はtrueを返す
	 */
	onSubmit: (data: IncomeFormData) => Promise<boolean> | boolean;

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
	error?: string;

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
 * 収入フィルターの期間タイプ
 */
export type IncomePeriodType =
	| "thisMonth"
	| "lastMonth"
	| "thisYear"
	| "custom";

/**
 * 収入フィルターの状態
 */
export interface IncomeFiltersState {
	/**
	 * 期間タイプ
	 */
	period?: IncomePeriodType;

	/**
	 * カスタム期間の開始日（YYYY-MM-DD形式）
	 */
	startDate?: string;

	/**
	 * カスタム期間の終了日（YYYY-MM-DD形式）
	 */
	endDate?: string;

	/**
	 * カテゴリIDの配列（複数選択可能）
	 */
	categories?: string[];

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
