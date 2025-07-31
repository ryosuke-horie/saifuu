import type { ReactNode } from "react";

type SummaryCardProps = {
	title: string;
	value: ReactNode;
	className?: string;
};

/**
 * サマリー情報を表示するカードコンポーネント
 * 収支サマリーなどの統計情報表示に使用
 */
export function SummaryCard({
	title,
	value,
	className = "",
}: SummaryCardProps) {
	return (
		<div className="bg-white p-6 rounded-lg shadow">
			<h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
			<p className={`text-2xl font-bold ${className}`}>{value}</p>
		</div>
	);
}
