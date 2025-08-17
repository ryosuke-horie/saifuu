/**
 * 収入のCRUD操作管理用カスタムフック
 *
 * 作成、更新、削除操作のロジックを管理
 * IncomePageContentから分離して単一責任の原則に従う
 */

import { useState } from "react";
import { apiClient } from "@/lib/api/client";
import type { TransactionWithCategory } from "@/lib/api/types";
import type { IncomeFormData } from "@/types/income";

interface UseIncomeOperationsProps {
	onOperationComplete: () => Promise<void>;
	onStatsRefresh: () => Promise<void>;
}

export const useIncomeOperations = ({
	onOperationComplete,
	onStatsRefresh,
}: UseIncomeOperationsProps) => {
	const [editingIncome, setEditingIncome] =
		useState<TransactionWithCategory | null>(null);
	const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
	const [operationLoading, setOperationLoading] = useState(false);

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
			await onOperationComplete();
			await onStatsRefresh();
			// 成功を返す
			return true;
		} catch (err) {
			console.error("操作に失敗しました", err);
			// 失敗を返す
			return false;
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
			await onOperationComplete();
			await onStatsRefresh();
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

	// 編集キャンセルハンドラー
	const handleEditCancel = () => {
		setEditingIncome(null);
	};

	return {
		editingIncome,
		deleteTargetId,
		operationLoading,
		handleSubmit,
		handleEdit,
		handleDelete,
		handleDeleteConfirm,
		handleDeleteCancel,
		handleEditCancel,
	};
};
