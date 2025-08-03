/**
 * 収入統計コンポーネントで使用する定数定義
 * マジックナンバーや固定文字列を一元管理
 */

/**
 * スケルトンカードの表示数
 * グリッド表示する統計カードの数に対応
 */
export const SKELETON_CARD_COUNT = 4 as const;

/**
 * 日本語ロケール設定
 * 通貨フォーマットで使用
 */
export const LOCALE_JP = "ja-JP" as const;

/**
 * 通貨記号
 */
export const CURRENCY_SYMBOL = "¥" as const;

/**
 * トレンド表示の定数
 * 前月比の増減を示すアイコンと色の定義
 */
export const TREND_CONFIG = {
	UP: {
		icon: "↑",
		className: "text-green-600",
		testId: "trend-up-icon",
	},
	DOWN: {
		icon: "↓",
		className: "text-red-600",
		testId: "trend-down-icon",
	},
	FLAT: {
		icon: "→",
		className: "text-gray-600",
		testId: "trend-flat-icon",
	},
} as const;

/**
 * 統計カードのラベル
 * 各統計カードのタイトル
 */
export const STAT_LABELS = {
	CURRENT_MONTH: "今月の収入",
	LAST_MONTH: "先月の収入",
	CURRENT_YEAR: "今年の収入",
	MONTH_OVER_MONTH: "前月比",
	CATEGORY_BREAKDOWN: "カテゴリ別内訳",
} as const;

/**
 * エラー表示のテキスト
 */
export const ERROR_MESSAGES = {
	TITLE: "エラーが発生しました",
} as const;

/**
 * スタイリング関連の定数
 * 共通で使用するCSSクラス名
 */
export const STYLES = {
	CARD_BASE:
		"bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 shadow-sm border border-green-100",
	CARD_TITLE: "text-sm font-medium text-gray-600 mb-2",
	CARD_VALUE: "text-2xl font-bold text-gray-900 transition-all duration-500",
	GRID_RESPONSIVE: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6",
	SKELETON: "bg-gray-100 rounded-lg p-6 h-32 animate-pulse",
	ERROR_CONTAINER: "p-6 bg-red-50 rounded-lg",
	ERROR_TITLE: "text-red-800 font-semibold",
	ERROR_MESSAGE: "text-red-600 mt-2",
	CATEGORY_CONTAINER: "mt-8",
	CATEGORY_TITLE: "text-lg font-semibold text-gray-900 mb-4",
	CATEGORY_CARD: "bg-white rounded-lg shadow-sm border border-gray-200 p-6",
	CATEGORY_LIST: "space-y-3",
	CATEGORY_ITEM: "flex justify-between items-center",
	CATEGORY_NAME: "text-gray-700 font-medium",
	CATEGORY_VALUE_WRAPPER: "flex items-center gap-2",
	CATEGORY_AMOUNT: "text-gray-900 font-semibold",
	CATEGORY_PERCENTAGE: "text-gray-500 text-sm",
} as const;
