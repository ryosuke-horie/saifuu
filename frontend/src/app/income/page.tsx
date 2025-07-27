"use client";

import { useCallback, useEffect, useState } from "react";
import { useIncomes } from "@/hooks/useIncomes";
import { fetchCategories } from "@/lib/api/categories/api";
import type { Transaction } from "@/lib/api/types";
import type { Category } from "@/types/category";
import { DeleteConfirmDialog } from "../../components/income/DeleteConfirmDialog";
import { IncomeForm } from "../../components/income/IncomeForm";
import { IncomeList } from "../../components/income/IncomeList";

/**
 * 収入管理メインページ
 *
 * 収入の一覧表示と登録・編集・削除機能を提供する統合ページ
 * 支出管理ページのパターンを踏襲し、収入に特化した実装
 */
export default function IncomePage() {
	// useIncomesフックを使用してデータ管理
	const {
		incomes,
		loading: isLoading,
		error,
		operationLoading,
		createIncomeMutation,
		updateIncomeMutation,
		deleteIncomeMutation,
	} = useIncomes();

	// UI状態の管理
	const [categories, setCategories] = useState<Category[]>([]);
	const [editingIncome, setEditingIncome] = useState<Transaction | null>(null);
	const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

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

	// 初期データ取得
	useEffect(() => {
		fetchCategoriesData();
	}, [fetchCategoriesData]);

	// フォーム送信ハンドラー
	const handleSubmit = async (data: {
		amount: number;
		date: string;
		description?: string;
		categoryId?: string;
	}) => {
		try {
			if (editingIncome) {
				await updateIncomeMutation(editingIncome.id, {
					amount: data.amount,
					date: data.date,
					description: data.description || null,
					categoryId: data.categoryId || null,
				});
			} else {
				await createIncomeMutation({
					amount: data.amount,
					date: data.date,
					description: data.description || null,
					categoryId: data.categoryId || null,
				});
			}
			setEditingIncome(null);
		} catch (err) {
			console.error("操作に失敗しました", err);
		}
	};

	// 編集ハンドラー
	const handleEdit = (transaction: Transaction) => {
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
			await deleteIncomeMutation(deleteTargetId);
			setDeleteTargetId(null);
		} catch (err) {
			console.error("削除に失敗しました", err);
		}
	};

	// 削除キャンセルハンドラー
	const handleDeleteCancel = () => {
		setDeleteTargetId(null);
	};

	return (
		<div className="container mx-auto p-4">
			<h1 className="text-2xl font-bold mb-6">収入管理</h1>

			{/* 収入登録フォーム */}
			<div className="mb-8">
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
									categoryId: editingIncome.category?.id || "",
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

			{/* 収入一覧 */}
			{!isLoading && (
				<IncomeList
					transactions={incomes}
					isLoading={isLoading}
					error={error || undefined}
					onEdit={handleEdit}
					onDelete={handleDelete}
				/>
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
