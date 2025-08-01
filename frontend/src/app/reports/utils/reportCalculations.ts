import type { MonthlyReport } from "@/lib/api/types/reports";
import { CHART_DATA_KEYS } from "../constants";

/**
 * 月次レポートの集計結果
 */
export type ReportSummary = {
	totalIncome: number;
	totalExpense: number;
	totalBalance: number;
	averageSavingsRate: number;
};

/**
 * 月次レポートから集計データを計算
 * @param reports 月次レポートの配列
 * @returns 集計結果
 */
export function calculateReportSummary(
	reports: MonthlyReport[],
): ReportSummary {
	if (reports.length === 0) {
		return {
			totalIncome: 0,
			totalExpense: 0,
			totalBalance: 0,
			averageSavingsRate: 0,
		};
	}

	const totals = reports.reduce(
		(acc, report) => ({
			totalIncome: acc.totalIncome + report.income,
			totalExpense: acc.totalExpense + report.expense,
			totalBalance: acc.totalBalance + report.balance,
		}),
		{ totalIncome: 0, totalExpense: 0, totalBalance: 0 },
	);

	const averageSavingsRate =
		reports.reduce((sum, report) => sum + report.savingsRate, 0) /
		reports.length;

	return {
		...totals,
		averageSavingsRate,
	};
}

/**
 * トレンドチャート用のデータ形式に変換
 */
export function prepareTrendData(reports: MonthlyReport[]) {
	return reports.map((report) => ({
		month: report.month,
		[CHART_DATA_KEYS.income]: report.income,
		[CHART_DATA_KEYS.expense]: report.expense,
		[CHART_DATA_KEYS.balance]: report.balance,
	}));
}

/**
 * 貯蓄率チャート用のデータ形式に変換
 */
export function prepareSavingsRateData(reports: MonthlyReport[]) {
	return reports.map((report) => ({
		month: report.month,
		[CHART_DATA_KEYS.savingsRate]: report.savingsRate,
	}));
}
