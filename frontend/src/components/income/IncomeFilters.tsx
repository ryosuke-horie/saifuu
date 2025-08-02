/**
 * IncomeFiltersコンポーネント
 *
 * 収入の絞り込み機能を提供するフィルタリングコンポーネント
 * 期間指定、カテゴリ絞り込み、金額範囲指定の機能を提供
 * URLパラメータとの双方向バインディングをサポート
 *
 * リファクタリング実装:
 * - 定数の外部化
 * - カスタムフックによる状態管理
 * - コンポーネントの分割と責務の明確化
 * - 型安全性の向上（Matt Pocock方針）
 * - パフォーマンス最適化（React.memo, useCallback）
 * - アクセシビリティの改善
 */

import type React from "react";
import { useCallback, useMemo } from "react";
import { ARIA_LABELS, FILTER_STYLES } from "../../constants/incomeFilters";
import { useIncomeFilters } from "../../hooks/useIncomeFilters";
import { useIsMobile } from "../../hooks/useMediaQuery";
import type { IncomeFiltersProps } from "../../types/income";
import { ActiveFilterBadges } from "./filters/ActiveFilterBadges";
import { AmountRangeFilter } from "./filters/AmountRangeFilter";
import { CategoryFilter } from "./filters/CategoryFilter";
import { PeriodFilter } from "./filters/PeriodFilter";

/**
 * IncomeFiltersコンポーネント
 */
export const IncomeFilters: React.FC<IncomeFiltersProps> = ({
	onFiltersChange,
	categories,
	initialFilters = {},
	className = "",
	disableUrlSync = false,
}) => {
	// モバイル判定
	const isMobile = useIsMobile();

	// フィルター状態管理
	const {
		filters,
		updateFilter,
		resetFilters,
		toggleCategory,
		selectedCategories,
	} = useIncomeFilters({
		initialFilters,
		disableUrlSync,
		onFiltersChange,
	});

	// コールバック関数のメモ化
	const handlePeriodChange = useCallback(
		(period: Parameters<typeof updateFilter>[1]) => {
			updateFilter("period", period as any);
		},
		[updateFilter],
	);

	const handleStartDateChange = useCallback(
		(date: string) => {
			updateFilter("startDate", date);
		},
		[updateFilter],
	);

	const handleEndDateChange = useCallback(
		(date: string) => {
			updateFilter("endDate", date);
		},
		[updateFilter],
	);

	const handleMinAmountChange = useCallback(
		(amount: number | undefined) => {
			updateFilter("minAmount", amount);
		},
		[updateFilter],
	);

	const handleMaxAmountChange = useCallback(
		(amount: number | undefined) => {
			updateFilter("maxAmount", amount);
		},
		[updateFilter],
	);

	// コンテナのクラス名を生成
	const containerClassName = useMemo(
		() => `${FILTER_STYLES.CONTAINER} ${className}`,
		[className],
	);

	return (
		<div
			data-testid="income-filters"
			className={containerClassName}
			role="search"
			aria-label={ARIA_LABELS.CONTAINER}
		>
			{/* アクティブフィルターのバッジ表示 */}
			<ActiveFilterBadges filters={filters} categories={categories} />

			{/* 期間フィルター */}
			<PeriodFilter
				period={filters.period || ""}
				startDate={filters.startDate}
				endDate={filters.endDate}
				onPeriodChange={handlePeriodChange}
				onStartDateChange={handleStartDateChange}
				onEndDateChange={handleEndDateChange}
				isMobile={isMobile}
			/>

			{/* カテゴリフィルター */}
			<CategoryFilter
				categories={categories}
				selectedCategories={selectedCategories}
				onToggleCategory={toggleCategory}
			/>

			{/* 金額範囲フィルター */}
			<AmountRangeFilter
				minAmount={filters.minAmount}
				maxAmount={filters.maxAmount}
				onMinAmountChange={handleMinAmountChange}
				onMaxAmountChange={handleMaxAmountChange}
				onReset={resetFilters}
				isMobile={isMobile}
			/>
		</div>
	);
};
