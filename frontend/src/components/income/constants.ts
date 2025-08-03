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

/**
 * アニメーション関連の定数
 */
export const ANIMATION = {
	TRANSITION_DURATION: 500,
} as const;

/**
 * 収入カテゴリチャート用の定数定義
 * 収入表示に特化した緑系統のカラーパレットや設定値を管理
 */

// 収入用の緑系統のカラーパレット
export const INCOME_COLORS = [
	"#10b981", // emerald-500
	"#059669", // emerald-600
	"#34d399", // emerald-400
	"#6ee7b7", // emerald-300
	"#a7f3d0", // emerald-200
] as const;

// チャートタイプの定数
export const CHART_TYPES = {
	PIE: "pie",
	BAR: "bar",
} as const;

// チャートタイプの型定義
export type ChartType = (typeof CHART_TYPES)[keyof typeof CHART_TYPES];

// チャートの高さ設定
export const CHART_HEIGHT = 384; // 96 * 4 = 384px (h-96相当)
export const PIE_OUTER_RADIUS = 120;

// レスポンシブブレークポイント
export const BREAKPOINTS = {
	MOBILE: 768,
} as const;

// グラフのマージン設定
export const BAR_CHART_MARGIN = {
	top: 20,
	right: 30,
	left: 20,
	bottom: 5,
} as const;

// チャートラベルの設定
export const CHART_LABELS = {
	title: "カテゴリ別収入",
	toggleToPie: "円グラフ",
	toggleToBar: "棒グラフ",
	toggleButton: "グラフ切り替え",
	chartAriaLabel: "カテゴリ別収入内訳",
	noData: "データがありません",
} as const;

// チャート用スタイル設定
export const CHART_STYLES = {
	container: "bg-white rounded-lg shadow-md p-6",
	containerMobile: "flex-col",
	containerDesktop: "flex-row",
	header: "flex justify-between items-center mb-4",
	title: "text-xl font-semibold",
	toggleButton:
		"px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors",
	chartArea: "h-96 w-full",
	legendContainer: "mt-4 space-y-2",
	legendItem: "flex items-center gap-2",
	legendButton: "flex items-center gap-2 hover:opacity-80 transition-opacity",
	legendDot: "w-4 h-4 rounded",
	legendText: "text-sm",
	legendDetail: "ml-auto flex gap-4 text-sm text-gray-600",
	noDataContainer: "flex items-center justify-center h-64 text-gray-500",
	srOnly: "sr-only",
} as const;
