/**
 * 支出統計コンポーネント
 *
 * 月間支出、主要カテゴリ、期間比較などの統計情報を表示する
 *
 * 設計方針:
 * - 統計カードレイアウトで情報を整理
 * - 数値は日本円形式でフォーマット
 * - 支出は赤で表示
 * - ローディング・エラー・空状態の適切な表示
 * - レスポンシブデザインに対応
 * - アクセシビリティを考慮したマークアップ
 */

import React, { type FC } from "react";
import { formatCurrency, formatPercentage } from "../../utils/format";
import { LoadingState, Skeleton } from "../ui";

// 現在のAPI仕様で利用可能な基本統計データ
export interface BaseStatsData {
	totalExpense: number;
	transactionCount: number;
}

// 拡張された統計データ（将来的な機能を含む）
export interface ExtendedStatsData extends BaseStatsData {
	monthlyComparison?: number; // 前月比（パーセンテージ）
	topExpenseCategory?: { name: string; amount: number } | null;
}

// エラータイプの定義
export type ErrorType = "network" | "server" | "timeout" | "unknown";

// プロパティの型定義
export interface ExpenseStatsProps {
	stats: BaseStatsData | ExtendedStatsData | null | undefined;
	isLoading?: boolean;
	error?: string | null;
	errorType?: ErrorType;
	className?: string;
	onRefresh?: () => void;
	onRetry?: () => void;
	useSkeletonLoader?: boolean; // スケルトンローダーを使用するかどうか
}

/**
 * 統計データが拡張データかどうかを判定する型ガード
 */
const isExtendedStatsData = (
	stats: BaseStatsData | ExtendedStatsData,
): stats is ExtendedStatsData => {
	return "monthlyComparison" in stats || "topExpenseCategory" in stats;
};

/**
 * 月次比較データが利用可能かどうかを判定
 */
const hasMonthlyComparison = (
	stats: BaseStatsData | ExtendedStatsData,
): boolean => {
	return isExtendedStatsData(stats) && stats.monthlyComparison !== undefined;
};

/**
 * カテゴリデータが利用可能かどうかを判定
 */
const hasCategoryData = (stats: BaseStatsData | ExtendedStatsData): boolean => {
	return isExtendedStatsData(stats) && stats.topExpenseCategory !== undefined;
};

/**
 * スケルトンローダーコンポーネント
 * より良いUXを提供するためのスケルトンローダー
 */
const SkeletonLoader: FC = () => (
	<div
		className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
		data-testid="stats-skeleton"
	>
		{[1, 2, 3].map((index) => (
			<div key={index} className="bg-white rounded-lg shadow-sm p-6">
				<Skeleton variant="text" width="75%" height={24} className="mb-4" />
				<div className="space-y-3">
					<Skeleton variant="text" width="100%" />
					<Skeleton variant="text" width="83%" />
					<Skeleton
						variant="rectangular"
						width="50%"
						height={32}
						className="mt-4"
					/>
				</div>
			</div>
		))}
	</div>
);

/**
 * 従来のローディング表示（シンプルなスピナー）
 */
const LoadingSpinner: FC = () => (
	<div className="py-12">
		<LoadingState size="lg" layout="block" testId="stats-loading" />
	</div>
);

/**
 * エラー状態コンポーネント
 * エラータイプに応じて適切なメッセージとアイコンを表示
 */
const ErrorState: FC<{
	message: string;
	errorType?: ErrorType;
	onRetry?: () => void;
}> = ({ message, errorType = "unknown", onRetry }) => {
	// エラータイプごとのアイコンとメッセージ
	const errorConfigs = {
		network: {
			icon: "🌐",
			title: "ネットワークエラー",
			suggestion: "インターネット接続を確認してください。",
		},
		server: {
			icon: "🛠️",
			title: "サーバーエラー",
			suggestion:
				"サーバーで問題が発生しました。しばらく待ってから再度お試しください。",
		},
		timeout: {
			icon: "⏱️",
			title: "タイムアウト",
			suggestion: "リクエストがタイムアウトしました。再度お試しください。",
		},
		unknown: {
			icon: "⚠️",
			title: "エラー",
			suggestion: "予期しないエラーが発生しました。",
		},
	};

	const config = errorConfigs[errorType];

	return (
		<div
			className="flex flex-col items-center justify-center py-12 px-6"
			data-testid="stats-error"
			role="alert"
			aria-live="assertive"
		>
			<span className="text-4xl mb-4" role="img" aria-label={config.title}>
				{config.icon}
			</span>
			<h3 className="text-lg font-semibold text-gray-900 mb-2">
				{config.title}
			</h3>
			<p className="text-gray-600 text-center max-w-md mb-2">{message}</p>
			<p className="text-sm text-gray-500 text-center max-w-md mb-4">
				{config.suggestion}
			</p>
			{onRetry && (
				<button
					type="button"
					onClick={onRetry}
					className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
					data-testid="stats-retry-button"
				>
					再試行
				</button>
			)}
		</div>
	);
};

/**
 * 空状態コンポーネント
 */
const EmptyState: FC = () => (
	<div
		className="flex flex-col items-center justify-center py-12"
		data-testid="stats-empty"
	>
		<svg
			className="w-16 h-16 text-gray-300 mb-4"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
			aria-hidden="true"
		>
			<title>データなしアイコン</title>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={2}
				d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
			/>
		</svg>
		<h3 className="text-lg font-medium text-gray-900 mb-2">
			データがありません
		</h3>
		<p className="text-gray-600">取引を登録してください</p>
	</div>
);

