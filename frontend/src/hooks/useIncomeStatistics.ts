/**
 * 収入統計管理用カスタムフック
 *
 * 統計データの取得と計算ロジックを管理
 * IncomePageContentから分離して単一責任の原則に従う
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { apiClient } from "@/lib/api/client";
import type { TransactionWithCategory } from "@/lib/api/types";
import {
	calculateMonthOverMonth,
	calculatePercentage,
} from "@/lib/utils/calculations";
import type { IncomeStats } from "@/types/income";

export const useIncomeStatistics = () => {
	const [statsData, setStatsData] = useState<IncomeStats | null>(null);
	const [statsLoading, setStatsLoading] = useState(true);
	const [allIncomes, setAllIncomes] = useState<TransactionWithCategory[]>([]);
	const isInitialMount = useRef(true);

	const fetchStatsData = useCallback(async () => {
		try {
			setStatsLoading(true);
			// 全収入データを取得して統計計算用に使用
			const response = await apiClient.transactions.list({
				type: "income",
				limit: 1000, // 統計計算のため全データ取得
			});
			const incomesWithCategory = response.data as TransactionWithCategory[];
			setAllIncomes(incomesWithCategory);

			// 統計データの計算
			const now = new Date();
			const currentYear = now.getFullYear();
			const currentMonth = now.getMonth();
			const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
			const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

			// 今月の収入
			const currentMonthIncomes = incomesWithCategory.filter((t) => {
				const date = new Date(t.date);
				return (
					date.getFullYear() === currentYear && date.getMonth() === currentMonth
				);
			});
			const currentMonthTotal = currentMonthIncomes.reduce(
				(sum, t) => sum + t.amount,
				0,
			);

			// 先月の収入
			const lastMonthIncomes = incomesWithCategory.filter((t) => {
				const date = new Date(t.date);
				return (
					date.getFullYear() === lastMonthYear && date.getMonth() === lastMonth
				);
			});
			const lastMonthTotal = lastMonthIncomes.reduce(
				(sum, t) => sum + t.amount,
				0,
			);

			// 今年の収入
			const currentYearIncomes = incomesWithCategory.filter((t) => {
				const date = new Date(t.date);
				return date.getFullYear() === currentYear;
			});
			const currentYearTotal = currentYearIncomes.reduce(
				(sum, t) => sum + t.amount,
				0,
			);

			// 前月比の計算
			const monthOverMonth = calculateMonthOverMonth(
				currentMonthTotal,
				lastMonthTotal,
			);

			// カテゴリ別内訳の計算
			const categoryMap = new Map<string, { name: string; amount: number }>();
			for (const income of currentMonthIncomes) {
				if (income.categoryId && income.category) {
					const existing = categoryMap.get(income.categoryId) || {
						name: income.category.name,
						amount: 0,
					};
					existing.amount += income.amount;
					categoryMap.set(income.categoryId, existing);
				}
			}

			const categoryBreakdown = Array.from(categoryMap.entries()).map(
				([categoryId, data]) => ({
					categoryId,
					name: data.name,
					amount: data.amount,
					percentage: calculatePercentage(data.amount, currentMonthTotal),
				}),
			);

			setStatsData({
				currentMonth: currentMonthTotal,
				lastMonth: lastMonthTotal,
				currentYear: currentYearTotal,
				monthOverMonth,
				categoryBreakdown,
			});
		} catch (err) {
			console.error("統計データの取得に失敗しました", err);
		} finally {
			setStatsLoading(false);
		}
	}, []);

	useEffect(() => {
		if (isInitialMount.current) {
			isInitialMount.current = false;
			fetchStatsData();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // 初回マウント時のみ実行

	return {
		statsData,
		statsLoading,
		allIncomes,
		refetchStats: fetchStatsData,
	};
};
