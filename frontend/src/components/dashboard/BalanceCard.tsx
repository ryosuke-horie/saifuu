/**
 * 収支バランスカードコンポーネント
 *
 * 収入・支出・残高を表示するダッシュボードカード
 * API統計情報を基に計算された値を表示
 */

import { formatCurrency } from "../../lib/utils/format";
import { Spinner } from "../ui/Spinner";

interface BalanceCardProps {
	/** 総収入額 */
	totalIncome: number;
	/** 総支出額 */
	totalExpense: number;
	/** 収支残高（収入 - 支出） */
	balance: number;
	/** ローディング状態 */
	isLoading?: boolean;
	/** エラーメッセージ */
	error?: string | null;
}

export const BalanceCard = ({
	totalIncome,
	totalExpense,
	balance,
	isLoading = false,
	error = null,
}: BalanceCardProps) => {
	// 残高の色を決定（プラスは緑、マイナスは赤、ゼロは黒）
	const getBalanceColorClass = (balance: number) => {
		if (balance > 0) return "text-green-600";
		if (balance < 0) return "text-red-600";
		return "text-gray-900";
	};

	return (
		<div className="bg-white rounded-lg shadow p-6">
			<h2 className="text-lg font-semibold text-gray-700 mb-4">
				今月の収支バランス
			</h2>

			{isLoading ? (
				<div className="flex justify-center py-8" data-testid="loading-spinner">
					<Spinner size="md" />
				</div>
			) : error ? (
				<div className="text-red-600 text-sm py-4">{error}</div>
			) : (
				<div className="space-y-4">
					{/* 収入 */}
					<div className="flex justify-between items-center">
						<span className="text-sm text-gray-600">収入</span>
						<span className="text-lg font-semibold text-green-600">
							+{formatCurrency(totalIncome)}
						</span>
					</div>

					{/* 支出 */}
					<div className="flex justify-between items-center">
						<span className="text-sm text-gray-600">支出</span>
						<span className="text-lg font-semibold text-red-600">
							-{formatCurrency(totalExpense)}
						</span>
					</div>

					{/* 区切り線 */}
					<div className="border-t border-gray-200 pt-3">
						{/* 残高 */}
						<div className="flex justify-between items-center">
							<span className="text-base font-medium text-gray-700">残高</span>
							<span
								className={`text-2xl font-bold ${getBalanceColorClass(balance)}`}
							>
								{balance >= 0 ? "+" : ""}
								{formatCurrency(balance)}
							</span>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};
