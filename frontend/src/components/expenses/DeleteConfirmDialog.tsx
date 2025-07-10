/**
 * 削除確認ダイアログコンポーネント
 * 
 * 支出・収入データの削除時に確認を求めるモーダルダイアログ
 * window.confirmの代替として、統一されたUIとアクセシビリティを提供
 * 
 * 関連Issue: #93 支出管理メインページ実装
 */

import { type FC } from "react";
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
	 * 削除対象の説明文（オプション）
	 * 例: "この支出データ"、"選択した項目"
	 */
	itemDescription?: string;

	/**
	 * 削除処理中の状態
	 */
	isDeleting?: boolean;
}

export const DeleteConfirmDialog: FC<DeleteConfirmDialogProps> = ({
	isOpen,
	onClose,
	onConfirm,
	itemDescription = "この項目",
	isDeleting = false,
}) => {
	const handleConfirm = () => {
		onConfirm();
	};

	return (
		<Dialog
			isOpen={isOpen}
			onClose={onClose}
			title="削除の確認"
		>
			<div className="space-y-4">
				<p className="text-gray-700">
					{itemDescription}を削除してもよろしいですか？
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