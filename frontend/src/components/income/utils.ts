/**
 * 収入統計コンポーネントのユーティリティ関数
 * 共通処理を関数として切り出し
 */

import { CURRENCY_SYMBOL, LOCALE_JP } from "./constants";

/**
 * 数値を日本円形式にフォーマット
 * @param amount - フォーマット対象の金額
 * @returns フォーマットされた金額文字列
 *
 * @example
 * formatCurrency(1000) // "¥1,000"
 * formatCurrency(1000000) // "¥1,000,000"
 */
export const formatCurrency = (amount: number): string => {
	const formatted = amount.toLocaleString(LOCALE_JP);
	return `${CURRENCY_SYMBOL}${formatted}`;
};
