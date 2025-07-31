import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CategoryBreakdown, MonthlyReport } from "../../types";
import {
	exportReportAsCSV,
	fetchCategoryBreakdown,
	fetchMonthlyReports,
} from "../reports";

// fetchのモック
global.fetch = vi.fn();

describe("Reports API Service", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("fetchMonthlyReports", () => {
		it("月別レポートを正常に取得する", async () => {
			const mockData: MonthlyReport[] = [
				{
					month: "2025-01",
					income: 500000,
					expense: 300000,
					balance: 200000,
					savingsRate: 40,
					categories: [
						{
							categoryId: "101",
							categoryName: "給与",
							amount: 500000,
							type: "income",
						},
						{
							categoryId: "1",
							categoryName: "食費",
							amount: 50000,
							type: "expense",
						},
					],
				},
			];

			vi.mocked(global.fetch).mockResolvedValueOnce({
				ok: true,
				json: async () => mockData,
			} as Response);

			const result = await fetchMonthlyReports({ period: "3months" });

			expect(fetch).toHaveBeenCalledWith("/api/reports/monthly?period=3months");
			expect(result).toEqual(mockData);
		});

		it("エラーレスポンスの場合、エラーを投げる", async () => {
			vi.mocked(global.fetch).mockResolvedValueOnce({
				ok: false,
				status: 500,
				statusText: "Internal Server Error",
			} as Response);

			await expect(fetchMonthlyReports({ period: "6months" })).rejects.toThrow(
				"Failed to fetch monthly reports",
			);
		});

		it("カスタム期間パラメータを正しく送信する", async () => {
			vi.mocked(global.fetch).mockResolvedValueOnce({
				ok: true,
				json: async () => [],
			} as Response);

			await fetchMonthlyReports({
				period: "custom",
				startDate: "2024-01-01",
				endDate: "2024-12-31",
			});

			expect(fetch).toHaveBeenCalledWith(
				"/api/reports/monthly?period=custom&startDate=2024-01-01&endDate=2024-12-31",
			);
		});
	});

	describe("fetchCategoryBreakdown", () => {
		it("カテゴリ別内訳を正常に取得する", async () => {
			const mockData: CategoryBreakdown = {
				income: [
					{
						categoryId: "101",
						categoryName: "給与",
						total: 4800000,
						percentage: 80,
					},
					{
						categoryId: "102",
						categoryName: "ボーナス",
						total: 1200000,
						percentage: 20,
					},
				],
				expense: [
					{
						categoryId: "1",
						categoryName: "食費",
						total: 600000,
						percentage: 30,
					},
				],
			};

			vi.mocked(global.fetch).mockResolvedValueOnce({
				ok: true,
				json: async () => mockData,
			} as Response);

			const result = await fetchCategoryBreakdown({ period: "1year" });

			expect(fetch).toHaveBeenCalledWith(
				"/api/reports/categories?period=1year",
			);
			expect(result).toEqual(mockData);
		});
	});

	describe("exportReportAsCSV", () => {
		it("CSVファイルを正常にエクスポートする", async () => {
			const mockCsvData =
				"月,収入,支出,残高,貯蓄率\n2025-01,500000,300000,200000,40";
			const mockBlob = new Blob([mockCsvData], { type: "text/csv" });

			vi.mocked(global.fetch).mockResolvedValueOnce({
				ok: true,
				blob: async () => mockBlob,
			} as Response);

			const result = await exportReportAsCSV({ period: "3months" });

			expect(fetch).toHaveBeenCalledWith(
				"/api/reports/export?period=3months&format=csv",
			);
			expect(result).toBeInstanceOf(Blob);
			expect(result.type).toBe("text/csv");
		});

		it("エクスポートが失敗した場合、エラーを投げる", async () => {
			vi.mocked(global.fetch).mockResolvedValueOnce({
				ok: false,
				status: 500,
				statusText: "Export failed",
			} as Response);

			await expect(exportReportAsCSV({ period: "6months" })).rejects.toThrow(
				"Failed to export report",
			);
		});

		it("カスタム期間でのエクスポートリクエストを正しく送信する", async () => {
			const mockBlob = new Blob(["test"], { type: "text/csv" });

			vi.mocked(global.fetch).mockResolvedValueOnce({
				ok: true,
				blob: async () => mockBlob,
			} as Response);

			await exportReportAsCSV({
				period: "custom",
				startDate: "2024-06-01",
				endDate: "2024-12-31",
			});

			expect(fetch).toHaveBeenCalledWith(
				"/api/reports/export?period=custom&format=csv&startDate=2024-06-01&endDate=2024-12-31",
			);
		});
	});
});
