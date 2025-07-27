/**
 * テーブル用空状態表示コンポーネント
 *
 * テーブルにデータがない場合の統一的な表示を提供
 *
 * 設計方針:
 * - テーブルの行として表示（colSpanで全列を使用）
 * - 視覚的に分かりやすいアイコンとメッセージ
 * - ユーザーへの次のアクションを促す
 */

import type { FC, ReactNode } from "react";
import { memo } from "react";

export interface EmptyStateProps {
	/** メインメッセージ */
	message: string;
	/** サブメッセージ（オプション） */
	subMessage?: string;
	/** アイコン（絵文字やReactNode） */
	icon?: ReactNode;
	/** テーブルの列数（colSpanに使用） */
	colSpan?: number;
	/** 追加のCSSクラス名 */
	className?: string;
}

/**
 * 空状態の表示コンポーネント
 *
 * Matt Pocock方針に従い、型推論を活用しつつ明確な型定義を提供
 * React.memoでパフォーマンス最適化
 */
export const EmptyState: FC<EmptyStateProps> = memo(
	({ message, subMessage, icon, colSpan = 5, className = "" }) => {
		return (
			<tr className={className}>
				<td colSpan={colSpan} className="px-4 py-8 text-center text-gray-500">
					<div className="flex flex-col items-center space-y-2">
						{icon && (
							<span className="text-3xl" role="img" aria-label="空状態">
								{icon}
							</span>
						)}
						<span>{message}</span>
						{subMessage && (
							<span className="text-sm text-gray-400">{subMessage}</span>
						)}
					</div>
				</td>
			</tr>
		);
	},
);

EmptyState.displayName = "EmptyState";
