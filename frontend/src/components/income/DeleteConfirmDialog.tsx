/**
 * 収入削除確認ダイアログコンポーネント
 *
 * 収入削除時の確認ダイアログを表示するコンポーネント
 * モーダルとして表示され、削除の確定またはキャンセルが可能
 */

import type { FC } from "react";

interface DeleteConfirmDialogProps {
	isOpen: boolean;
	onConfirm: () => void;
	onCancel: () => void;
	isLoading?: boolean;
}

export const DeleteConfirmDialog: FC<DeleteConfirmDialogProps> = ({
	isOpen,
	onConfirm,
	onCancel,
	isLoading = false,
}) => {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
			<div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
				<h3 className="text-lg font-semibold mb-4">削除の確認</h3>
				<p className="mb-6">この収入を削除してもよろしいですか？</p>
				<div className="flex justify-end space-x-3">
					<button
						type="button"
						onClick={onCancel}
						className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded"
						disabled={isLoading}
					>
						キャンセル
					</button>
					<button
						type="button"
						onClick={onConfirm}
						className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded disabled:bg-red-400"
						disabled={isLoading}
					>
						削除を確定
					</button>
				</div>
			</div>
		</div>
	);
};
