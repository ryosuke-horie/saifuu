"use client";

import { useState } from "react";
import {
	DeleteConfirmDialog,
	EditExpenseDialog,
	ExpenseList,
	NewExpenseButton,
	NewExpenseDialog,
} from "../../components/expenses";
import { ErrorAlert } from "../../components/ui/ErrorAlert";
import { useCategories, useExpenses } from "../../hooks";
import { useExpenseStats } from "../../hooks/useExpenseStats";
import type { Transaction } from "../../lib/api/types";
import type { ExpenseFormData } from "../../types/expense";
import { formatCurrency, formatTransactionCount } from "../../utils/format";

/**
 * 支出管理メインページ
 *
 * 支出・収入の一覧表示と登録・編集・削除機能を提供する統合ページ
 *
 * 設計方針:
 * - 既存のサブスクリプションページパターンを踏襲
 * - クライアントサイドレンダリングによる動的な状態管理
 * - useExpensesフックによるデータ管理の一元化
 * - レスポンシブデザイン対応
 * - エラーハンドリングとローディング状態の適切な表示
 *
 * 関連Issue: #93 支出管理メインページ実装
 * 依存Issue: #81, #82, #83
 */

// Matt Pocock方針に従った型安全で保守性の高い実装
export default function ExpensesPage() {
	// 支出データ管理フック
	const {
		expenses,
		loading,
		error,
		operationLoading,
		refetch,
		createExpenseMutation,
		updateExpenseMutation,
		deleteExpenseMutation,
	} = useExpenses();

	// Matt Pocock方針: 型推論を活用し、状態の意図を明確にする
	const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [editTarget, setEditTarget] = useState<Transaction | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

	// APIからカテゴリを取得
	const { categories: allCategories } = useCategories();

	// 新規登録ボタンクリックハンドラー
	const handleNewClick = () => {
		setIsNewDialogOpen(true);
	};

	// 新規登録ダイアログクローズハンドラー
	const handleNewDialogClose = () => {
		setIsNewDialogOpen(false);
	};

	// 新規登録送信ハンドラー: 型安全なエラーハンドリング
	const handleNewSubmit = async (formData: ExpenseFormData): Promise<void> => {
		await createExpenseMutation(formData);
	};

	// 編集ハンドラー
	const handleEdit = (transaction: Transaction) => {
		setEditTarget(transaction);
		setIsEditDialogOpen(true);
	};

	// 編集ダイアログクローズハンドラー
	const handleEditDialogClose = () => {
		setIsEditDialogOpen(false);
		setEditTarget(null);
	};

	// 編集送信ハンドラー: 型安全なエラーハンドリング
	const handleEditSubmit = async (
		id: string,
		formData: ExpenseFormData,
	): Promise<void> => {
		await updateExpenseMutation(id, formData);
	};

	// 削除ハンドラー
	const handleDelete = (transactionId: string) => {
		setDeleteTarget(transactionId);
	};

	// 削除確認ハンドラー: null チェックによる型安全性
	const handleDeleteConfirm = async (): Promise<void> => {
		if (deleteTarget) {
			await deleteExpenseMutation(deleteTarget);
			setDeleteTarget(null);
		}
	};

	// 削除キャンセルハンドラー
	const handleDeleteCancel = () => {
		setDeleteTarget(null);
	};

	// 統計情報の計算（カスタムフックに委譲）
	const stats = useExpenseStats(expenses, loading);

	return (
		<div className="min-h-screen bg-gray-50">
			<main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
				{/* ページヘッダー */}
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
					<div className="mb-4 sm:mb-0">
						<h1 className="text-2xl font-bold text-gray-900">支出管理</h1>
					</div>
					<div className="flex-shrink-0">
						<NewExpenseButton
							onClick={handleNewClick}
							disabled={operationLoading}
						/>
					</div>
				</div>

				{/* 統計情報カード */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
					{/* 支出合計 */}
					<div className="bg-white overflow-hidden shadow rounded-lg">
						<div className="p-5">
							<div className="flex items-center">
								<div className="flex-shrink-0">
									<span className="text-2xl">💸</span>
								</div>
								<div className="ml-5 w-0 flex-1">
									<dl>
										<dt className="text-sm font-medium text-gray-500 truncate">
											支出合計
										</dt>
										<dd className="text-lg font-semibold text-red-600">
											{loading ? (
												<span className="text-gray-400">読み込み中...</span>
											) : (
												formatCurrency(stats.totalExpense)
											)}
										</dd>
									</dl>
								</div>
							</div>
						</div>
					</div>

					{/* 取引件数 */}
					<div className="bg-white overflow-hidden shadow rounded-lg hidden sm:block">
						<div className="p-5">
							<div className="flex items-center">
								<div className="flex-shrink-0">
									<span className="text-2xl">📊</span>
								</div>
								<div className="ml-5 w-0 flex-1">
									<dl>
										<dt className="text-sm font-medium text-gray-500 truncate">
											取引件数
										</dt>
										<dd className="text-lg font-semibold text-gray-900">
											{loading ? (
												<span className="text-gray-400">読み込み中...</span>
											) : (
												formatTransactionCount(stats.transactionCount)
											)}
										</dd>
									</dl>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* エラー表示 */}
				{error && (
					<div className="mb-6">
						<ErrorAlert message={error} onRetry={refetch} />
					</div>
				)}

				{/* 支出・収入一覧 */}
				<div className="bg-white shadow overflow-hidden rounded-lg">
					<ExpenseList
						transactions={expenses}
						isLoading={loading}
						onEdit={handleEdit}
						onDelete={handleDelete}
					/>
				</div>

				{/* 新規登録ダイアログ */}
				<NewExpenseDialog
					isOpen={isNewDialogOpen}
					onClose={handleNewDialogClose}
					onSubmit={handleNewSubmit}
					isSubmitting={operationLoading}
					categories={allCategories}
				/>

				{/* 編集ダイアログ */}
				<EditExpenseDialog
					isOpen={isEditDialogOpen}
					onClose={handleEditDialogClose}
					onSubmit={handleEditSubmit}
					isSubmitting={operationLoading}
					transaction={editTarget}
					categories={allCategories}
				/>

				{/* 削除確認ダイアログ */}
				<DeleteConfirmDialog
					isOpen={deleteTarget !== null}
					onClose={handleDeleteCancel}
					onConfirm={handleDeleteConfirm}
					itemDescription="この取引"
					isDeleting={operationLoading}
				/>
			</main>
		</div>
	);
}
