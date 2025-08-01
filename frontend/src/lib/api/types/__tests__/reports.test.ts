import type {
	CategoryBreakdown,
	ExportFormat,
	MonthlyReport,
	ReportPeriod,
} from "../reports";

describe("Report Types", () => {
	describe("MonthlyReport", () => {
		it("必須フィールドを持つ型が正しく定義される", () => {
			const report: MonthlyReport = {
				month: "2025-01",
				income: 500000,
				expense: 300000,
				balance: 200000,
				savingsRate: 40,
				categories: [],
			};

			expect(report.month).toBe("2025-01");
			expect(report.income).toBe(500000);
			expect(report.expense).toBe(300000);
			expect(report.balance).toBe(200000);
			expect(report.savingsRate).toBe(40);
			expect(report.categories).toHaveLength(0);
		});

		it("カテゴリ内訳を含む型が正しく定義される", () => {
			const report: MonthlyReport = {
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
			};

			expect(report.categories).toHaveLength(2);
			expect(report.categories[0].type).toBe("income");
			expect(report.categories[1].type).toBe("expense");
		});
	});

	describe("CategoryBreakdown", () => {
		it("収入と支出のカテゴリ別内訳を持つ型が正しく定義される", () => {
			const breakdown: CategoryBreakdown = {
				income: [
					{
						categoryId: "101",
						categoryName: "給与",
						total: 4800000,
						percentage: 80,
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

			expect(breakdown.income).toHaveLength(1);
			expect(breakdown.expense).toHaveLength(1);
			expect(breakdown.income[0].percentage).toBe(80);
			expect(breakdown.expense[0].percentage).toBe(30);
		});
	});

	describe("ReportPeriod", () => {
		it("期間の型が正しく定義される", () => {
			const validPeriods: ReportPeriod[] = [
				"3months",
				"6months",
				"1year",
				"custom",
			];

			validPeriods.forEach((period) => {
				expect(["3months", "6months", "1year", "custom"]).toContain(period);
			});
		});
	});

	describe("ExportFormat", () => {
		it("エクスポート形式の型が正しく定義される", () => {
			const validFormats: ExportFormat[] = ["csv", "json"];

			validFormats.forEach((format) => {
				expect(["csv", "json"]).toContain(format);
			});
		});
	});
});
