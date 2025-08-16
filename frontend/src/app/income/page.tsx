"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useIncomeFilters } from "@/hooks/useIncomeFilters";
import { useIncomeStats } from "@/hooks/useIncomeStats";
import { useIncomesWithPagination } from "@/hooks/useIncomesWithPagination";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { fetchCategories } from "@/lib/api/categories/api";
import { apiClient } from "@/lib/api/client";
import type { TransactionWithCategory } from "@/lib/api/types";
import {
        calculateMonthOverMonth,
        calculatePercentage,
} from "@/lib/utils/calculations";
import { isTransactionWithCategoryArray } from "@/lib/utils/typeGuards";
import type { Category } from "@/types/category";
import type {
	IncomeCategoryData,
	IncomeFormData,
	IncomeStats,
} from "@/types/income";
import { DeleteConfirmDialog } from "../../components/income/DeleteConfirmDialog";
import { IncomeCategoryChart } from "../../components/income/IncomeCategoryChart";
import { IncomeFilters } from "../../components/income/IncomeFilters";
import { IncomeForm } from "../../components/income/IncomeForm";
import { IncomeList } from "../../components/income/IncomeList";
import { IncomeStats as IncomeStatsComponent } from "../../components/income/IncomeStats";
import { Pagination } from "../../components/ui/Pagination";

/**
 * 収入管理ページのメインコンテンツ
 *
 * useSearchParamsを使用するため、Suspenseでラップする必要がある
 * すべてのロジックとUIをこのコンポーネントに含める
 */
function IncomePageContent() {
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

	// UI状態の管理
	const [categories, setCategories] = useState<Category[]>([]);
	const [editingIncome, setEditingIncome] =
		useState<TransactionWithCategory | null>(null);
	const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
	const [operationLoading, setOperationLoading] = useState(false);

	// 統計データの管理
	const [statsData, setStatsData] = useState<IncomeStats | null>(null);
	const [statsLoading, setStatsLoading] = useState(true);
	const [allIncomes, setAllIncomes] = useState<TransactionWithCategory[]>([]);

	// フィルタリング機能
	const { filters, updateFilters } = useIncomeFilters({
		disableUrlSync: false,
		onFiltersChange: () => {
			// フィルター変更時にデータを再取得
			refetch();
		},
	});

	// 収入統計の計算
	const stats = useIncomeStats(allIncomes, statsLoading);

	// 統計データの取得
	const fetchStatsData = useCallback(async () => {
		try {
			setStatsLoading(true);
			// 全収入データを取得して統計計算用に使用
			// API は拡張された取引データ（カテゴリ情報付き）を返すはず
                        const response = await apiClient.transactions.list({
                                type: "income",
                                limit: 1000, // 統計計算のため全データ取得
                        });
                        if (!isTransactionWithCategoryArray(response.data)) {
                                throw new Error("Invalid response format");
                        }
                        const incomesWithCategory = response.data;
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

	// カテゴリデータの取得
	const fetchCategoriesData = useCallback(async () => {
		try {
			const response = await fetchCategories();
			// 収入カテゴリのみフィルタリング
			const incomeCategories = response.filter(
				(category) => category.type === "income",
			);
			setCategories(incomeCategories);
		} catch (err) {
			console.error("カテゴリの取得に失敗しました", err);
		}
	}, []);

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

	// 初期データ取得
	useEffect(() => {
		fetchCategoriesData();
		fetchStatsData();
	}, [fetchCategoriesData, fetchStatsData]);

	// フォーム送信ハンドラー
	const handleSubmit = async (data: IncomeFormData) => {
		try {
			setOperationLoading(true);
			// typeフィールドを除外してAPIに渡す
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
			await refetch();
			await fetchStatsData();
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
			await refetch();
			await fetchStatsData();
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

	return (
		<div className="container mx-auto p-4">
			<h1 className="text-2xl font-bold mb-6">収入管理</h1>

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
						onFiltersChange={(newFilters) => {
							updateFilters(newFilters);
						}}
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
		</div>
	);
}

/**
 * 収入管理ページのローディング表示
 *
 * Suspenseのfallback用コンポーネント
 */
function IncomePageLoading() {
	return (
		<div className="container mx-auto p-4">
			<h1 className="text-2xl font-bold mb-6">収入管理</h1>
			<div className="flex justify-center items-center min-h-[400px]">
				<div className="text-center">
					<div className="animate-pulse space-y-4">
						<div className="h-32 bg-gray-200 rounded-lg" />
						<div className="grid grid-cols-2 gap-6">
							<div className="h-48 bg-gray-200 rounded-lg" />
							<div className="h-48 bg-gray-200 rounded-lg" />
						</div>
						<div className="h-64 bg-gray-200 rounded-lg" />
					</div>
					<p className="mt-4 text-gray-600">データを読み込んでいます...</p>
				</div>
			</div>
		</div>
	);
}

/**
 * 収入管理メインページ
 *
 * 収入の一覧表示と登録・編集・削除機能を提供する統合ページ
 * Phase 2の全コンポーネントを統合した完全版
 * - 収入統計表示
 * - フィルタリング機能
 * - カテゴリ別グラフ表示
 * - ページネーション付き一覧表示
 *
 * Next.js 15の要件に従い、useSearchParamsを使用するコンポーネントを
 * Suspenseでラップしてレンダリング
 */
export default function IncomePage() {
	return (
		<Suspense fallback={<IncomePageLoading />}>
			<IncomePageContent />
		</Suspense>
	);
}
