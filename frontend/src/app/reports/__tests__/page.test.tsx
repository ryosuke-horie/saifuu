import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ReportsPage from "../page";

// モックデータの定義
const mockMonthlyReports = [
	{
		month: "2025-01",
		income: 500000,
		expense: 300000,
		balance: 200000,
		savingsRate: 40,
		categories: [
			{ categoryId: "1", categoryName: "食費", amount: 50000, type: "expense" },
			{
				categoryId: "101",
				categoryName: "給与",
				amount: 400000,
				type: "income",
			},
		],
	},
	{
		month: "2024-12",
		income: 450000,
		expense: 280000,
		balance: 170000,
		savingsRate: 37.8,
		categories: [
			{ categoryId: "1", categoryName: "食費", amount: 45000, type: "expense" },
			{
				categoryId: "101",
				categoryName: "給与",
				amount: 400000,
				type: "income",
			},
		],
	},
];

const mockCategoryBreakdown = {
	income: [
		{ categoryId: "101", categoryName: "給与", total: 4800000, percentage: 80 },
		{
			categoryId: "102",
			categoryName: "ボーナス",
			total: 1200000,
			percentage: 20,
		},
	],
	expense: [
		{ categoryId: "1", categoryName: "食費", total: 600000, percentage: 30 },
		{ categoryId: "2", categoryName: "交通費", total: 400000, percentage: 20 },
	],
};

// モック関数の定義
const mockExportCSV = vi.fn();

// 動的に変更可能なモックデータ
let mockUseMonthlyReportsReturn: {
	reports: typeof mockMonthlyReports;
	isLoading: boolean;
	error: Error | null;
} = {
	reports: mockMonthlyReports,
	isLoading: false,
	error: null,
};

let mockUseCategoryBreakdownReturn: {
	breakdown: typeof mockCategoryBreakdown;
	isLoading: boolean;
	error: Error | null;
} = {
	breakdown: mockCategoryBreakdown,
	isLoading: false,
	error: null,
};

// モックの設定
vi.mock("../../../lib/api/hooks/useReports", () => ({
	useMonthlyReports: () => mockUseMonthlyReportsReturn,
	useCategoryBreakdown: () => mockUseCategoryBreakdownReturn,
	useExportReport: () => ({
		exportCSV: mockExportCSV,
		isExporting: false,
		error: null,
	}),
}));

describe("ReportsPage", () => {
	beforeEach(() => {
		// 各テストの前にモックをリセット
		mockUseMonthlyReportsReturn = {
			reports: mockMonthlyReports,
			isLoading: false,
			error: null,
		};
		mockUseCategoryBreakdownReturn = {
			breakdown: mockCategoryBreakdown,
			isLoading: false,
			error: null,
		};
		mockExportCSV.mockClear();
	});

	it("ページタイトルが表示される", () => {
		render(<ReportsPage />);
		expect(screen.getByText("統合レポート")).toBeInTheDocument();
	});

	it("期間選択フィルターが表示される", () => {
		render(<ReportsPage />);
		expect(screen.getByLabelText("期間")).toBeInTheDocument();
		expect(screen.getByText("過去3ヶ月")).toBeInTheDocument();
		expect(screen.getByText("過去6ヶ月")).toBeInTheDocument();
		expect(screen.getByText("過去1年")).toBeInTheDocument();
	});

	it("収支サマリーカードが表示される", () => {
		render(<ReportsPage />);
		expect(screen.getByText("期間合計")).toBeInTheDocument();
		expect(screen.getByText("総収入")).toBeInTheDocument();
		expect(screen.getByText("総支出")).toBeInTheDocument();
		expect(screen.getByText("純利益")).toBeInTheDocument();
		expect(screen.getByText("平均貯蓄率")).toBeInTheDocument();
	});

	it("トレンドチャートが表示される", async () => {
		render(<ReportsPage />);
		await waitFor(() => {
			expect(screen.getByTestId("trend-chart")).toBeInTheDocument();
		});
	});

	it("カテゴリ別比較チャートが表示される", async () => {
		render(<ReportsPage />);
		await waitFor(() => {
			expect(
				screen.getByTestId("category-comparison-chart"),
			).toBeInTheDocument();
		});
	});

	it("貯蓄率推移チャートが表示される", async () => {
		render(<ReportsPage />);
		await waitFor(() => {
			expect(screen.getByTestId("savings-rate-chart")).toBeInTheDocument();
		});
	});

	it("CSVエクスポートボタンが表示される", () => {
		render(<ReportsPage />);
		const exportButton = screen.getByRole("button", {
			name: "CSVエクスポート",
		});
		expect(exportButton).toBeInTheDocument();
	});

	it("CSVエクスポートボタンをクリックするとファイルがダウンロードされる", async () => {
		const user = userEvent.setup();
		render(<ReportsPage />);

		const exportButton = screen.getByRole("button", {
			name: "CSVエクスポート",
		});
		await user.click(exportButton);

		// エクスポート関数が呼ばれたことを確認
		expect(mockExportCSV).toHaveBeenCalledWith({ period: "3months" });

		// トースト通知が表示されることを確認
		await waitFor(() => {
			expect(
				screen.getByText("レポートをダウンロードしました"),
			).toBeInTheDocument();
		});
	});

	it("ローディング状態が正しく表示される", () => {
		// ローディング状態に設定
		mockUseMonthlyReportsReturn = {
			reports: [],
			isLoading: true,
			error: null,
		};

		render(<ReportsPage />);
		expect(screen.getByText("読み込み中...")).toBeInTheDocument();
	});

	it("エラー状態が正しく表示される", () => {
		// エラー状態に設定
		mockUseMonthlyReportsReturn = {
			reports: [],
			isLoading: false,
			error: new Error("データの取得に失敗しました"),
		};

		render(<ReportsPage />);
		expect(screen.getByText("データの取得に失敗しました")).toBeInTheDocument();
	});
});
