/**
 * 空状態表示コンポーネント
 *
 * テーブルまたは非テーブルコンテキストでの空状態表示を提供
 *
 * 設計方針:
 * - variant='table': テーブル行として表示（colSpanで全列を使用）
 * - variant='div': div要素として表示（非テーブルコンテキスト用）
 * - 視覚的に分かりやすいアイコンとメッセージ
 * - ユーザーへの次のアクションを促す
 * - Hydrationエラーを防ぐための適切なHTML構造
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
	/** テーブルの列数（colSpanに使用、variant='table'時のみ） */
	colSpan?: number;
	/** 追加のCSSクラス名 */
	className?: string;
	/** 表示バリアント：テーブル行またはdiv要素 */
	variant?: "table" | "div";
}

/**
 * 空状態の表示コンポーネント
 *
 * Matt Pocock方針に従い、型推論を活用しつつ明確な型定義を提供
 * React.memoでパフォーマンス最適化
 *
 * バリアント対応:
 * - 'table': テーブル行として表示（<tr><td>...）
 * - 'div': div要素として表示（非テーブルコンテキスト用）
 */
export const EmptyState: FC<EmptyStateProps> = memo(
	({
		message,
		subMessage,
		icon,
		colSpan = 5,
		className = "",
		variant = "table",
	}) => {
		// 共通のコンテンツ要素
		const content = (
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
		);

		// variant='table': テーブル行として表示
		if (variant === "table") {
			return (
				<tr className={className}>
					<td colSpan={colSpan} className="px-4 py-8 text-center text-gray-500">
						{content}
					</td>
				</tr>
			);
		}

		// variant='div': div要素として表示
		return (
			<div className={`px-4 py-8 text-center text-gray-500 ${className}`}>
				{content}
			</div>
		);
	},
);

EmptyState.displayName = "EmptyState";
