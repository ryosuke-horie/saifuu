/**
 * ダッシュボードのサマリーカードコンポーネント
 *
 * 統計情報を表示する再利用可能なカード
 * ローディング状態の表示に対応
 */

import type { ReactNode } from "react";
import { Spinner } from "../ui/Spinner";

interface SummaryCardProps {
	/** カードのタイトル */
	title: string;
	/** メインの値（フォーマット済み） */
	value: ReactNode;
	/** サブテキスト */
	subText?: ReactNode;
	/** 値の色クラス */
	valueColorClass?: string;
	/** ローディング状態 */
	isLoading?: boolean;
	/** 追加のコンテンツ */
	children?: ReactNode;
	/** 追加のCSSクラス */
	className?: string;
}

export const SummaryCard = ({
	title,
	value,
	subText,
	valueColorClass = "text-gray-900",
	isLoading = false,
	children,
	className = "",
}: SummaryCardProps) => {
	return (
		<div className={`bg-white rounded-lg shadow p-6 ${className}`}>
			<h2 className="text-lg font-semibold text-gray-700 mb-4">{title}</h2>
			{isLoading ? (
				<div className="flex justify-center py-4" data-testid="loading-spinner">
					<Spinner size="md" />
				</div>
			) : (
				<>
					<p className={`text-3xl font-bold ${valueColorClass}`}>{value}</p>
					{subText && <p className="text-sm text-gray-500 mt-2">{subText}</p>}
					{children}
				</>
			)}
		</div>
	);
};
