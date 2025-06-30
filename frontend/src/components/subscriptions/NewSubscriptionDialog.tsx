"use client";

import { type FC, useCallback, useState } from "react";
import type {
	NewSubscriptionDialogProps,
	SubscriptionFormData,
} from "../../types/subscription";
import { Dialog } from "../ui/Dialog";
import { SubscriptionForm } from "./SubscriptionForm";

/**
 * 新規サブスクリプション登録ダイアログコンポーネント
 *
 * DialogコンポーネントとSubscriptionFormコンポーネントを組み合わせて
 * モーダル形式での新規サブスクリプション登録機能を提供
 *
 * 設計方針:
 * - 既存のDialogとSubscriptionFormコンポーネントを再利用
 * - フォーム送信成功時にダイアログを自動で閉じる
 * - キャンセル時とダイアログクローズ時の適切な処理
 * - アクセシビリティとユーザビリティを考慮した実装
 * - エラーハンドリングとローディング状態の適切な表示
 *
 * 代替案として考慮した実装:
 * - インラインフォーム: モーダルの方がフォーカス管理とUXに優れるため採用
 * - 独自のダイアログ実装: 既存のDialogコンポーネントを再利用することで一貫性を保持
 */

export const NewSubscriptionDialog: FC<NewSubscriptionDialogProps> = ({
	isOpen,
	onClose,
	onSubmit,
	isSubmitting = false,
	categories,
}) => {
	// フォームエラーの状態管理
	const [formError, setFormError] = useState<string | null>(null);
	// フォーム送信ハンドラー
	const handleFormSubmit = useCallback(
		async (data: SubscriptionFormData) => {
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
					error instanceof Error
						? error.message
						: "サブスクリプションの作成に失敗しました";
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
			title="新規サブスクリプション登録"
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

			<SubscriptionForm
				onSubmit={handleFormSubmit}
				onCancel={handleFormCancel}
				isSubmitting={isSubmitting}
				categories={categories}
			/>
		</Dialog>
	);
};
