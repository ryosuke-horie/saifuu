// グラフのカラーパレット定義
export const CHART_COLORS = {
	primary: "#3B82F6", // 青 - メインカラー
	success: "#10B981", // 緑 - 収入、成功状態
	danger: "#EF4444", // 赤 - 支出、エラー状態
	warning: "#F59E0B", // オレンジ - 警告
	purple: "#8B5CF6", // 紫 - 貯蓄率など
	pink: "#EC4899", // ピンク - アクセント
	gray: "#6B7280", // グレー - その他
} as const;

// PieChart用のカラー配列
export const PIE_CHART_COLORS = [
	CHART_COLORS.primary,
	CHART_COLORS.success,
	CHART_COLORS.warning,
	CHART_COLORS.danger,
	CHART_COLORS.purple,
	CHART_COLORS.pink,
	CHART_COLORS.gray,
] as const;

// 期間選択肢の定義
export const PERIOD_OPTIONS = [
	{ value: "3months", label: "過去3ヶ月" },
	{ value: "6months", label: "過去6ヶ月" },
	{ value: "1year", label: "過去1年" },
] as const;

// チャートのデフォルト高さ
export const CHART_HEIGHTS = {
	trend: 400,
	category: 300,
	savingsRate: 300,
} as const;

// チャートのデータキー定義（英語）
export const CHART_DATA_KEYS = {
	income: "income",
	expense: "expense",
	balance: "balance",
	savingsRate: "savingsRate",
} as const;

// チャートの表示ラベル定義（日本語）
export const CHART_LABELS = {
	[CHART_DATA_KEYS.income]: "収入",
	[CHART_DATA_KEYS.expense]: "支出",
	[CHART_DATA_KEYS.balance]: "残高",
	[CHART_DATA_KEYS.savingsRate]: "貯蓄率",
} as const;

// フォーマッター関数
export const formatCurrency = (value: number): string => {
	// Intl.NumberFormatを使用して国際化対応（LOW優先度の修正も含む）
	return new Intl.NumberFormat("ja-JP", {
		style: "currency",
		currency: "JPY",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(value);
};

export const formatPercentage = (value: number): string => {
	return `${value.toFixed(1)}%`;
};
