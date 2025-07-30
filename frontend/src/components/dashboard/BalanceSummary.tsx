/**
 * 収支サマリーコンポーネント
 *
 * 月間の収入・支出・残高を視覚的に表示し、
 * 貯蓄率とトレンドを含む包括的な収支情報を提供する
 */

import { useBalanceSummary } from "../../hooks/useBalanceSummary";
import { formatCurrency } from "../../lib/utils/format";
import { Spinner } from "../ui/Spinner";

/**
 * 収支サマリーコンポーネントの実装
 *
 * 設計意図: ダッシュボードで最も重要な情報を表示するため、
 *          視覚的にわかりやすいUIを優先
 * 代替案: グラフ表示も検討したが、即座に数値を把握できる
 *         テキスト中心の表示を採用
 */
export const BalanceSummary = () => {
	const { summary, loading, error } = useBalanceSummary();

	// トレンドに基づくアイコンとスタイルを取得
	const getTrendDisplay = (trend: "positive" | "negative" | "neutral") => {
		switch (trend) {
			case "positive":
				return {
					icon: "↑",
					label: "黒字",
					className: "text-green-600 bg-green-50 border-green-200",
				};
			case "negative":
				return {
					icon: "↓",
					label: "赤字",
					className: "text-red-600 bg-red-50 border-red-200",
				};
			case "neutral":
				return {
					icon: "→",
					label: "収支均衡",
					className: "text-gray-600 bg-gray-50 border-gray-200",
				};
		}
	};

	// 残高の色を決定
	const getBalanceColorClass = (balance: number) => {
		if (balance > 0) return "text-green-600";
		if (balance < 0) return "text-red-600";
		return "text-gray-900";
	};

	// バランスバーの幅を計算（収入を100%として計算）
	const calculateBarWidth = calculatePercentageWidth;

	return (
		<div className="bg-white rounded-lg shadow p-6">
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-lg font-semibold text-gray-700">
					今月の収支サマリー
				</h2>
				{summary && (
					<div
						className={`px-3 py-1 rounded-full border ${getTrendDisplay(summary.trend).className}`}
					>
						<span className="text-sm font-medium flex items-center gap-1">
							<span>{getTrendDisplay(summary.trend).icon}</span>
							{getTrendDisplay(summary.trend).label}
						</span>
					</div>
				)}
			</div>

			{loading ? (
				<div className="flex justify-center py-8" data-testid="loading-spinner">
					<Spinner size="md" />
				</div>
			) : error ? (
				<div className="text-red-600 text-sm py-4">{error}</div>
			) : summary ? (
				<div className="space-y-6">
					{/* 収入・支出・残高の表示 */}
					<div className="space-y-4">
						{/* 収入 */}
						<div className="flex justify-between items-center">
							<span className="text-sm text-gray-600">収入</span>
							<span className="text-lg font-semibold text-green-600">
								+{formatCurrency(summary.income)}
							</span>
						</div>

						{/* 支出 */}
						<div className="flex justify-between items-center">
							<span className="text-sm text-gray-600">支出</span>
							<span className="text-lg font-semibold text-red-600">
								-{formatCurrency(summary.expense)}
							</span>
						</div>

						{/* 区切り線 */}
						<div className="border-t border-gray-200 pt-3">
							{/* 残高 */}
							<div className="flex justify-between items-center">
								<span className="text-base font-medium text-gray-700">
									残高
								</span>
								<span
									className={`text-2xl font-bold ${getBalanceColorClass(summary.balance)}`}
								>
									{summary.balance >= 0 ? "+" : ""}
									{formatCurrency(summary.balance)}
								</span>
							</div>
						</div>
					</div>

					{/* 視覚的なバランスバー */}
					<div className="space-y-2">
						<div className="text-sm text-gray-600 mb-1">収支バランス</div>
						<div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
							{/* 収入バー（緑） */}
							<div
								className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300"
								style={{
									width: `${calculateBarWidth(summary.income, Math.max(summary.income, summary.expense))}%`,
								}}
								title={`収入: ${formatCurrency(summary.income)}`}
							/>
							{/* 支出バー（赤） - 収入バーの上に重ねて表示 */}
							<div
								className="absolute top-0 left-0 h-full bg-red-500 opacity-70 transition-all duration-300"
								style={{
									width: `${calculateBarWidth(summary.expense, Math.max(summary.income, summary.expense))}%`,
								}}
								title={`支出: ${formatCurrency(summary.expense)}`}
							/>
						</div>
						<div className="flex justify-between text-xs text-gray-500">
							<span>0円</span>
							<span>
								{formatCurrency(Math.max(summary.income, summary.expense))}
							</span>
						</div>
					</div>

					{/* 貯蓄率 */}
					<div className="pt-3 border-t border-gray-200">
						<div className="flex justify-between items-center">
							<span className="text-sm text-gray-600">貯蓄率</span>
							<span
								className={`text-lg font-semibold ${getBalanceColorClass(summary.balance)}`}
							>
								{summary.savingsRate}%
							</span>
						</div>
						{/* 貯蓄率プログレスバー */}
						<div className="mt-2">
							<div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
								<div
									className={`absolute top-0 left-0 h-full transition-all duration-300 ${
										summary.savingsRate >= 0 ? "bg-green-500" : "bg-red-500"
									}`}
									style={{ width: `${Math.abs(summary.savingsRate)}%` }}
								/>
							</div>
						</div>
					</div>
				</div>
			) : (
				<div className="text-gray-500 text-sm py-4">データがありません</div>
			)}
		</div>
	);
};

/**
 * 金額の割合をパーセンテージ幅として計算する
 *
 * 設計意図: バーの幅計算ロジックを共通関数として切り出し、
 *          再利用性とテスト可能性を向上
 * @param amount 表示する金額
 * @param total 全体の金額（100%とする基準）
 * @returns パーセンテージ幅（0-100）
 */
function calculatePercentageWidth(amount: number, total: number): number {
	if (total === 0) return 0;
	return Math.min((amount / total) * 100, 100);
}
