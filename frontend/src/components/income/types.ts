/**
 * 収入カテゴリチャート関連の型定義
 * Matt Pocock方針に従った明示的で再利用可能な型
 */

import type { ChartType } from "./constants";

/**
 * カテゴリデータの型定義
 * 各収入カテゴリの金額と割合を表現
 */
export type IncomeCategoryData = {
	readonly categoryId: number;
	readonly name: string;
	readonly amount: number;
	readonly percentage: number;
	readonly color: string;
};

/**
 * チャートコンポーネントのプロパティ型
 */
export type IncomeCategoryChartProps = {
	readonly data: IncomeCategoryData[];
};

/**
 * チャート表示状態の型
 */
export type ChartState = {
	readonly chartType: ChartType;
	readonly selectedCategory: number | null;
};

/**
 * 型ガード: IncomeCategoryDataかどうかを判定
 */
export function isIncomeCategoryData(
	value: unknown,
): value is IncomeCategoryData {
	return (
		typeof value === "object" &&
		value !== null &&
		"categoryId" in value &&
		"name" in value &&
		"amount" in value &&
		"percentage" in value &&
		"color" in value &&
		typeof (value as IncomeCategoryData).categoryId === "number" &&
		typeof (value as IncomeCategoryData).name === "string" &&
		typeof (value as IncomeCategoryData).amount === "number" &&
		typeof (value as IncomeCategoryData).percentage === "number" &&
		typeof (value as IncomeCategoryData).color === "string"
	);
}

/**
 * 型ガード: データ配列が有効かどうかを判定
 */
export function isValidDataArray(data: unknown): data is IncomeCategoryData[] {
	return Array.isArray(data) && data.every(isIncomeCategoryData);
}
