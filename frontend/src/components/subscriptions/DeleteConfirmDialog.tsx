/**
 * サブスクリプション削除確認ダイアログコンポーネント
 *
 * サブスクリプションデータの削除時に確認を求めるモーダルダイアログ
 * 他のDeleteConfirmDialogと同じパターンを踏襲し、一貫性を保つ
 *
 * 設計方針:
 * - サブスクリプション名を含めた分かりやすい削除確認メッセージ
 * - 削除処理中の適切な状態表示
 * - アクセシビリティを考慮したUI
 */

import type { FC } from "react";
import { Dialog } from "../ui";

interface DeleteConfirmDialogProps {
	/**
	 * ダイアログの表示状態
	 */
	isOpen: boolean;

	/**
	 * ダイアログを閉じる際のコールバック関数
	 */
	onClose: () => void;

	/**
	 * 削除を確認した際のコールバック関数
	 */
	onConfirm: () => void;

	/**
	 * 削除対象のサブスクリプション名
	 */
	subscriptionName?: string;

	/**
	 * 削除処理中の状態
	 */
	isDeleting?: boolean;
}

export const DeleteConfirmDialog: FC<DeleteConfirmDialogProps> = ({
	isOpen,
	onClose,
	onConfirm,
	subscriptionName,
	isDeleting = false,
}) => {
	const handleConfirm = () => {
		onConfirm();
	};

	return (
		<Dialog isOpen={isOpen} onClose={onClose} title="サブスクリプションの削除">
			<div className="space-y-4">
				<p className="text-gray-700">
					{subscriptionName ? (
						<>
							<strong className="font-medium">{subscriptionName}</strong>
							のサブスクリプションを削除してもよろしいですか？
						</>
					) : (
						"このサブスクリプションを削除してもよろしいですか？"
					)}
				</p>
				<p className="text-sm text-gray-500">
					この操作は取り消すことができません。
				</p>
				<div className="flex justify-end gap-3 pt-4">
					<button
						type="button"
						onClick={onClose}
						disabled={isDeleting}
						className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						キャンセル
					</button>
					<button
						type="button"
						onClick={handleConfirm}
						disabled={isDeleting}
						className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isDeleting ? "削除中..." : "削除"}
					</button>
				</div>
			</div>
		</Dialog>
	);
};
