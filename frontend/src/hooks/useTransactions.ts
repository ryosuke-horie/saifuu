// トランザクション（収入・支出）共通のカスタムフック
// 収入・支出の取得、作成、更新、削除の共通ロジックを提供

import { useCallback, useEffect, useState } from "react";
import { TransactionService } from "@/services/TransactionService";
import type {
	Transaction,
	TransactionFormData,
	TransactionType,
} from "@/types/transaction";
import { TRANSACTION_TYPE_CONFIG } from "@/types/transaction";

// 簡易的なトースト通知関数
const showToast = (message: string, type: "success" | "error" = "success") => {
	// 実際のプロジェクトではより適切な通知システムを使用
	if (type === "error") {
		console.error(message);
		alert(`エラー: ${message}`);
	} else {
		console.log(message);
	}
};

// API関数のインポート（実際のAPIクライアントに合わせて調整）
const fetchTransactions = async (): Promise<Transaction[]> => {
	const response = await fetch("/api/transactions");
	if (!response.ok) throw new Error("Failed to fetch transactions");
	return response.json();
};

const createTransaction = async (
	data: TransactionFormData,
): Promise<Transaction> => {
	const response = await fetch("/api/transactions", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data),
	});
	if (!response.ok) throw new Error("Failed to create transaction");
	return response.json();
};

const updateTransaction = async (
	id: string,
	data: TransactionFormData,
): Promise<Transaction> => {
	const response = await fetch(`/api/transactions/${id}`, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data),
	});
	if (!response.ok) throw new Error("Failed to update transaction");
	return response.json();
};

const deleteTransaction = async (id: string): Promise<void> => {
	const response = await fetch(`/api/transactions/${id}`, {
		method: "DELETE",
	});
	if (!response.ok) throw new Error("Failed to delete transaction");
};

export const useTransactions = (type: TransactionType) => {
	const config = TRANSACTION_TYPE_CONFIG[type];
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);
	const [editingTransaction, setEditingTransaction] =
		useState<Transaction | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// トランザクション一覧の取得
	const loadTransactions = useCallback(async () => {
		try {
			setIsLoading(true);
			setError(null);
			const allTransactions = await fetchTransactions();
			const filtered = TransactionService.filterByType(allTransactions, type);
			setTransactions(filtered);
		} catch (err) {
			setError(err as Error);
			showToast(config.messages.loadError, "error");
		} finally {
			setIsLoading(false);
		}
	}, [type, config.messages.loadError]);

	useEffect(() => {
		loadTransactions();
	}, [loadTransactions]);

	// フォーム送信ハンドラー
	const handleSubmit = useCallback(
		async (data: TransactionFormData) => {
			try {
				setIsSubmitting(true);

				// バリデーション
				const validationResult = TransactionService.validate(data);
				if (!validationResult.isValid) {
					const firstError = Object.values(validationResult.errors)[0];
					if (firstError) {
						showToast(firstError, "error");
					}
					return;
				}

				// タイプを確実に設定
				const transactionData = { ...data, type };

				if (editingTransaction) {
					await updateTransaction(editingTransaction.id, transactionData);
					showToast(config.messages.updateSuccess);
					setEditingTransaction(null);
				} else {
					await createTransaction(transactionData);
					showToast(config.messages.addSuccess);
				}

				// リストを再読み込み
				await loadTransactions();
			} catch (_err) {
				showToast(config.messages.saveError, "error");
			} finally {
				setIsSubmitting(false);
			}
		},
		[editingTransaction, type, config.messages, loadTransactions],
	);

	// 編集開始
	const handleEdit = useCallback((transaction: Transaction) => {
		setEditingTransaction(transaction);
	}, []);

	// 編集キャンセル
	const handleCancelEdit = useCallback(() => {
		setEditingTransaction(null);
	}, []);

	// 削除
	const handleDelete = useCallback(
		async (id: string) => {
			if (window.confirm(`この${config.label}を削除しますか？`)) {
				try {
					setIsSubmitting(true);
					await deleteTransaction(id);
					showToast(config.messages.deleteSuccess);
					await loadTransactions();
				} catch (_err) {
					showToast(config.messages.deleteError, "error");
				} finally {
					setIsSubmitting(false);
				}
			}
		},
		[config.label, config.messages, loadTransactions],
	);

	return {
		transactions,
		isLoading,
		error,
		editingTransaction,
		isSubmitting,
		handleSubmit,
		handleEdit,
		handleCancelEdit,
		handleDelete,
	};
};
