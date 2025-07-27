/**
 * サブスクリプションサマリーカードコンポーネント
 *
 * サブスクリプションの統計情報を表示する専用カード
 */

import type { SubscriptionStats } from "../../lib/api/types";
import { formatCurrency } from "../../lib/utils/format";
import { Spinner } from "../ui/Spinner";

interface SubscriptionSummaryCardProps {
	/** サブスクリプション統計データ */
	stats: SubscriptionStats | null | undefined;
	/** ローディング状態 */
	isLoading?: boolean;
	/** 追加のCSSクラス */
	className?: string;
}

export const SubscriptionSummaryCard = ({
	stats,
	isLoading = false,
	className = "",
}: SubscriptionSummaryCardProps) => {
	// データ取得の安全なアクセス
	const totalActive = stats?.totalActive ?? 0;
	const monthlyTotal = stats?.monthlyTotal ?? 0;

	return (
		<div className={`bg-white rounded-lg shadow p-6 ${className}`}>
			{isLoading ? (
				<div className="flex justify-center py-4">
					<Spinner size="md" />
				</div>
			) : (
				<>
					<div className="mb-4">
						<h2 className="text-lg font-semibold text-gray-700 mb-2">
							アクティブなサブスク
						</h2>
						<p className="text-2xl font-bold text-blue-600">{totalActive}件</p>
					</div>
					<div>
						<h3 className="text-sm font-medium text-gray-600 mb-1">月額合計</h3>
						<p className="text-xl font-semibold text-gray-900">
							{formatCurrency(monthlyTotal)}
						</p>
					</div>
				</>
			)}
		</div>
	);
};
