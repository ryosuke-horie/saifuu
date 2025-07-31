import { describe, expect, it } from "vitest";
import type { MonthlyReport } from "@/lib/api/types/reports";
import {
	calculateReportSummary,
	prepareSavingsRateData,
	prepareTrendData,
} from "../reportCalculations";

const mockReports: MonthlyReport[] = [
	{
		month: "2025-01",
		income: 500000,
		expense: 300000,
		balance: 200000,
		savingsRate: 40,
		categories: [],
	},
	{
		month: "2024-12",
		income: 450000,
		expense: 280000,
		balance: 170000,
		savingsRate: 37.8,
		categories: [],
	},
];

describe("reportCalculations", () => {
	describe("calculateReportSummary", () => {
		it("月次レポートから正しく集計データを計算する", () => {
			const result = calculateReportSummary(mockReports);

			expect(result.totalIncome).toBe(950000);
			expect(result.totalExpense).toBe(580000);
			expect(result.totalBalance).toBe(370000);
			expect(result.averageSavingsRate).toBeCloseTo(38.9, 1);
		});

		it("空の配列の場合はゼロを返す", () => {
			const result = calculateReportSummary([]);

			expect(result.totalIncome).toBe(0);
			expect(result.totalExpense).toBe(0);
			expect(result.totalBalance).toBe(0);
			expect(result.averageSavingsRate).toBe(0);
		});

		it("単一のレポートでも正しく計算する", () => {
			const singleReport = [mockReports[0]];
			const result = calculateReportSummary(singleReport);

			expect(result.totalIncome).toBe(500000);
			expect(result.totalExpense).toBe(300000);
			expect(result.totalBalance).toBe(200000);
			expect(result.averageSavingsRate).toBe(40);
		});
	});

	describe("prepareTrendData", () => {
		it("トレンドチャート用のデータ形式に変換する", () => {
			const result = prepareTrendData(mockReports);

			expect(result).toHaveLength(2);
			expect(result[0]).toEqual({
				month: "2025-01",
				収入: 500000,
				支出: 300000,
				残高: 200000,
			});
			expect(result[1]).toEqual({
				month: "2024-12",
				収入: 450000,
				支出: 280000,
				残高: 170000,
			});
		});

		it("空の配列の場合は空の配列を返す", () => {
			const result = prepareTrendData([]);
			expect(result).toEqual([]);
		});
	});

	describe("prepareSavingsRateData", () => {
		it("貯蓄率チャート用のデータ形式に変換する", () => {
			const result = prepareSavingsRateData(mockReports);

			expect(result).toHaveLength(2);
			expect(result[0]).toEqual({
				month: "2025-01",
				貯蓄率: 40,
			});
			expect(result[1]).toEqual({
				month: "2024-12",
				貯蓄率: 37.8,
			});
		});

		it("空の配列の場合は空の配列を返す", () => {
			const result = prepareSavingsRateData([]);
			expect(result).toEqual([]);
		});
	});
});
