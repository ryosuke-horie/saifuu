"use client";

import { useMemo } from "react";
import { useIncomeCategories } from "@/hooks/useIncomeCategories";
import { useIncomeFilters } from "@/hooks/useIncomeFilters";
import { useIncomeOperations } from "@/hooks/useIncomeOperations";
import { useIncomeStatistics } from "@/hooks/useIncomeStatistics";
import { useIncomeStats } from "@/hooks/useIncomeStats";
import { useIncomesWithPagination } from "@/hooks/useIncomesWithPagination";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { calculatePercentage } from "@/lib/utils/calculations";
import type { IncomeCategoryData } from "@/types/income";
import { DeleteConfirmDialog } from "../../components/income/DeleteConfirmDialog";
import { IncomeCategoryChart } from "../../components/income/IncomeCategoryChart";
import { IncomeFilters } from "../../components/income/IncomeFilters";
import { IncomeForm } from "../../components/income/IncomeForm";
import { IncomeList } from "../../components/income/IncomeList";
import { IncomePageLayout } from "../../components/income/IncomePageLayout";
import { IncomeStats as IncomeStatsComponent } from "../../components/income/IncomeStats";
import { Pagination } from "../../components/ui/Pagination";

/**
 * 収入管理ページのメインコンテンツ
 *
 * 機能別にカスタムフックに分離してコンポーネントサイズを最適化
 * 単一責任の原則に従い、UIの組み立てのみに集中
 */
export function IncomePageContent() {
	// レスポンシブ対応
	const isMobile = useIsMobile();

	// ページネーション対応の収入データ取得
	const {
		incomes,
		loading: isLoading,
		error,
		pagination,
		currentPage,
		onPageChange,
		onItemsPerPageChange,
		refetch,
	} = useIncomesWithPagination({
		itemsPerPage: 10,
		syncWithUrl: true,
		sortBy: "date",
		sortOrder: "desc",
	});

	// カテゴリ管理
	const { categories } = useIncomeCategories();

	// 統計データ管理
	const { statsData, statsLoading, allIncomes, refetchStats } =
		useIncomeStatistics();

	// CRUD操作管理
	const {
		editingIncome,
		deleteTargetId,
		operationLoading,
		handleSubmit,
		handleEdit,
		handleDelete,
		handleDeleteConfirm,
		handleDeleteCancel,
		handleEditCancel,
	} = useIncomeOperations({
		onOperationComplete: refetch,
		onStatsRefresh: refetchStats,
	});

	// フィルタリング機能
	const { filters, updateFilters } = useIncomeFilters({
		disableUrlSync: false,
		// onFiltersChangeは削除（無限ループの原因）
		// フィルター変更時の再取得は手動で行う
	});

	// 収入統計の計算
	const stats = useIncomeStats(allIncomes, statsLoading);

	// カテゴリ別グラフ用データの準備
	const categoryChartData = useMemo<IncomeCategoryData[]>(() => {
		if (!incomes || incomes.length === 0) return [];

		const categoryMap = new Map<
			string,
			{ name: string; amount: number; color?: string }
		>();
		let totalAmount = 0;

		for (const income of incomes) {
			if (income.categoryId && income.category) {
				const existing = categoryMap.get(income.categoryId) || {
					name: income.category.name,
					amount: 0,
				};
				existing.amount += income.amount;
				categoryMap.set(income.categoryId, existing);
				totalAmount += income.amount;
			}
		}

		return Array.from(categoryMap.entries()).map(([categoryId, data]) => ({
			categoryId,
			name: data.name,
			amount: data.amount,
			percentage: calculatePercentage(data.amount, totalAmount),
			color: data.color,
		}));
	}, [incomes]);

	return (
		<IncomePageLayout>
			{/* 収入統計カード（全幅） */}
			<div className="mb-8">
				<IncomeStatsComponent
					stats={
						statsData || {
							currentMonth: stats.totalIncome,
							lastMonth: 0,
							currentYear: stats.totalIncome,
							monthOverMonth: 0,
							categoryBreakdown: [],
						}
					}
					isLoading={statsLoading}
					error={null}
				/>
			</div>

			{/* フィルターとカテゴリチャートのグリッド配置 */}
			<div
				className={`mb-8 ${isMobile ? "space-y-6" : "grid grid-cols-2 gap-6"}`}
			>
				{/* フィルターセクション */}
				<div className="bg-white rounded-lg shadow p-4">
					<h2 className="text-lg font-semibold mb-4">絞り込み条件</h2>
					<IncomeFilters
						onFiltersChange={updateFilters}
						categories={categories}
						initialFilters={filters}
						disableUrlSync={false}
					/>
				</div>

				{/* カテゴリ別グラフ */}
				<div className="bg-white rounded-lg shadow p-4">
					<IncomeCategoryChart data={categoryChartData} />
				</div>
			</div>

			{/* 収入登録フォーム */}
			<div className="mb-8 bg-white rounded-lg shadow p-6">
				<h2 className="text-lg font-semibold mb-4">
					{editingIncome ? "収入を編集" : "収入を登録"}
				</h2>
				<IncomeForm
					onSubmit={handleSubmit}
					onCancel={handleEditCancel}
					isSubmitting={operationLoading}
					initialData={
						editingIncome
							? {
									amount: editingIncome.amount,
									type: "income" as const,
									date: editingIncome.date,
									description: editingIncome.description || "",
									categoryId: editingIncome.categoryId || "",
								}
							: undefined
					}
					categories={categories}
				/>
			</div>

			{/* エラー表示 */}
			{error && !isLoading && (
				<div className="mb-4 p-4 bg-red-50 text-red-700 rounded">{error}</div>
			)}

			{/* ローディング表示 */}
			{isLoading && <div className="text-center py-8">読み込み中...</div>}

			{/* 収入一覧とページネーション */}
			{!isLoading && (
				<div className="bg-white rounded-lg shadow">
					<div className="p-6">
						<h2 className="text-lg font-semibold mb-4">収入一覧</h2>
						<IncomeList
							transactions={incomes}
							isLoading={isLoading}
							error={error || undefined}
							onEdit={handleEdit}
							onDelete={handleDelete}
						/>
					</div>

					{/* ページネーション */}
					{pagination && (
						<div className="border-t px-6 py-4">
							<Pagination
								currentPage={currentPage}
								totalPages={pagination.totalPages}
								totalItems={pagination.totalItems}
								itemsPerPage={pagination.itemsPerPage}
								onPageChange={onPageChange}
								onItemsPerPageChange={onItemsPerPageChange}
								isMobile={isMobile}
							/>
						</div>
					)}
				</div>
			)}

			{/* 削除確認ダイアログ */}
			<DeleteConfirmDialog
				isOpen={!!deleteTargetId}
				onConfirm={handleDeleteConfirm}
				onCancel={handleDeleteCancel}
				isLoading={operationLoading}
			/>
		</IncomePageLayout>
	);
}
