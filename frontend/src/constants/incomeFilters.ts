/**
 * 収入フィルター関連の定数定義
 *
 * IncomeFiltersコンポーネントで使用される定数を一元管理
 * 再利用可能な設定値とメッセージを定義
 */

import type { IncomePeriodType } from "../types/income";

/**
 * 期間選択オプション
 * フィルターで選択可能な期間の定義
 */
export const PERIOD_OPTIONS = [
	{ value: "", label: "すべて" },
	{ value: "thisMonth", label: "今月" },
	{ value: "lastMonth", label: "先月" },
	{ value: "thisYear", label: "今年" },
	{ value: "custom", label: "カスタム期間" },
] as const satisfies ReadonlyArray<{
	readonly value: IncomePeriodType | "";
	readonly label: string;
}>;

/**
 * バリデーションエラーメッセージ
 * 金額入力時のエラーメッセージ定義
 */
export const VALIDATION_MESSAGES = {
        INVALID_NUMBER: "有効な数値を入力してください",
        NEGATIVE_MIN: "最小金額は0以上を指定してください",
        NEGATIVE_MAX: "最大金額は0以上を指定してください",
        MIN_GREATER_THAN_MAX: "最小金額は最大金額以下を指定してください",
        AMOUNT_TOO_LARGE: "金額が大きすぎます",
} as const;

/**
 * スタイル定数
 * コンポーネントのスタイリングに使用する定数
 */
export const FILTER_STYLES = {
	// コンテナ
	CONTAINER: "bg-green-50 p-4 rounded-lg shadow-sm space-y-4",

	// バッジ
	BADGE:
		"inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800",

	// フォーム要素
	INPUT:
		"w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500",
	SELECT:
		"w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500",
	CHECKBOX:
		"h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded",

	// ラベル
	LABEL: "block text-sm font-medium text-gray-700 mb-1",

	// ボタン
	RESET_BUTTON:
		"px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500",

	// エラー
	ERROR_MESSAGE: "mt-1 text-sm text-red-600",

	// カテゴリ
	CATEGORY_ITEM:
		"flex items-center space-x-2 cursor-pointer hover:bg-green-100 p-2 rounded",
	CATEGORY_GRID: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2",

	// レイアウト
	FLEX_MOBILE: "flex flex-col gap-4",
	FLEX_DESKTOP: "flex flex-row gap-4",
} as const;

/**
 * ARIAラベル
 * アクセシビリティ向上のためのラベル定義
 */
export const ARIA_LABELS = {
	CONTAINER: "収入フィルター",
	PERIOD: "期間",
	START_DATE: "開始日",
	END_DATE: "終了日",
	CATEGORY: "カテゴリ",
	MIN_AMOUNT: "最小金額",
	MAX_AMOUNT: "最大金額",
	RESET: "リセット",
} as const;

/**
 * プレースホルダー
 * 入力フィールドのプレースホルダーテキスト
 */
export const PLACEHOLDERS = {
	MIN_AMOUNT: "0",
	MAX_AMOUNT: "999999",
} as const;

/**
 * 期間ラベルマッピング
 * 期間タイプに対応する表示ラベル
 */
export const PERIOD_LABELS: Record<IncomePeriodType, string> = {
	thisMonth: "今月",
	lastMonth: "先月",
	thisYear: "今年",
	custom: "カスタム期間",
} as const;

/**
 * デフォルトカテゴリカラー
 * カテゴリに色が設定されていない場合のデフォルトカラー
 */
export const DEFAULT_CATEGORY_COLOR = "#10b981";
