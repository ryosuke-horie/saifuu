"use client";

import { ALL_CATEGORIES } from "@shared/config";
import { type FC, useCallback, useEffect, useMemo, useState } from "react";
import type { Category } from "../../lib/api/types";
import type {
	EditExpenseDialogProps,
	ExpenseFormData,
} from "../../types/expense";
import { convertTransactionToFormData } from "../../utils/expense";
import { Dialog } from "../ui/Dialog";
import { ExpenseForm } from "./ExpenseForm";

/**
 * 取引編集ダイアログコンポーネント
 *
 * 既存の取引データを編集するためのモーダルダイアログ
 * NewExpenseDialogと同様のパターンで実装し、一貫性を保つ
 *
 * 設計方針:
 * - 既存のDialogとExpenseFormコンポーネントを再利用
 * - Transaction型からExpenseFormData型への変換を行う
 * - フォーム送信成功時にダイアログを自動で閉じる
 * - エラーハンドリングとローディング状態の適切な表示
 *
 * 関連Issue: #285 支出一覧から編集する導線の実装
 */

export const EditExpenseDialog: FC<EditExpenseDialogProps> = ({
	isOpen,
	onClose,
	onSubmit,
	isSubmitting = false,
	transaction,
	categories,
}) => {
	// フォームエラーの状態管理
	const [formError, setFormError] = useState<string | null>(null);

	// ダイアログが開かれた時にエラーをクリア
	useEffect(() => {
		if (isOpen) {
			setFormError(null);
		}
	}, [isOpen]);

	// グローバル設定またはpropsからカテゴリを取得
	const effectiveCategories = useMemo((): Category[] => {
		// propsでカテゴリが提供されている場合はそれを使用
		if (categories && categories.length > 0) {
			return categories;
		}

		// グローバル設定から全カテゴリを取得してCategory型に変換
		// fetchCategoriesと同じロジックを使用
		return ALL_CATEGORIES.map((config) => ({
			id: config.numericId.toString(), // numericIdをstring型に変換
			name: config.name,
			type: config.type as "expense",
			color: config.color || null,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		}));
	}, [categories]);

	// 編集用の初期データに変換
	const initialData = useMemo(() => {
		if (!transaction) return undefined;
		return convertTransactionToFormData(transaction);
	}, [transaction]);

	// フォーム送信ハンドラー
	const handleFormSubmit = useCallback(
		async (data: ExpenseFormData) => {
			// transactionがない場合は何もしない（型安全性のため）
			if (!transaction) return;

			try {
				// エラー状態をクリア
				setFormError(null);

				// 親コンポーネントにIDとデータを渡して送信
				await onSubmit(transaction.id, data);

				// 送信成功時にダイアログを閉じる
				onClose();
			} catch (error) {
				// エラー表示
				const errorMessage =
					error instanceof Error ? error.message : "取引の更新に失敗しました";
				setFormError(errorMessage);
			}
		},
		[onSubmit, onClose, transaction],
	);

	// フォームキャンセルハンドラー
	const handleFormCancel = useCallback(() => {
		// エラー状態をクリア
		setFormError(null);
		onClose();
	}, [onClose]);

	// ダイアログクローズ時のハンドラー
	const handleDialogClose = useCallback(() => {
		// エラー状態をクリア
		setFormError(null);
		onClose();
	}, [onClose]);

	// transactionがない場合は何も表示しない
	if (!transaction) {
		return null;
	}

	return (
		<Dialog
			isOpen={isOpen}
			onClose={handleDialogClose}
			title="取引編集"
			className="max-w-2xl"
			closeOnOverlayClick={!isSubmitting} // 送信中はオーバーレイクリックでの閉じるを無効化
			closeOnEsc={!isSubmitting} // 送信中はESCキーでの閉じるを無効化
		>
			{/* フォームエラー表示 */}
			{formError && (
				<div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
					<div className="flex">
						<div className="flex-shrink-0">
							<span className="text-red-400">⚠️</span>
						</div>
						<div className="ml-3">
							<h3 className="text-sm font-medium text-red-800">
								更新に失敗しました
							</h3>
							<div className="mt-2 text-sm text-red-700">
								<p>{formError}</p>
							</div>
						</div>
					</div>
				</div>
			)}

			<ExpenseForm
				onSubmit={handleFormSubmit}
				onCancel={handleFormCancel}
				isSubmitting={isSubmitting}
				categories={effectiveCategories}
				initialData={initialData}
			/>
		</Dialog>
	);
};
