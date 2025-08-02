"use client";

import { ALL_CATEGORIES } from "@shared/config";
import { type FC, useCallback, useEffect, useMemo, useState } from "react";
import type { Category } from "../../lib/api/types";
import type {
	ExpenseFormData,
	NewExpenseDialogProps,
} from "../../types/expense";
import { Dialog } from "../ui/Dialog";
import { ExpenseForm } from "./ExpenseForm";

/**
 * 新規支出登録ダイアログコンポーネント
 *
 * DialogコンポーネントとExpenseFormコンポーネントを組み合わせて
 * モーダル形式での新規支出登録機能を提供
 *
 * 設計方針:
 * - 既存のDialogとExpenseFormコンポーネントを再利用
 * - フォーム送信成功時にダイアログを自動で閉じる
 * - キャンセル時とダイアログクローズ時の適切な処理
 * - アクセシビリティとユーザビリティを考慮した実装
 * - エラーハンドリングとローディング状態の適切な表示
 *
 * 関連Issue: #93 支出管理メインページ実装
 */

export const NewExpenseDialog: FC<NewExpenseDialogProps> = ({
	isOpen,
	onClose,
	onSubmit,
	isSubmitting = false,
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

	// フォーム送信ハンドラー
	const handleFormSubmit = useCallback(
		async (data: ExpenseFormData) => {
			try {
				// エラー状態をクリア
				setFormError(null);

				// 親コンポーネントにデータを渡して送信
				await onSubmit(data);

				// 送信成功時にダイアログを閉じる
				onClose();
			} catch (error) {
				// エラー表示
				const errorMessage =
					error instanceof Error ? error.message : "取引の作成に失敗しました";
				setFormError(errorMessage);
			}
		},
		[onSubmit, onClose],
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

	return (
		<Dialog
			isOpen={isOpen}
			onClose={handleDialogClose}
			title="新規取引登録"
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
								登録に失敗しました
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
			/>
		</Dialog>
	);
};
