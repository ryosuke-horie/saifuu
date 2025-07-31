"use client";

import { useState } from "react";
import {
	useCategoryBreakdown,
	useExportReport,
	useMonthlyReports,
} from "@/lib/api/hooks/useReports";
import type { ReportPeriod } from "@/lib/api/types/reports";
import { CategoryPieChart } from "./components/CategoryPieChart";
import { ExportButton } from "./components/ExportButton";
import { PeriodFilter } from "./components/PeriodFilter";
import { ErrorState, LoadingState } from "./components/ReportStates";
import { SavingsRateChart } from "./components/SavingsRateChart";
// コンポーネントのインポート
import { SummaryCard } from "./components/SummaryCard";
import { ToastNotification } from "./components/ToastNotification";
import { TrendChart } from "./components/TrendChart";
import { formatCurrency, formatPercentage } from "./constants";
// ユーティリティのインポート
import {
	calculateReportSummary,
	prepareSavingsRateData,
	prepareTrendData,
} from "./utils/reportCalculations";

export default function ReportsPage() {
	const [period, setPeriod] = useState<ReportPeriod>("3months");
	const [showToast, setShowToast] = useState(false);

	const {
		reports,
		isLoading: isLoadingReports,
		error: reportsError,
	} = useMonthlyReports({ period });
	const {
		breakdown,
		isLoading: isLoadingBreakdown,
		error: breakdownError,
	} = useCategoryBreakdown({ period });
	const { exportCSV, isExporting } = useExportReport();

	// ローディング状態
	if (isLoadingReports || isLoadingBreakdown) {
		return <LoadingState />;
	}

	// エラー状態
	if (reportsError || breakdownError) {
		const errorMessage =
			reportsError?.message ||
			breakdownError?.message ||
			"エラーが発生しました";
		return <ErrorState message={errorMessage} />;
	}

	// 集計データの計算
	const summary = calculateReportSummary(reports);

	// チャート用データの準備
	const trendData = prepareTrendData(reports);
	const savingsRateData = prepareSavingsRateData(reports);

	// CSVエクスポート処理
	const handleExport = async () => {
		await exportCSV({ period });
		setShowToast(true);
		setTimeout(() => setShowToast(false), 3000);
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="text-3xl font-bold mb-8">統合レポート</h1>

			{/* 期間選択フィルター */}
			<PeriodFilter value={period} onChange={setPeriod} />

			{/* 収支サマリーカード */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
				<SummaryCard title="期間合計" value="-" />
				<SummaryCard
					title="総収入"
					value={formatCurrency(summary.totalIncome)}
					className="text-green-600"
				/>
				<SummaryCard
					title="総支出"
					value={formatCurrency(summary.totalExpense)}
					className="text-red-600"
				/>
				<SummaryCard
					title="純利益"
					value={formatCurrency(summary.totalBalance)}
					className="text-blue-600"
				/>
				<SummaryCard
					title="平均貯蓄率"
					value={formatPercentage(summary.averageSavingsRate)}
					className="text-purple-600"
				/>
			</div>

			{/* トレンドチャート */}
			<TrendChart data={trendData} />

			{/* カテゴリ別比較チャート */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
				<CategoryPieChart
					data={breakdown.income}
					title="収入カテゴリ内訳"
					testId="category-comparison-chart"
				/>
				<CategoryPieChart data={breakdown.expense} title="支出カテゴリ内訳" />
			</div>

			{/* 貯蓄率推移チャート */}
			<SavingsRateChart data={savingsRateData} />

			{/* CSVエクスポートボタン */}
			<div className="flex justify-end">
				<ExportButton onClick={handleExport} isExporting={isExporting} />
			</div>

			{/* トースト通知 */}
			<ToastNotification
				message="レポートをダウンロードしました"
				show={showToast}
			/>
		</div>
	);
}
