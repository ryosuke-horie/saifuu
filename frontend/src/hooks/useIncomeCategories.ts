/**
 * 収入カテゴリ管理用カスタムフック
 *
 * カテゴリデータの取得と管理を担当
 * IncomePageContentから分離して単一責任の原則に従う
 */

import { useCallback, useEffect, useState } from "react";
import { fetchCategories } from "@/lib/api/categories/api";
import type { Category } from "@/types/category";

export const useIncomeCategories = () => {
	const [categories, setCategories] = useState<Category[]>([]);
	const [categoriesLoading, setCategoriesLoading] = useState(false);

	const fetchCategoriesData = useCallback(async () => {
		try {
			setCategoriesLoading(true);
			const response = await fetchCategories();
			// 収入カテゴリのみフィルタリング
			const incomeCategories = response.filter(
				(category) => category.type === "income",
			);
			setCategories(incomeCategories);
		} catch (err) {
			console.error("カテゴリの取得に失敗しました", err);
		} finally {
			setCategoriesLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchCategoriesData();
	}, [fetchCategoriesData]);

	return {
		categories,
		categoriesLoading,
		refetchCategories: fetchCategoriesData,
	};
};