/**
 * 統計カードコンポーネント（共通レイアウト）
 */
const StatsCard: FC<{
	title: string;
	children: React.ReactNode;
	testId?: string;
}> = ({ title, children, testId }) => (
	<div
		className="bg-white rounded-lg shadow-sm p-6"
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
 * 月間支出カードコンポーネント
 */
const MonthlyExpenseCard: FC<{ stats: BaseStatsData | ExtendedStatsData }> = ({
	stats,
}) => (
	<StatsCard title="月間支出" testId="monthly-balance-card">
		<div className="space-y-4">
			{/* 支出 */}
			<div className="flex justify-between items-center">
				<span className="text-gray-600">支出合計</span>
				<span
					className="text-xl font-bold text-red-600"
					data-testid="total-expense"
				>
					{formatCurrency(stats.totalExpense)}
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
 * 主要カテゴリカードコンポーネント
 */
const TopCategoriesCard: FC<{ stats: BaseStatsData | ExtendedStatsData }> = ({
	stats,
}) => {
	const hasData = hasCategoryData(stats);
	const extendedStats = isExtendedStatsData(stats) ? stats : null;

	return (
		<StatsCard title="主要カテゴリ" testId="top-categories-card">
			<div className="space-y-4">
				{/* 支出カテゴリ */}
				<div>
					<p className="text-sm text-gray-600 mb-2">最大支出カテゴリ</p>
					<div
						className="flex justify-between items-center"
						data-testid="top-expense-category"
					>
						<span className="font-medium text-gray-900">
							{hasData && extendedStats?.topExpenseCategory
								? extendedStats.topExpenseCategory.name
								: "データなし"}
						</span>
						{hasData && extendedStats?.topExpenseCategory && (
							<span className="text-red-600">
								{formatCurrency(extendedStats.topExpenseCategory.amount)}
							</span>
						)}
					</div>
				</div>
			</div>
		</StatsCard>
	);
};

/**
 * 期間比較カードコンポーネント
 */
const PeriodComparisonCard: FC<{
	stats: BaseStatsData | ExtendedStatsData;
}> = ({ stats }) => {
	const hasComparison = hasMonthlyComparison(stats);
	const extendedStats = isExtendedStatsData(stats) ? stats : null;

	return (
		<StatsCard title="期間比較" testId="period-comparison-card">
			<div className="space-y-4">
				{/* 前月比 */}
				<div>
					<p className="text-sm text-gray-600 mb-2">前月比</p>
					<div className="flex items-center" data-testid="monthly-comparison">
						{hasComparison && extendedStats?.monthlyComparison !== undefined ? (
							<>
								<span
									className={`text-2xl font-bold ${
										extendedStats.monthlyComparison >= 0
											? "text-red-600"
											: "text-green-600"
									}`}
								>
									{formatPercentage(extendedStats.monthlyComparison)}
								</span>
								<span className="ml-2 text-sm text-gray-500">
									{extendedStats.monthlyComparison >= 0 ? "増加" : "減少"}
								</span>
							</>
						) : (
							<span className="text-gray-400">--%</span>
						)}
					</div>
				</div>
			</div>
		</StatsCard>
	);
};

/**
 * メイン統計コンポーネント
 */
const ExpenseStatsBase: FC<ExpenseStatsProps> = ({
	stats,
	isLoading = false,
	error = null,
	errorType = "unknown",
	className = "",
	onRefresh,
	onRetry,
	useSkeletonLoader = true,
}) => {
	// ローディング状態
	if (isLoading) {
		return useSkeletonLoader ? <SkeletonLoader /> : <LoadingSpinner />;
	}

	// エラー状態
	if (error) {
		return (
			<ErrorState message={error} errorType={errorType} onRetry={onRetry} />
		);
	}

	// 空またはnullデータの処理
	if (!stats) {
		return <EmptyState />;
	}

	// 空状態の判定（すべての値が0）
	const isEmpty = stats.totalExpense === 0 && stats.transactionCount === 0;

	return (
		<section
			className={`${className}`}
			data-testid="expense-stats"
			aria-labelledby="expense-stats-title"
		>
			{/* タイトル（視覚的には非表示だがスクリーンリーダー用） */}
			<h2 id="expense-stats-title" className="sr-only">
				支出統計情報
			</h2>

			{/* リフレッシュボタン */}
			{onRefresh && !isEmpty && (
				<div className="flex justify-end mb-4">
					<button
						type="button"
						onClick={onRefresh}
						className="text-blue-600 hover:text-blue-800 transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg px-3 py-1"
						data-testid="stats-refresh-button"
					>
						更新
					</button>
				</div>
			)}

			{/* 空状態の表示 */}
			{isEmpty && <EmptyState />}

			{/* 統計カードグリッド */}
			{!isEmpty && (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{/* 月間支出カード */}
					<MonthlyExpenseCard stats={stats} />

					{/* 主要カテゴリカード */}
					<TopCategoriesCard stats={stats} />

					{/* 期間比較カード */}
					<PeriodComparisonCard stats={stats} />
				</div>
			)}
		</section>
	);
};

/**
 * パフォーマンス最適化されたメイン統計コンポーネント
 * React.memoでラップして不必要な再レンダリングを防ぐ
 */
export const ExpenseStats = React.memo<ExpenseStatsProps>(ExpenseStatsBase);

// 表示名を設定（デバッグ時に便利）
ExpenseStats.displayName = "ExpenseStats";
