"use client";

import { useMemo } from "react";
import { IncomeCategoryChart } from "@/components/income/IncomeCategoryChart";
import { IncomeList } from "@/components/income/IncomeList";
import { IncomeStats } from "@/components/income/IncomeStats";
import { PaginationControls } from "@/components/pagination/PaginationControls";
import type { IncomeCategoryData } from "@/types/income";

/**
 * 収入管理メインページ（フィルタなし版）
 * メモリエラーのデバッグ用
 */
export default function IncomePageWithoutFilters() {
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
			color: "#10b981",
		}));
	}, []);

	// ダミーのページネーションデータ
	const pagination = {
		currentPage: 1,
		totalPages: 3,
		totalItems: 25,
		itemsPerPage: 10,
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
						isLoading={false}
						error={null}
					/>
				</div>

				{/* 2. フィルタリングコントロールとカテゴリグラフ（中部） */}
				<div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
					{/* フィルタ（左側 - 3列分） */}
					<div className="lg:col-span-3">
						<div data-testid="income-filters">
							{/* フィルタコンポーネントの代わりにダミー要素 */}
							<div className="p-4 bg-gray-100 rounded">フィルタ機能</div>
						</div>
					</div>

					{/* カテゴリグラフ（右側 - 1列分） */}
					<div className="lg:col-span-1">
						<div data-testid="income-category-chart">
							<IncomeCategoryChart data={categoryChartData} />
						</div>
					</div>
				</div>

				{/* 4. 収入一覧テーブル（下部） */}
				<div data-testid="income-list">
					<IncomeList
						transactions={[]}
						isLoading={false}
						error={undefined}
						onEdit={() => {}}
						onDelete={() => {}}
					/>

					{/* ページネーションコントロール */}
					<div data-testid="pagination-controls" className="mt-4">
						<PaginationControls
							currentPage={pagination.currentPage}
							totalPages={pagination.totalPages}
							onPageChange={() => {}}
							itemsPerPage={pagination.itemsPerPage}
							onItemsPerPageChange={() => {}}
							totalItems={pagination.totalItems}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
