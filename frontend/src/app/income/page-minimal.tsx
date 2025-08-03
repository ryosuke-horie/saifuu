"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { IncomeCategoryChart } from "@/components/income/IncomeCategoryChart";
import { IncomeFilters } from "@/components/income/IncomeFilters";
import { IncomeForm } from "@/components/income/IncomeForm";
import { IncomeList } from "@/components/income/IncomeList";
import { IncomeStats } from "@/components/income/IncomeStats";
import { PaginationControls } from "@/components/pagination/PaginationControls";
import { fetchCategories } from "@/lib/api/categories/api";
import type { TransactionWithCategory } from "@/lib/api/types";
import type { Category } from "@/types/category";
import type { IncomeCategoryData, IncomeFormData } from "@/types/income";

/**
 * 収入管理メインページ（最小限版）
 * メモリエラーのデバッグ用
 */
export default function IncomePageMinimal() {
	// カテゴリマスタの管理
	const [categories, setCategories] = useState<Category[]>([]);
	const [incomes, _setIncomes] = useState<TransactionWithCategory[]>([]);
	const [_stats, _setStats] = useState(null);
	const [loading, _setLoading] = useState(false);
	const [error, _setError] = useState<string | null>(null);

	// カテゴリデータの取得
	const fetchCategoriesData = useCallback(async () => {
		try {
			const response = await fetchCategories();
			const incomeCategories = response.filter(
				(category) => category.type === "income",
			);
			setCategories(incomeCategories);
		} catch (err) {
			console.error("カテゴリの取得に失敗しました", err);
		}
	}, []);

	// 初期データ取得
	useEffect(() => {
		fetchCategoriesData();
	}, [fetchCategoriesData]);

	// ダミーの統計データ
	const dummyStats = {
		currentMonth: 450000,
		lastMonth: 420000,
		currentYear: 5400000,
		monthOverMonth: 7.14,
		categoryBreakdown: [
			{ categoryId: "101", name: "給与", amount: 350000, percentage: 77.8 },
			{ categoryId: "102", name: "ボーナス", amount: 0, percentage: 0 },
			{ categoryId: "103", name: "副業", amount: 80000, percentage: 17.8 },
			{ categoryId: "104", name: "投資収益", amount: 20000, percentage: 4.4 },
		],
	};

	// カテゴリ別データの生成
	const categoryChartData = useMemo<IncomeCategoryData[]>(() => {
		return dummyStats.categoryBreakdown.map((item) => ({
			categoryId: Number(item.categoryId) || 0,
			name: item.name,
			amount: item.amount,
			percentage: item.percentage,
			color:
				categories.find((c) => c.id === item.categoryId)?.color || "#10b981",
		}));
	}, [categories]);

	// ダミーのページネーションデータ
	const pagination = {
		currentPage: 1,
		totalPages: 3,
		totalItems: 25,
		itemsPerPage: 10,
	};

	const handleSubmit = async (data: IncomeFormData) => {
		console.log("Submit", data);
	};

	const handleEdit = (transaction: TransactionWithCategory) => {
		console.log("Edit", transaction);
	};

	const handleDelete = (id: string) => {
		console.log("Delete", id);
	};

	const onPageChange = (page: number) => {
		console.log("Page change", page);
	};

	const onItemsPerPageChange = (itemsPerPage: number) => {
		console.log("Items per page change", itemsPerPage);
	};

	return (
		<div className="container mx-auto p-4">
			<h1 className="text-2xl font-bold mb-6">収入管理</h1>

			<div className="space-y-6">
				{/* 1. 収入統計カード（上部） */}
				<div data-testid="income-stats">
					<IncomeStats
						stats={{
							currentMonth: dummyStats.currentMonth,
							lastMonth: dummyStats.lastMonth,
							currentYear: dummyStats.currentYear,
							monthOverMonth: dummyStats.monthOverMonth,
							categoryBreakdown: dummyStats.categoryBreakdown.map((item) => ({
								categoryId: Number(item.categoryId) || 0,
								name: item.name,
								amount: item.amount,
								percentage: item.percentage,
							})),
						}}
						isLoading={loading}
						error={error ? new Error(error) : null}
					/>
				</div>

				{/* 2. フィルタリングコントロールとカテゴリグラフ（中部） */}
				<div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
					{/* フィルタ（左側 - 3列分） */}
					<div className="lg:col-span-3">
						<div data-testid="income-filters">
							<IncomeFilters
								onFiltersChange={() => {
									console.log("Filters changed");
								}}
								categories={categories}
							/>
						</div>
					</div>

					{/* カテゴリグラフ（右側 - 1列分） */}
					<div className="lg:col-span-1">
						<div data-testid="income-category-chart">
							<IncomeCategoryChart data={categoryChartData} />
						</div>
					</div>
				</div>

				{/* 3. 収入登録フォーム */}
				<div className="bg-white rounded-lg shadow p-4">
					<IncomeForm
						onSubmit={handleSubmit}
						onCancel={() => {}}
						isSubmitting={false}
						categories={categories}
					/>
				</div>

				{/* 4. 収入一覧テーブル（下部） */}
				<div data-testid="income-list">
					<IncomeList
						transactions={incomes}
						isLoading={loading}
						error={undefined}
						onEdit={handleEdit}
						onDelete={handleDelete}
					/>

					{/* ページネーションコントロール */}
					<div data-testid="pagination-controls" className="mt-4">
						<PaginationControls
							currentPage={pagination.currentPage}
							totalPages={pagination.totalPages}
							onPageChange={onPageChange}
							itemsPerPage={pagination.itemsPerPage}
							onItemsPerPageChange={onItemsPerPageChange}
							totalItems={pagination.totalItems}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
