import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";
import * as reportApi from "../../services/reports";
import {
	useCategoryBreakdown,
	useExportReport,
	useMonthlyReports,
} from "../useReports";

vi.mock("../../services/reports");

const createWrapper = () => {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
		},
	});

	return ({ children }: { children: ReactNode }) =>
		createElement(QueryClientProvider, { client: queryClient }, children);
};

describe("useMonthlyReports", () => {
	it("月別レポートデータを取得する", async () => {
		const mockData = [
			{
				month: "2025-01",
				income: 500000,
				expense: 300000,
				balance: 200000,
				savingsRate: 40,
				categories: [],
			},
		];

		vi.mocked(reportApi.fetchMonthlyReports).mockResolvedValue(mockData);

		const { result } = renderHook(
			() => useMonthlyReports({ period: "3months" }),
			{ wrapper: createWrapper() },
		);

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.reports).toEqual(mockData);
		expect(reportApi.fetchMonthlyReports).toHaveBeenCalledWith({
			period: "3months",
		});
	});

	it("エラーが発生した場合、エラー状態を返す", async () => {
		const mockError = new Error("Failed to fetch");
		vi.mocked(reportApi.fetchMonthlyReports).mockRejectedValue(mockError);

		const { result } = renderHook(
			() => useMonthlyReports({ period: "3months" }),
			{ wrapper: createWrapper() },
		);

		await waitFor(() => {
			expect(result.current.error).toBeTruthy();
		});

		expect(result.current.reports).toEqual([]);
	});

	it("空データの場合、空配列を返す", async () => {
		vi.mocked(reportApi.fetchMonthlyReports).mockResolvedValue([]);

		const { result } = renderHook(
			() => useMonthlyReports({ period: "3months" }),
			{ wrapper: createWrapper() },
		);

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.reports).toEqual([]);
		expect(result.current.error).toBeNull();
	});

	it("ネットワークエラーの場合、適切にハンドリングする", async () => {
		const networkError = new Error("Network error");
		networkError.name = "NetworkError";
		vi.mocked(reportApi.fetchMonthlyReports).mockRejectedValue(networkError);

		const { result } = renderHook(
			() => useMonthlyReports({ period: "3months" }),
			{ wrapper: createWrapper() },
		);

		await waitFor(() => {
			expect(result.current.error).toBeTruthy();
			expect(result.current.error?.message).toBe("Network error");
		});
	});
});

describe("useCategoryBreakdown", () => {
	it("カテゴリ別内訳データを取得する", async () => {
		const mockData = {
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

		vi.mocked(reportApi.fetchCategoryBreakdown).mockResolvedValue(mockData);

		const { result } = renderHook(
			() => useCategoryBreakdown({ period: "6months" }),
			{ wrapper: createWrapper() },
		);

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.breakdown).toEqual(mockData);
		expect(reportApi.fetchCategoryBreakdown).toHaveBeenCalledWith({
			period: "6months",
		});
	});
});

describe("useExportReport", () => {
	it("CSVエクスポート機能を提供する", async () => {
		const mockBlob = new Blob(["test,data"], { type: "text/csv" });
		vi.mocked(reportApi.exportReportAsCSV).mockResolvedValue(mockBlob);

		// URLオブジェクトのモック
		const mockUrl = "blob:http://localhost/test";
		global.URL.createObjectURL = vi.fn(() => mockUrl);
		global.URL.revokeObjectURL = vi.fn();

		// ダウンロードリンクのモック
		const mockLink = document.createElement("a");
		mockLink.click = vi.fn();
		vi.spyOn(document, "createElement").mockReturnValue(mockLink);
		vi.spyOn(document.body, "appendChild").mockImplementation(() => mockLink);
		vi.spyOn(document.body, "removeChild").mockImplementation(() => mockLink);

		const { result } = renderHook(() => useExportReport(), {
			wrapper: createWrapper(),
		});

		// エクスポート実行
		await act(async () => {
			await result.current.exportCSV({ period: "1year" });
		});

		await waitFor(() => {
			expect(result.current.isExporting).toBe(false);
		});

		expect(reportApi.exportReportAsCSV).toHaveBeenCalledWith({
			period: "1year",
		});
		expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
		expect(global.URL.revokeObjectURL).toHaveBeenCalled();

		// 元の関数を復元
		vi.restoreAllMocks();
	});

	it("エクスポート中にエラーが発生した場合、エラーを返す", async () => {
		const mockError = new Error("Export failed");
		vi.mocked(reportApi.exportReportAsCSV).mockRejectedValue(mockError);

		const { result } = renderHook(() => useExportReport(), {
			wrapper: createWrapper(),
		});

		await act(async () => {
			await result.current.exportCSV({ period: "3months" });
		});

		await waitFor(() => {
			expect(result.current.error).toBeTruthy();
		});

		expect(result.current.isExporting).toBe(false);
	});

	it("URL.revokeObjectURLが必ず呼ばれることを確認", async () => {
		const mockBlob = new Blob(["test,data"], { type: "text/csv" });
		vi.mocked(reportApi.exportReportAsCSV).mockResolvedValue(mockBlob);

		// URLオブジェクトのモック
		const mockUrl = "blob:http://localhost/test";
		global.URL.createObjectURL = vi.fn(() => mockUrl);
		global.URL.revokeObjectURL = vi.fn();

		// ダウンロードリンクのモック（エラーをシミュレート）
		const mockLink = document.createElement("a");
		mockLink.click = vi.fn(() => {
			throw new Error("Click failed");
		});
		vi.spyOn(document, "createElement").mockReturnValue(mockLink);
		vi.spyOn(document.body, "appendChild").mockImplementation(() => mockLink);
		vi.spyOn(document.body, "removeChild").mockImplementation(() => mockLink);

		const { result } = renderHook(() => useExportReport(), {
			wrapper: createWrapper(),
		});

		// エクスポート実行（エラーが発生）
		await act(async () => {
			await result.current.exportCSV({ period: "1year" });
		});

		await waitFor(() => {
			expect(result.current.error).toBeTruthy();
		});

		// エラーが発生してもrevokeObjectURLが呼ばれることを確認
		expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(mockUrl);

		// 元の関数を復元
		vi.restoreAllMocks();
	});

	it("無効なレスポンス形式の場合、エラーをハンドリングする", async () => {
		// Blobではない無効なレスポンスをシミュレート
		vi.mocked(reportApi.exportReportAsCSV).mockResolvedValue(null as any);

		const { result } = renderHook(() => useExportReport(), {
			wrapper: createWrapper(),
		});

		await act(async () => {
			await result.current.exportCSV({ period: "3months" });
		});

		await waitFor(() => {
			expect(result.current.error).toBeTruthy();
		});

		expect(result.current.isExporting).toBe(false);
	});
});
