/**
 * カテゴリ別内訳セクションコンポーネント
 * 収入のカテゴリ別内訳を表示
 */

import React from "react";
import type { CategoryBreakdown } from "@/types/income";
import { STAT_LABELS, STYLES } from "./constants";
import { formatCurrency } from "./utils";

/**
 * カテゴリ別内訳セクションのプロパティ型
 */
interface CategoryBreakdownSectionProps {
	readonly categoryBreakdown: readonly CategoryBreakdown[];
}

/**
 * カテゴリアイテムコンポーネント
 * 個々のカテゴリ情報を表示
 */
const CategoryItem = React.memo<CategoryBreakdown>(
	({ name, amount, percentage }) => {
		return (
			<div className={STYLES.CATEGORY_ITEM}>
				<span className={STYLES.CATEGORY_NAME}>{name}</span>
				<div className={STYLES.CATEGORY_VALUE_WRAPPER}>
					<span className={STYLES.CATEGORY_AMOUNT}>
						{formatCurrency(amount)}
					</span>
					<span className={STYLES.CATEGORY_PERCENTAGE}>({percentage}%)</span>
				</div>
			</div>
		);
	},
);

CategoryItem.displayName = "CategoryItem";

/**
 * カテゴリ別内訳セクションコンポーネント
 * カテゴリ別の収入内訳を一覧表示
 */
export const CategoryBreakdownSection =
	React.memo<CategoryBreakdownSectionProps>(({ categoryBreakdown }) => {
		// カテゴリがない場合は何も表示しない
		if (categoryBreakdown.length === 0) {
			return null;
		}

		return (
			<div className={STYLES.CATEGORY_CONTAINER}>
				<h3 className={STYLES.CATEGORY_TITLE}>
					{STAT_LABELS.CATEGORY_BREAKDOWN}
				</h3>
				<div className={STYLES.CATEGORY_CARD}>
					<div className={STYLES.CATEGORY_LIST}>
						{categoryBreakdown.map((category) => (
							<CategoryItem key={category.categoryId} {...category} />
						))}
					</div>
				</div>
			</div>
		);
	});

// デバッグ用の表示名を設定
CategoryBreakdownSection.displayName = "CategoryBreakdownSection";
