import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import * as reportApi from "../../services/reports";
import {
	useCategoryBreakdown,
	useExportReport,
	useMonthlyReports,
} from "../useReports";

// React Query関連をモック
vi.mock("@tanstack/react-query", async () => {
	const actual = await vi.importActual("@tanstack/react-query");
	return {
		...actual,
		useQuery: vi.fn(),
		useMutation: vi.fn(),
		useQueryClient: vi.fn(() => ({
			invalidateQueries: vi.fn(),
			setQueryData: vi.fn(),
			getQueryData: vi.fn(),
		})),
	};
});

vi.mock("../../services/reports");

// 各テストの前後でモックをクリア
beforeEach(() => {
	vi.clearAllMocks();
});

afterEach(() => {
	vi.restoreAllMocks();
});

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

		// useQueryをモック
		const { useQuery } = await import("@tanstack/react-query");
		vi.mocked(useQuery).mockReturnValue({
			data: mockData,
			error: null,
			isLoading: false,
			isError: false,
			isSuccess: true,
			refetch: vi.fn(),
		} as any);

		vi.mocked(reportApi.fetchMonthlyReports).mockResolvedValue(mockData);

		const { result } = renderHook(() => useMonthlyReports({ period: "3months" }));

		expect(result.current.isLoading).toBe(false);
		expect(result.current.reports).toEqual(mockData);
	});

	it("エラーが発生した場合、エラー状態を返す", async () => {
		const mockError = new Error("Failed to fetch");
		vi.mocked(reportApi.fetchMonthlyReports).mockRejectedValue(mockError);

		// useQueryをモック
		const { useQuery } = await import("@tanstack/react-query");
		vi.mocked(useQuery).mockReturnValue({
			data: null,
			error: mockError,
			isLoading: false,
			isError: true,
			isSuccess: false,
			refetch: vi.fn(),
		} as any);

		const { result } = renderHook(() => useMonthlyReports({ period: "3months" }));

		expect(result.current.error).toBeTruthy();
		expect(result.current.reports).toEqual([]);
	});

	it("空データの場合、空配列を返す", async () => {
		vi.mocked(reportApi.fetchMonthlyReports).mockResolvedValue([]);

		// useQueryをモック
		const { useQuery } = await import("@tanstack/react-query");
		vi.mocked(useQuery).mockReturnValue({
			data: [],
			error: null,
			isLoading: false,
			isError: false,
			isSuccess: true,
			refetch: vi.fn(),
		} as any);

		const { result } = renderHook(() => useMonthlyReports({ period: "3months" }));

		expect(result.current.isLoading).toBe(false);
		expect(result.current.reports).toEqual([]);
		expect(result.current.error).toBeNull();
	});

	it("ネットワークエラーの場合、適切にハンドリングする", async () => {
		const networkError = new Error("Network error");
		networkError.name = "NetworkError";
		vi.mocked(reportApi.fetchMonthlyReports).mockRejectedValue(networkError);

		// useQueryをモック
		const { useQuery } = await import("@tanstack/react-query");
		vi.mocked(useQuery).mockReturnValue({
			data: null,
			error: networkError,
			isLoading: false,
			isError: true,
			isSuccess: false,
			refetch: vi.fn(),
		} as any);

		const { result } = renderHook(() => useMonthlyReports({ period: "3months" }));

		expect(result.current.error).toBeTruthy();
		expect(result.current.error?.message).toBe("Network error");
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

		// useQueryをモック
		const { useQuery } = await import("@tanstack/react-query");
		vi.mocked(useQuery).mockReturnValue({
			data: mockData,
			error: null,
			isLoading: false,
			isError: false,
			isSuccess: true,
			refetch: vi.fn(),
		} as any);

		const { result } = renderHook(() => useCategoryBreakdown({ period: "6months" }));

		expect(result.current.isLoading).toBe(false);
		expect(result.current.breakdown).toEqual(mockData);
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

		// useMutationをモック
		const { useMutation } = await import("@tanstack/react-query");
		const mockMutateAsync = vi.fn().mockResolvedValue(mockBlob);
		vi.mocked(useMutation).mockReturnValue({
			mutate: vi.fn(),
			mutateAsync: mockMutateAsync,
			isLoading: false,
			isError: false,
			isSuccess: false,
			error: null,
			data: null,
			reset: vi.fn(),
		} as any);

		const { result } = renderHook(() => useExportReport());

		// エクスポート実行
		await act(async () => {
			await result.current.exportCSV({ period: "1year" });
		});

		expect(result.current.isExporting).toBe(false);
		expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
		expect(global.URL.revokeObjectURL).toHaveBeenCalled();

		// 元の関数を復元
		vi.restoreAllMocks();
	});

	it("エクスポート中にエラーが発生した場合、エラーを返す", async () => {
		const mockError = new Error("Export failed");
		vi.mocked(reportApi.exportReportAsCSV).mockRejectedValue(mockError);

		// useMutationをモック（エラーケース）
		const { useMutation } = await import("@tanstack/react-query");
		const mockMutateAsync = vi.fn().mockRejectedValue(mockError);
		vi.mocked(useMutation).mockReturnValue({
			mutate: vi.fn(),
			mutateAsync: mockMutateAsync,
			isLoading: false,
			isError: true,
			isSuccess: false,
			error: mockError,
			data: null,
			reset: vi.fn(),
		} as any);

		const { result } = renderHook(() => useExportReport());

		await act(async () => {
			try {
				await result.current.exportCSV({ period: "3months" });
			} catch (error) {
				// エラーを無視（テスト目的）
			}
		});

		expect(result.current.error).toBeTruthy();
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

		// useMutationをモック
		const { useMutation } = await import("@tanstack/react-query");
		const mockMutateAsync = vi.fn().mockResolvedValue(mockBlob);
		vi.mocked(useMutation).mockReturnValue({
			mutate: vi.fn(),
			mutateAsync: mockMutateAsync,
			isLoading: false,
			isError: false,
			isSuccess: false,
			error: null,
			data: null,
			reset: vi.fn(),
		} as any);

		const { result } = renderHook(() => useExportReport());

		// エクスポート実行（エラーが発生）
		await act(async () => {
			try {
				await result.current.exportCSV({ period: "1year" });
			} catch (error) {
				// エラーを無視
			}
		});

		// エラーが発生してもrevokeObjectURLが呼ばれることを確認
		expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(mockUrl);

		// 元の関数を復元
		vi.restoreAllMocks();
	});

	it("無効なレスポンス形式の場合、エラーをハンドリングする", async () => {
		// Blobではない無効なレスポンスをシミュレート
		const mockError = new Error("Invalid response format");
		vi.mocked(reportApi.exportReportAsCSV).mockResolvedValue(null as any);

		// useMutationをモック（無効レスポンスケース）
		const { useMutation } = await import("@tanstack/react-query");
		const mockMutateAsync = vi.fn().mockRejectedValue(mockError);
		vi.mocked(useMutation).mockReturnValue({
			mutate: vi.fn(),
			mutateAsync: mockMutateAsync,
			isLoading: false,
			isError: true,
			isSuccess: false,
			error: mockError,
			data: null,
			reset: vi.fn(),
		} as any);

		const { result } = renderHook(() => useExportReport());

		await act(async () => {
			try {
				await result.current.exportCSV({ period: "3months" });
			} catch (error) {
				// エラーを無視
			}
		});

		expect(result.current.error).toBeTruthy();
		expect(result.current.isExporting).toBe(false);
	});
});
