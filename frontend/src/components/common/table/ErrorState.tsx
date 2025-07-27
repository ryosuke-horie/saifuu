/**
 * テーブル用エラー状態表示コンポーネント
 *
 * テーブル内でエラーが発生した場合の統一的な表示を提供
 *
 * 設計方針:
 * - テーブルの行として表示（colSpanで全列を使用）
 * - 視覚的にエラーであることを明確に示す
 * - アクセシブルなエラー表示
 */

import type { FC } from "react";
import { memo } from "react";

export interface ErrorStateProps {
	/** エラーメッセージ */
	message: string;
	/** テーブルの列数（colSpanに使用） */
	colSpan?: number;
	/** アイコン（デフォルト: ⚠️） */
	icon?: string;
	/** 追加のCSSクラス名 */
	className?: string;
}

/**
 * エラー状態の表示コンポーネント
 *
 * Matt Pocock方針に従い、型推論を活用しつつ明確な型定義を提供
 * React.memoでパフォーマンス最適化
 */
export const ErrorState: FC<ErrorStateProps> = memo(
	({ message, colSpan = 5, icon = "⚠️", className = "" }) => {
		return (
			<tr className={className}>
				<td colSpan={colSpan} className="px-4 py-8 text-center text-red-600">
					<div className="flex items-center justify-center space-x-2">
						<span className="text-xl" role="img" aria-label="エラー">
							{icon}
						</span>
						<span>エラー: {message}</span>
					</div>
				</td>
			</tr>
		);
	},
);

ErrorState.displayName = "ErrorState";
