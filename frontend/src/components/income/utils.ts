/**
 * 収入統計コンポーネントのユーティリティ関数
 * 共通処理を関数として切り出し
 */

import { CURRENCY_SYMBOL, LOCALE_JP } from "./constants";
import type { IncomeCategoryData } from "./types";

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

/**
 * スクリーンリーダー用の説明文を生成
 * @param data - カテゴリデータの配列
 * @returns アクセシビリティ用の説明文
 */
export function generateSrDescription(data: IncomeCategoryData[]): string {
	if (data.length === 0) {
		return "データがありません";
	}

	const descriptions = data.map((item) => `${item.name}が${item.percentage}%`);
	return `${descriptions.join("、")}を占めています`;
}

/**
 * チャートデータにカラーを割り当て
 * 既にカラーが設定されている場合はそれを使用
 * @param data - カテゴリデータ
 * @param index - 配列内のインデックス
 * @param colors - カラーパレット
 * @returns 割り当てられた色
 */
export function getChartColor(
	data: IncomeCategoryData,
	index: number,
	colors: readonly string[],
): string {
	return data.color || colors[index % colors.length];
}

/**
 * パーセンテージラベルを生成
 * @param entry - カテゴリデータ
 * @returns ラベル文字列
 */
export function generatePieLabel(entry: IncomeCategoryData): string {
	return `${entry.name}: ${entry.percentage}%`;
}
