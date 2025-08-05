/**
 * チャート状態管理のカスタムフック
 * チャートタイプの切り替えと選択状態を管理
 */

import { useCallback, useState } from "react";
import { CHART_TYPES, type ChartType } from "../constants";

/**
 * チャート状態管理フックの戻り値型
 */
type UseChartStateReturn = {
	chartType: ChartType;
	selectedCategory: string | null;
	toggleChartType: () => void;
	handleLegendItemClick: (categoryId: string) => void;
	isBarChart: boolean;
	isPieChart: boolean;
};

/**
 * チャート状態を管理するカスタムフック
 * チャートタイプの切り替えとカテゴリの選択状態を管理
 */
export function useChartState(): UseChartStateReturn {
	const [chartType, setChartType] = useState<ChartType>(CHART_TYPES.PIE);
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

	// チャートタイプの切り替え処理
	const toggleChartType = useCallback(() => {
		setChartType((prev) =>
			prev === CHART_TYPES.PIE ? CHART_TYPES.BAR : CHART_TYPES.PIE,
		);
	}, []);

	// 凡例アイテムのクリック処理
	const handleLegendItemClick = useCallback((categoryId: string) => {
		setSelectedCategory((prev) => (prev === categoryId ? null : categoryId));
	}, []);

	// チャートタイプの判定（メモ化）
	const isBarChart = chartType === CHART_TYPES.BAR;
	const isPieChart = chartType === CHART_TYPES.PIE;

	return {
		chartType,
		selectedCategory,
		toggleChartType,
		handleLegendItemClick,
		isBarChart,
		isPieChart,
	};
}
