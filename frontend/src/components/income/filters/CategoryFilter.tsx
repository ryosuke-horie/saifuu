/**
 * CategoryFilterコンポーネント
 *
 * カテゴリの複数選択フィルターを提供
 * チェックボックス形式でカテゴリを選択可能
 */

import React from "react";
import {
	ARIA_LABELS,
	DEFAULT_CATEGORY_COLOR,
	FILTER_STYLES,
} from "../../../constants/incomeFilters";
import type { Category } from "../../../lib/api/types";

interface CategoryFilterProps {
	/** カテゴリ一覧 */
	categories: Category[];
	/** 選択されているカテゴリID */
	selectedCategories: string[];
	/** カテゴリ選択/解除時のコールバック */
	onToggleCategory: (categoryId: string) => void;
}

/**
 * CategoryFilterコンポーネント
 */
export const CategoryFilter = React.memo<CategoryFilterProps>(
	({ categories, selectedCategories, onToggleCategory }) => {
		const handleToggle = (categoryId: string) => () => {
			// 空のIDは無視する
			if (categoryId) {
				onToggleCategory(categoryId);
			}
		};

		return (
			<div>
				<div className={FILTER_STYLES.LABEL}>{ARIA_LABELS.CATEGORY}</div>
				<div className={FILTER_STYLES.CATEGORY_GRID}>
					{categories.map((category) => {
						// numericIdが存在しないカテゴリはスキップ
						if (!category.numericId) {
							return null;
						}

						const categoryId = category.numericId.toString();
						const isChecked = selectedCategories.includes(categoryId);
						const color = category.color || DEFAULT_CATEGORY_COLOR;

						return (
							<label key={category.id} className={FILTER_STYLES.CATEGORY_ITEM}>
								<input
									type="checkbox"
									checked={isChecked}
									onChange={handleToggle(categoryId)}
									className={FILTER_STYLES.CHECKBOX}
									aria-label={category.name}
								/>
								<span className="text-sm" style={{ color }}>
									{category.name}
								</span>
							</label>
						);
					})}
				</div>
			</div>
		);
	},
);

CategoryFilter.displayName = "CategoryFilter";
