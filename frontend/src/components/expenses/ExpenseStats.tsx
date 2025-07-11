/**
 * 支出統計コンポーネント
 *
 * 月間収支、主要カテゴリ、期間比較などの統計情報を表示する
 *
 * 設計方針:
 * - 統計カードレイアウトで情報を整理
 * - 数値は日本円形式でフォーマット
 * - 収入は緑、支出は赤、プラス収支は緑、マイナス収支は赤で表示
 * - ローディング・エラー・空状態の適切な表示
 * - レスポンシブデザインに対応
 * - アクセシビリティを考慮したマークアップ
 */

import type { FC } from "react";

// 現在のAPI仕様で利用可能な基本統計データ
export interface BaseStatsData {
	totalIncome: number;
	totalExpense: number;
	balance: number;
	transactionCount: number;
}

// 拡張された統計データ（将来的な機能を含む）
export interface ExtendedStatsData extends BaseStatsData {
	monthlyComparison?: number; // 前月比（パーセンテージ）
	topExpenseCategory?: { name: string; amount: number } | null;
	topIncomeCategory?: { name: string; amount: number } | null;
}

// プロパティの型定義
export interface ExpenseStatsProps {
	stats: BaseStatsData | ExtendedStatsData | null | undefined;
	isLoading?: boolean;
	error?: string | null;
	className?: string;
	onRefresh?: () => void;
	onRetry?: () => void;
}

/**
 * 金額を日本円形式でフォーマット
 */
const formatCurrency = (amount: number): string => {
	return new Intl.NumberFormat("ja-JP", {
		style: "currency",
		currency: "JPY",
	}).format(amount);
};

/**
 * パーセンテージをフォーマット（前月比用）
 */
const formatPercentage = (percentage: number): string => {
	const sign = percentage >= 0 ? "+" : "";
	return `${sign}${percentage.toFixed(1)}%`;
};

/**
 * ローディング状態コンポーネント
 */
const LoadingState: FC = () => (
	<div
		className="flex items-center justify-center py-16"
		data-testid="stats-loading"
		role="status"
		aria-live="polite"
	>
		<div className="flex items-center space-x-3">
			<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
			<span className="text-gray-600">読み込み中...</span>
		</div>
	</div>
);

/**
 * エラー状態コンポーネント
 */
const ErrorState: FC<{ message: string; onRetry?: () => void }> = ({
	message,
	onRetry,
}) => (
	<div
		className="flex flex-col items-center justify-center py-16 text-center"
		data-testid="stats-error"
		role="alert"
		aria-live="assertive"
	>
		<div className="flex items-center space-x-2 text-red-600 mb-4">
			<span className="text-2xl">⚠️</span>
			<span className="font-semibold">エラー</span>
		</div>
		<p className="text-gray-700 mb-4 max-w-md">{message}</p>
		{onRetry && (
			<button
				type="button"
				onClick={onRetry}
				className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
				data-testid="stats-retry-button"
			>
				再試行
			</button>
		)}
	</div>
);

/**
 * 空データ状態コンポーネント
 */
const EmptyState: FC = () => (
	<div
		className="flex flex-col items-center justify-center py-16 text-center"
		data-testid="stats-empty"
	>
		<div className="text-6xl mb-4">📊</div>
		<h3 className="text-lg font-semibold text-gray-900 mb-2">
			データがありません
		</h3>
		<p className="text-gray-600">取引を登録してください</p>
	</div>
);

/**
 * 統計カードコンポーネント
 */
const StatsCard: FC<{
	title: string;
	children: React.ReactNode;
	testId: string;
	className?: string;
}> = ({ title, children, testId, className = "" }) => (
	<div
		className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}
		data-testid={testId}
		role="region"
		aria-labelledby={`${testId}-title`}
	>
		<h3
			id={`${testId}-title`}
			className="text-lg font-semibold text-gray-900 mb-4"
		>
			{title}
		</h3>
		{children}
	</div>
);

/**
 * 月間収支カードコンポーネント
 */
const MonthlyBalanceCard: FC<{ stats: BaseStatsData | ExtendedStatsData }> = ({
	stats,
}) => (
	<StatsCard title="月間収支" testId="monthly-balance-card">
		<div className="space-y-4">
			{/* 収入 */}
			<div className="flex justify-between items-center">
				<span className="text-gray-600">収入</span>
				<span
					className="text-lg font-semibold text-green-600"
					data-testid="total-income"
				>
					{formatCurrency(stats.totalIncome)}
				</span>
			</div>

			{/* 支出 */}
			<div className="flex justify-between items-center">
				<span className="text-gray-600">支出</span>
				<span
					className="text-lg font-semibold text-red-600"
					data-testid="total-expense"
				>
					{formatCurrency(stats.totalExpense)}
				</span>
			</div>

			{/* 差額（収支） */}
			<div className="flex justify-between items-center pt-4 border-t border-gray-200">
				<span className="font-semibold text-gray-900">差額</span>
				<span
					className={`text-xl font-bold ${
						stats.balance >= 0 ? "text-green-600" : "text-red-600"
					}`}
					data-testid="balance-amount"
				>
					{stats.balance >= 0 ? "" : "-"}
					{formatCurrency(Math.abs(stats.balance))}
				</span>
			</div>

			{/* 取引件数 */}
			<div className="flex justify-between items-center text-sm text-gray-500">
				<span>取引件数</span>
				<span>{stats.transactionCount}件</span>
			</div>
		</div>
	</StatsCard>
);

