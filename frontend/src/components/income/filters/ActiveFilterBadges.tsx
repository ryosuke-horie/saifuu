/**
 * ActiveFilterBadgesコンポーネント
 *
 * 選択中のフィルターをバッジ形式で表示
 * 視覚的にアクティブなフィルターを確認可能
 */

import React from "react";
import { FILTER_STYLES, PERIOD_LABELS } from "../../../constants/incomeFilters";
import type { Category } from "../../../lib/api/types";
import type { IncomeFiltersState } from "../../../types/income";

interface ActiveFilterBadgesProps {
	/** フィルター状態 */
	filters: IncomeFiltersState;
	/** カテゴリ一覧 */
	categories: Category[];
}

/**
 * 金額をフォーマット
 */
const formatAmount = (amount: number): string => {
	return `¥${amount.toLocaleString()}`;
};

/**
 * フィルターバッジ情報
 */
interface FilterBadge {
	key: string;
	label: string;
}

/**
 * アクティブフィルターのバッジ情報を生成
 */
const getActiveFilterBadges = (
	filters: IncomeFiltersState,
	categories: Category[],
): FilterBadge[] => {
	const badges: FilterBadge[] = [];

	// 期間フィルター
	if (filters.period && filters.period in PERIOD_LABELS) {
		badges.push({
			key: `period-${filters.period}`,
			label: PERIOD_LABELS[filters.period],
		});
	}

	// カテゴリフィルター
	if (filters.categories) {
		filters.categories.forEach((categoryId) => {
			const category = categories.find(
				(c) => c.numericId?.toString() === categoryId,
			);
			if (category) {
				badges.push({
					key: `category-${categoryId}`,
					label: category.name,
				});
			}
		});
	}

	// 最小金額フィルター
	if (filters.minAmount !== undefined) {
		badges.push({
			key: "minAmount",
			label: `${formatAmount(filters.minAmount)}以上`,
		});
	}

	// 最大金額フィルター
	if (filters.maxAmount !== undefined) {
		badges.push({
			key: "maxAmount",
			label: `${formatAmount(filters.maxAmount)}以下`,
		});
	}

	return badges;
};

/**
 * ActiveFilterBadgesコンポーネント
 */
export const ActiveFilterBadges = React.memo<ActiveFilterBadgesProps>(
	({ filters, categories }) => {
		const badges = getActiveFilterBadges(filters, categories);

		if (badges.length === 0) {
			return null;
		}

		return (
			<div className="flex flex-wrap gap-2" role="status" aria-live="polite">
				{badges.map((badge) => (
					<span key={badge.key} className={FILTER_STYLES.BADGE}>
						{badge.label}
					</span>
				))}
			</div>
		);
	},
);

ActiveFilterBadges.displayName = "ActiveFilterBadges";
