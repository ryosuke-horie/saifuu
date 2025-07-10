"use client";

import { useMemo, useState } from "react";
import { getCategoriesByType } from "../../../../shared/config/categories";
import {
	ExpenseList,
	NewExpenseButton,
	NewExpenseDialog,
} from "../../components/expenses";
import { useExpenses } from "../../hooks";
import type { Category } from "../../lib/api/types";
import type { ExpenseFormData } from "../../types/expense";

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

export default function ExpensesPage() {
	// 支出データ管理フック
	const {
		expenses,
		loading,
		error,
		operationLoading,
		refetch,
		createExpenseMutation,
		deleteExpenseMutation,
	} = useExpenses();

	// 新規登録ダイアログの状態管理
	const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);

	// グローバル設定から支出カテゴリを取得
	const categories = useMemo((): Category[] => {
		const globalExpenseCategories = getCategoriesByType("expense");
		const fixedDate = "2024-01-01T00:00:00.000Z";
		return globalExpenseCategories.map((config) => ({
			id: config.id,
			name: config.name,
			type: config.type,
			color: config.color,
			createdAt: fixedDate,
			updatedAt: fixedDate,
		}));
	}, []);

	// 新規登録ボタンクリックハンドラー
	const handleNewClick = () => {
		setIsNewDialogOpen(true);
	};

	// 新規登録ダイアログクローズハンドラー
	const handleNewDialogClose = () => {
		setIsNewDialogOpen(false);
	};

	// 新規登録送信ハンドラー
	const handleNewSubmit = async (formData: ExpenseFormData) => {
		await createExpenseMutation(formData);
	};

	// 削除ハンドラー
	const handleDelete = async (transactionId: string) => {
		if (window.confirm("この取引を削除してもよろしいですか？")) {
			await deleteExpenseMutation(transactionId);
		}
	};

	// 統計情報の計算
	const stats = useMemo(() => {
		if (loading || !expenses) {
			return {
				totalExpenses: 0,
				totalIncome: 0,
				balance: 0,
				transactionCount: expenses?.length || 0,
			};
		}

		const totalExpenses = expenses
			.filter((t) => t.type === "expense")
			.reduce((sum, t) => sum + t.amount, 0);

		const totalIncome = expenses
			.filter((t) => t.type === "income")
			.reduce((sum, t) => sum + t.amount, 0);

		return {
			totalExpenses,
			totalIncome,
			balance: totalIncome - totalExpenses,
			transactionCount: expenses.length,
		};
	}, [expenses, loading]);

	return (
		<div className="min-h-screen bg-gray-50">
			<main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
				{/* ページヘッダー */}
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
					<div className="mb-4 sm:mb-0">
						<h1 className="text-2xl font-bold text-gray-900">支出・収入管理</h1>
						<p className="text-sm text-gray-600 mt-1">
							日々の支出と収入を記録して家計を管理しましょう
						</p>
					</div>
					<div className="flex-shrink-0">
						<NewExpenseButton
							onClick={handleNewClick}
							disabled={operationLoading}
						/>
					</div>
				</div>

				{/* 統計情報カード */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
												`¥${stats.totalExpenses.toLocaleString()}`
											)}
										</dd>
									</dl>
								</div>
							</div>
						</div>
					</div>

					{/* 収入合計 */}
					<div className="bg-white overflow-hidden shadow rounded-lg">
						<div className="p-5">
							<div className="flex items-center">
								<div className="flex-shrink-0">
									<span className="text-2xl">💰</span>
								</div>
								<div className="ml-5 w-0 flex-1">
									<dl>
										<dt className="text-sm font-medium text-gray-500 truncate">
											収入合計
										</dt>
										<dd className="text-lg font-semibold text-green-600">
											{loading ? (
												<span className="text-gray-400">読み込み中...</span>
											) : (
												`¥${stats.totalIncome.toLocaleString()}`
											)}
										</dd>
									</dl>
								</div>
							</div>
						</div>
					</div>

					{/* 収支バランス */}
					<div className="bg-white overflow-hidden shadow rounded-lg">
						<div className="p-5">
							<div className="flex items-center">
								<div className="flex-shrink-0">
									<span className="text-2xl">💹</span>
								</div>
								<div className="ml-5 w-0 flex-1">
									<dl>
										<dt className="text-sm font-medium text-gray-500 truncate">
											収支バランス
										</dt>
										<dd
											className={`text-lg font-semibold ${
												stats.balance >= 0 ? "text-green-600" : "text-red-600"
											}`}
										>
											{loading ? (
												<span className="text-gray-400">読み込み中...</span>
											) : (
												`${stats.balance >= 0 ? "+" : ""}¥${stats.balance.toLocaleString()}`
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
					<div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
						<div className="flex">
							<div className="flex-shrink-0">
								<span className="text-red-400">⚠️</span>
							</div>
							<div className="ml-3">
								<h3 className="text-sm font-medium text-red-800">
									エラーが発生しました
								</h3>
								<div className="mt-2 text-sm text-red-700">
									<p>{error}</p>
								</div>
								<div className="mt-4">
									<button
										type="button"
										onClick={refetch}
										className="text-sm font-medium text-red-800 hover:text-red-700"
									>
										再読み込み
									</button>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* 支出・収入一覧 */}
				<div className="bg-white shadow overflow-hidden rounded-lg">
					<ExpenseList
						transactions={expenses}
						isLoading={loading}
						onRefresh={refetch}
						onDelete={handleDelete}
					/>
				</div>

				{/* 新規登録ダイアログ */}
				<NewExpenseDialog
					isOpen={isNewDialogOpen}
					onClose={handleNewDialogClose}
					onSubmit={handleNewSubmit}
					isSubmitting={operationLoading}
					categories={categories}
				/>
			</main>
		</div>
	);
}
