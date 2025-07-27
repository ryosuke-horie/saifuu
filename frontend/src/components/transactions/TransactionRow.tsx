/**
 * 取引行表示コンポーネント
 *
 * 収入・支出の取引を1行で表示する共通コンポーネント
 *
 * 設計方針:
 * - 収入は緑色、支出は赤色で金額を表示
 * - レスポンシブデザイン対応
 * - 編集・削除操作の提供
 * - パフォーマンス最適化（React.memo）
 */

import type { FC } from "react";
import { memo, useCallback } from "react";
import type { Transaction } from "../../lib/api/types";
import {
	formatCategoryName,
	formatCurrency,
	formatDate,
} from "../../utils/format";

export interface TransactionRowProps {
	/** 表示する取引データ */
	transaction: Transaction;
	/** 編集時のコールバック */
	onEdit?: (transaction: Transaction) => void;
	/** 削除時のコールバック */
	onDelete?: (transactionId: string) => void;
	/** 支出の場合に符号を表示するか */
	showSign?: boolean;
	/** 追加のCSSクラス名 */
	className?: string;
}

/**
 * 取引行コンポーネント
 *
 * Matt Pocock方針に従い、型推論を活用しつつ明確な型定義を提供
 * React.memoとuseCallbackでパフォーマンス最適化
 */
export const TransactionRow: FC<TransactionRowProps> = memo(
	({ transaction, onEdit, onDelete, showSign = false, className = "" }) => {
		// 金額の色を取得（収入は緑、支出は赤）
		const amountColorClass =
			transaction.type === "income" ? "text-green-600" : "text-red-600";

		// 編集ハンドラー
		const handleEdit = useCallback(() => {
			onEdit?.(transaction);
		}, [onEdit, transaction]);

		// 削除ハンドラー
		const handleDelete = useCallback(() => {
			onDelete?.(transaction.id);
		}, [onDelete, transaction.id]);

		return (
			<tr
				className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${className}`}
			>
				<td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-900">
					{formatDate(transaction.date)}
				</td>
				<td
					className={`px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium ${amountColorClass}`}
				>
					{formatCurrency(transaction.amount, showSign)}
				</td>
				<td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-700 max-w-[80px] sm:max-w-none truncate">
					{formatCategoryName(transaction.category)}
				</td>
				<td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-700 max-w-[120px] sm:max-w-none truncate">
					{transaction.description || ""}
				</td>
				<td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-700">
					<div className="flex flex-col gap-1">
						{onEdit && (
							<button
								type="button"
								onClick={handleEdit}
								className="text-blue-600 hover:text-blue-800 transition-colors text-xs sm:text-sm whitespace-nowrap"
								aria-label={`${transaction.description || "取引"}を編集`}
							>
								編集
							</button>
						)}
						{onDelete && (
							<button
								type="button"
								onClick={handleDelete}
								className="text-red-600 hover:text-red-800 transition-colors text-xs sm:text-sm whitespace-nowrap"
								aria-label={`${transaction.description || "取引"}を削除`}
							>
								削除
							</button>
						)}
					</div>
				</td>
			</tr>
		);
	},
);

TransactionRow.displayName = "TransactionRow";
