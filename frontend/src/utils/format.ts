/**
 * フォーマット関数のユーティリティ
 *
 * 数値、日付、その他のデータフォーマットを統一的に処理
 * 支出管理機能全体で再利用可能
 */

/**
 * 金額を日本円形式でフォーマット
 * @param amount フォーマットする金額
 * @param isNegative 負の値として表示するか（支出表示用）
 */
export const formatCurrency = (amount: number, isNegative = false): string => {
	const formatted = new Intl.NumberFormat("ja-JP", {
		style: "currency",
		currency: "JPY",
	}).format(amount);
	return isNegative ? `-${formatted}` : formatted;
};

/**
 * 日付を日本語形式でフォーマット（YYYY/MM/DD）
 * @param dateString ISO日付文字列またはDate文字列
 */
export const formatDate = (dateString: string): string => {
	const date = new Date(dateString);
	return date.toLocaleDateString("ja-JP", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});
};

/**
 * パーセンテージをフォーマット（前月比用）
 * @param percentage パーセンテージ値
 */
export const formatPercentage = (percentage: number): string => {
	const sign = percentage >= 0 ? "+" : "";
	return `${sign}${percentage.toFixed(1)}%`;
};

/**
 * 取引件数をフォーマット
 * @param count 件数
 */
export const formatTransactionCount = (count: number): string => {
	return `${count}件`;
};

/**
 * カテゴリ名を取得（null安全）
 * @param category カテゴリオブジェクトまたはnull
 */
export const formatCategoryName = (category: any): string => {
	if (category && typeof category === "object" && category.name) {
		return category.name;
	}
	return "未分類";
};
