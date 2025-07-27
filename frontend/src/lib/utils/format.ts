/**
 * フォーマット関連のユーティリティ関数
 */

/**
 * 金額を日本円形式でフォーマット
 * @param amount 金額
 * @returns フォーマットされた金額文字列
 */
export const formatCurrency = (amount: number) => {
	return new Intl.NumberFormat("ja-JP", {
		style: "currency",
		currency: "JPY",
		minimumFractionDigits: 0,
	})
		.format(amount)
		.replace("￥", "¥");
};

/**
 * 日付を日本語形式でフォーマット
 * @param date 日付文字列またはDateオブジェクト
 * @returns フォーマットされた日付文字列
 */
export const formatDate = (date: string | Date) => {
	const dateObj = typeof date === "string" ? new Date(date) : date;
	return new Intl.DateTimeFormat("ja-JP", {
		year: "numeric",
		month: "long",
		day: "numeric",
	}).format(dateObj);
};

/**
 * 数値を短縮形式でフォーマット（例: 1,000 → 1K）
 * @param num 数値
 * @returns フォーマットされた数値文字列
 */
export const formatCompactNumber = (num: number) => {
	return new Intl.NumberFormat("ja-JP", {
		notation: "compact",
		compactDisplay: "short",
	}).format(num);
};
