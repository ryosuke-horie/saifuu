"use client";

import { type FC, useCallback } from "react";
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
}) => {
	// フォーム送信ハンドラー
	const handleFormSubmit = useCallback(
		(data: SubscriptionFormData) => {
			// 親コンポーネントに送信データを渡す
			onSubmit(data);
			// 送信成功後にダイアログを閉じる
			// 注意: 実際のプロダクションでは、送信の成功/失敗を待ってからクローズすべき
			// 現在はモックデータなので即座に閉じる
			onClose();
		},
		[onSubmit, onClose],
	);

	// フォームキャンセルハンドラー
	const handleFormCancel = useCallback(() => {
		onClose();
	}, [onClose]);

	return (
		<Dialog
			isOpen={isOpen}
			onClose={onClose}
			title="新規サブスクリプション登録"
			className="max-w-2xl"
			closeOnOverlayClick={!isSubmitting} // 送信中はオーバーレイクリックでの閉じるを無効化
			closeOnEsc={!isSubmitting} // 送信中はESCキーでの閉じるを無効化
		>
			<SubscriptionForm
				onSubmit={handleFormSubmit}
				onCancel={handleFormCancel}
				isSubmitting={isSubmitting}
			/>
		</Dialog>
	);
};
