"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DeleteConfirmDialog } from "@/components/income/DeleteConfirmDialog";
import { IncomeCategoryChart } from "@/components/income/IncomeCategoryChart";
import { IncomeFilters } from "@/components/income/IncomeFilters";
import { IncomeForm } from "@/components/income/IncomeForm";
import { IncomeList } from "@/components/income/IncomeList";
import { IncomeStats } from "@/components/income/IncomeStats";
import { PaginationControls } from "@/components/pagination/PaginationControls";
import { useIncomeStats } from "@/hooks/useIncomeStatsApi";
import { useIncomesWithPagination } from "@/hooks/useIncomesWithPagination";
import { fetchCategories } from "@/lib/api/categories/api";
import { apiClient } from "@/lib/api/client";
import type { TransactionWithCategory } from "@/lib/api/types";
import type { Category } from "@/types/category";
import type {
	IncomeCategoryData,
	IncomeFiltersState,
	IncomeFormData,
} from "@/types/income";

/**
 * 収入管理メインページ（統合版）
 *
 * Issue #408: Phase 2-6の要件に基づいた統合実装
 * - 統計カード、フィルタ、グラフ、一覧の統合
 * - レイアウトの最適化
 * - パフォーマンスの向上（並列データフェッチ）
 */
export default function IncomePage() {
	// パフォーマンス計測開始
	useEffect(() => {
		if (typeof window !== "undefined" && window.performance) {
			performance.mark("page-start");
		}
	}, []);

	// カテゴリマスタの管理
	const [categories, setCategories] = useState<Category[]>([]);
	const [editingIncome, setEditingIncome] =
		useState<TransactionWithCategory | null>(null);
	const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
	const [operationLoading, setOperationLoading] = useState(false);

	// フィルタ状態を直接管理（useIncomeFiltersフックを使わない）
	const [filters, setFilters] = useState<IncomeFiltersState>({});

	// ページネーション対応の収入データ管理
	const {
		incomes,
		loading: incomesLoading,
		error: incomesError,
		pagination,
		currentPage,
		onPageChange,
		onItemsPerPageChange,
		refetch,
	} = useIncomesWithPagination({
		itemsPerPage: 10,
		syncWithUrl: true,
	});

	// 統計データ管理
	const {
		stats,
		loading: statsLoading,
		error: statsError,
		refetch: refetchStats,
	} = useIncomeStats();

	// カテゴリ別データの生成
	const categoryChartData = useMemo<IncomeCategoryData[]>(() => {
		if (!stats?.categoryBreakdown) return [];
		return stats.categoryBreakdown.map((item) => ({
			categoryId: Number(item.categoryId) || 0,
			name: item.name,
			amount: item.amount,
			percentage: item.percentage,
			color:
				categories.find((c) => c.id === item.categoryId)?.color || "#10b981",
		}));
	}, [stats?.categoryBreakdown, categories]);

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

	// 初期データ取得（並列実行）
	useEffect(() => {
		const fetchInitialData = async () => {
			// 並列でデータを取得
			await Promise.all([fetchCategoriesData(), refetch(), refetchStats()]);

			// パフォーマンス計測終了
			if (typeof window !== "undefined" && window.performance) {
				performance.measure("page-load", "page-start");
			}
		};

		fetchInitialData();
	}, [fetchCategoriesData, refetch, refetchStats]); // 初回のみ実行

	// フィルタ変更ハンドラー
	const handleFiltersChange = useCallback(
		(newFilters: IncomeFiltersState) => {
			setFilters(newFilters);
			// フィルタ変更時にデータを再取得
			refetch();
			refetchStats();
		},
		[refetch, refetchStats],
	);

	// フォーム送信ハンドラー
	const handleSubmit = async (data: IncomeFormData) => {
		try {
			setOperationLoading(true);
			const { type: _, ...apiData } = data;

			if (editingIncome) {
				await apiClient.transactions.update(editingIncome.id, {
					amount: apiData.amount,
					date: apiData.date,
					description: apiData.description || null,
					categoryId: apiData.categoryId || null,
				});
			} else {
				await apiClient.transactions.create({
					type: "income",
					amount: apiData.amount,
					date: apiData.date,
					description: apiData.description || null,
					categoryId: apiData.categoryId || null,
				});
			}

			setEditingIncome(null);
			// データを再取得
			await Promise.all([refetch(), refetchStats()]);
		} catch (err) {
			console.error("操作に失敗しました", err);
		} finally {
			setOperationLoading(false);
		}
	};

	// 編集ハンドラー
	const handleEdit = (transaction: TransactionWithCategory) => {
		setEditingIncome(transaction);
	};

	// 削除ハンドラー
	const handleDelete = (id: string) => {
		setDeleteTargetId(id);
	};

	// 削除確認ハンドラー
	const handleDeleteConfirm = async () => {
		if (!deleteTargetId) return;
		try {
			setOperationLoading(true);
			await apiClient.transactions.delete(deleteTargetId);
			setDeleteTargetId(null);
			// データを再取得
			await Promise.all([refetch(), refetchStats()]);
		} catch (err) {
			console.error("削除に失敗しました", err);
		} finally {
			setOperationLoading(false);
		}
	};

	// 削除キャンセルハンドラー
	const handleDeleteCancel = () => {
		setDeleteTargetId(null);
	};

	// エラー状態
	const hasError = incomesError || statsError;
	const _errorMessage = incomesError || statsError;

	// ローディング状態
	const isLoading = incomesLoading || statsLoading;

	// レスポンシブグリッドクラス
	const gridClass = "grid grid-cols-1 lg:grid-cols-4 gap-4";

	return (
		<div className="container mx-auto p-4">
			<h1 className="text-2xl font-bold mb-6">収入管理</h1>

			{/* Phase 2統合レイアウト */}
			<div className="space-y-6">
				{/* 1. 収入統計カード（上部） */}
				<div data-testid="income-stats">
					<IncomeStats
						stats={{
							currentMonth: stats?.currentMonth || 0,
							lastMonth: stats?.lastMonth || 0,
							currentYear: stats?.currentYear || 0,
							monthOverMonth: stats?.monthOverMonth || 0,
							categoryBreakdown:
								stats?.categoryBreakdown?.map((item) => ({
									categoryId: Number(item.categoryId) || 0,
									name: item.name,
									amount: item.amount,
									percentage: item.percentage,
								})) || [],
						}}
						isLoading={statsLoading}
						error={statsError ? new Error(statsError) : null}
					/>
				</div>

				{/* 2. フィルタリングコントロールとカテゴリグラフ（中部） */}
				<div className={gridClass}>
					{/* フィルタ（左側 - 3列分） */}
					<div className="lg:col-span-3">
						<div data-testid="income-filters">
							<IncomeFilters
								onFiltersChange={handleFiltersChange}
								categories={categories}
								initialFilters={filters}
								disableUrlSync={true} // URL同期を無効化
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
						onCancel={() => setEditingIncome(null)}
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
				{hasError && !isLoading && (
					<div className="mb-4 p-4 bg-red-50 text-red-700 rounded flex justify-between items-center">
						<span>データの取得に失敗しました</span>
						<button
							type="button"
							onClick={() => {
								refetch();
								refetchStats();
							}}
							className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
						>
							再試行
						</button>
					</div>
				)}

				{/* ローディング表示 */}
				{isLoading && <div className="text-center py-8">読み込み中...</div>}

				{/* 4. 収入一覧テーブル（下部） */}
				{!isLoading && (
					<div data-testid="income-list">
						<IncomeList
							transactions={incomes}
							isLoading={incomesLoading}
							error={incomesError || undefined}
							onEdit={handleEdit}
							onDelete={handleDelete}
						/>

						{/* ページネーションコントロール */}
						{pagination && (
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
						)}
					</div>
				)}
			</div>

			{/* 削除確認ダイアログ */}
			<DeleteConfirmDialog
				isOpen={!!deleteTargetId}
				onConfirm={handleDeleteConfirm}
				onCancel={handleDeleteCancel}
				isLoading={operationLoading}
			/>
		</div>
	);
}