/**
 * 主要カテゴリカードコンポーネント（将来機能）
 */
const TopCategoriesCard: FC<{ stats: BaseStatsData | ExtendedStatsData }> = ({
	stats,
}) => {
	// 型ガードで拡張データをチェック
	const extendedStats = stats as ExtendedStatsData;

	return (
		<StatsCard title="主要カテゴリ" testId="top-categories-card">
			<div className="space-y-4">
				{/* 最大支出カテゴリ */}
				<div className="space-y-2">
					<span className="text-sm text-gray-600">最大支出</span>
					<div
						className="flex justify-between items-center"
						data-testid="top-expense-category"
					>
						{extendedStats.topExpenseCategory ? (
							<>
								<span className="font-medium text-gray-900">
									{extendedStats.topExpenseCategory.name}
								</span>
								<span className="text-red-600 font-semibold">
									{formatCurrency(extendedStats.topExpenseCategory.amount)}
								</span>
							</>
						) : (
							<span className="text-gray-500">データなし</span>
						)}
					</div>
				</div>

				{/* 最大収入カテゴリ */}
				<div className="space-y-2">
					<span className="text-sm text-gray-600">最大収入</span>
					<div
						className="flex justify-between items-center"
						data-testid="top-income-category"
					>
						{extendedStats.topIncomeCategory ? (
							<>
								<span className="font-medium text-gray-900">
									{extendedStats.topIncomeCategory.name}
								</span>
								<span className="text-green-600 font-semibold">
									{formatCurrency(extendedStats.topIncomeCategory.amount)}
								</span>
							</>
						) : (
							<span className="text-gray-500">データなし</span>
						)}
					</div>
				</div>
			</div>
		</StatsCard>
	);
};

/**
 * 期間比較カードコンポーネント（将来機能）
 */
const PeriodComparisonCard: FC<{
	stats: BaseStatsData | ExtendedStatsData;
}> = ({ stats }) => {
	// 型ガードで拡張データをチェック
	const extendedStats = stats as ExtendedStatsData;

	return (
		<StatsCard title="前月比" testId="period-comparison-card">
			<div className="text-center">
				{extendedStats.monthlyComparison !== undefined ? (
					<>
						<div
							className={`text-3xl font-bold ${
								extendedStats.monthlyComparison >= 0
									? "text-green-600"
									: "text-red-600"
							}`}
							data-testid="monthly-comparison"
						>
							{formatPercentage(extendedStats.monthlyComparison)}
						</div>
						<p className="text-sm text-gray-600 mt-2">
							前月と比較した収支の変化
						</p>
					</>
				) : (
					<>
						<div
							className="text-3xl font-bold text-gray-400"
							data-testid="monthly-comparison"
						>
							--%
						</div>
						<p className="text-sm text-gray-600 mt-2">データなし</p>
					</>
				)}
			</div>
		</StatsCard>
	);
};

/**
 * メイン統計コンポーネント
 */
export const ExpenseStats: FC<ExpenseStatsProps> = ({
	stats,
	isLoading = false,
	error = null,
	className = "",
	onRefresh,
	onRetry,
}) => {
	// ローディング状態
	if (isLoading) {
		return <LoadingState />;
	}

	// エラー状態
	if (error) {
		return <ErrorState message={error} onRetry={onRetry} />;
	}

	// 統計データなしまたは空データ
	if (!stats) {
		return <EmptyState />;
	}

	// 空データの判定（全ての金額が0の場合）
	const isEmpty =
		stats.totalIncome === 0 &&
		stats.totalExpense === 0 &&
		stats.transactionCount === 0;

	return (
		<section
			className={`space-y-6 ${className}`}
			data-testid="expense-stats"
			aria-labelledby="expense-stats-title"
		>
			{/* ヘッダー */}
			<div className="flex items-center justify-between">
				<div>
					<h2
						id="expense-stats-title"
						className="text-2xl font-bold text-gray-900"
					>
						統計情報
					</h2>
					<p className="text-gray-600 mt-1">月間の収支データ</p>
				</div>

				{/* リフレッシュボタン（オプション） */}
				{onRefresh && (
					<button
						type="button"
						onClick={onRefresh}
						disabled={isLoading}
						className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
						data-testid="stats-refresh-button"
					>
						<span className="mr-2">🔄</span>
						更新
					</button>
				)}
			</div>

			{/* 空データの場合の表示 */}
			{isEmpty && <EmptyState />}

			{/* 統計カードグリッド */}
			{!isEmpty && (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{/* 月間収支カード */}
					<MonthlyBalanceCard stats={stats} />

					{/* 主要カテゴリカード */}
					<TopCategoriesCard stats={stats} />

					{/* 期間比較カード */}
					<PeriodComparisonCard stats={stats} />
				</div>
			)}
		</section>
	);
};
