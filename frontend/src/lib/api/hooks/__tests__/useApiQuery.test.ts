/**
 * useApiQuery汎用フックのユニットテスト
 */

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, handleApiError } from "../../errors";
import { useApiQuery } from "../useApiQuery";

// API エラーハンドリングをモック
vi.mock("../../errors", () => ({
	ApiError: class ApiError extends Error {
		constructor(
			public type: string,
			public message: string,
			public statusCode?: number,
			public details?: any,
		) {
			super(message);
		}
	},
	handleApiError: vi.fn(),
}));

const mockHandleApiError = vi.mocked(handleApiError);

// テスト用のモックデータ
interface TestData {
	id: string;
	name: string;
	value: number;
}

const mockData: TestData[] = [
	{ id: "1", name: "Test Item 1", value: 100 },
	{ id: "2", name: "Test Item 2", value: 200 },
];

const mockSingleData: TestData = { id: "1", name: "Single Item", value: 150 };

describe("useApiQuery", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("基本的なデータ取得", () => {
		it("API呼び出しが成功した場合、データが正しく設定される", async () => {
			const mockQueryFn = vi.fn().mockResolvedValue(mockData);
			const initialData: TestData[] = [];

			const { result } = renderHook(() =>
				useApiQuery({
					queryFn: mockQueryFn,
					initialData,
					errorContext: "テストデータ取得",
				}),
			);

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(result.current.data).toEqual(mockData);
			expect(result.current.error).toBe(null);
			expect(mockQueryFn).toHaveBeenCalledTimes(1);
		});
	});

	describe("エラーハンドリング", () => {
		it("API呼び出しが失敗した場合、エラーが設定される", async () => {
			const errorMessage = "API エラーが発生しました";
			const mockError = new Error("Network Error");
			const mockQueryFn = vi.fn().mockRejectedValue(mockError);

			mockHandleApiError.mockReturnValue(new ApiError("network", errorMessage));

			const { result } = renderHook(() =>
				useApiQuery({
					queryFn: mockQueryFn,
					initialData: [],
					errorContext: "テストデータ取得",
				}),
			);

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(result.current.error).toBe(errorMessage);
			expect(result.current.data).toEqual([]);
			expect(mockHandleApiError).toHaveBeenCalledWith(
				mockError,
				"テストデータ取得",
			);
		});
	});

	describe("refetch機能", () => {
		it("refetchが正常に動作する", async () => {
			const mockQueryFn = vi.fn().mockResolvedValueOnce(mockData);
			const initialData: TestData[] = [];

			const { result } = renderHook(() =>
				useApiQuery({
					queryFn: mockQueryFn,
					initialData,
					errorContext: "テストデータ取得",
				}),
			);

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(result.current.data).toEqual(mockData);

			// refetch用のモックデータ
			const updatedData = [mockSingleData];
			mockQueryFn.mockResolvedValueOnce(updatedData);

			// refetch実行
			await act(async () => {
				await result.current.refetch();
			});

			await waitFor(() => {
				expect(result.current.data).toEqual(updatedData);
			});

			expect(mockQueryFn).toHaveBeenCalledTimes(2);
		});
	});

	describe("shouldFetchオプション", () => {
		it("shouldFetchがfalseの場合、初期取得がスキップされる", async () => {
			const mockQueryFn = vi.fn().mockResolvedValue(mockData);
			const initialData: TestData[] = [];

			const { result } = renderHook(() =>
				useApiQuery({
					queryFn: mockQueryFn,
					initialData,
					errorContext: "テストデータ取得",
					shouldFetch: false,
				}),
			);

			// 少し待機してAPIが呼ばれないことを確認
			await new Promise((resolve) => setTimeout(resolve, 100));

			expect(mockQueryFn).not.toHaveBeenCalled();
			expect(result.current.isLoading).toBe(false);
			expect(result.current.data).toEqual(initialData);
		});
	});

	describe("型安全性", () => {
		it("ジェネリクス型が正しく推論される", async () => {
			const mockQueryFn = vi.fn().mockResolvedValue(mockSingleData);
			const initialData: TestData = {
				id: "",
				name: "",
				value: 0,
			};

			const { result } = renderHook(() =>
				useApiQuery({
					queryFn: mockQueryFn,
					initialData,
					errorContext: "単一データ取得",
				}),
			);

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			// TypeScriptの型チェックが正しく動作することを確認
			expect(result.current.data.id).toBe("1");
			expect(result.current.data.name).toBe("Single Item");
			expect(result.current.data.value).toBe(150);
		});
	});

	describe("deps依存関係", () => {
		it("deps配列の値が変更されると再フェッチが実行される", async () => {
			let queryParam = "initial";
			const mockQueryFn = vi
				.fn()
				.mockImplementation(() => Promise.resolve(`result-${queryParam}`));

			const { result, rerender } = renderHook(
				({ param }) => {
					queryParam = param;
					return useApiQuery({
						queryFn: mockQueryFn,
						initialData: "default",
						errorContext: "テスト",
						deps: [param],
					});
				},
				{
					initialProps: { param: "initial" },
				},
			);

			// 初回フェッチ
			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(result.current.data).toBe("result-initial");
			expect(mockQueryFn).toHaveBeenCalledTimes(1);

			// paramを変更
			rerender({ param: "updated" });

			await waitFor(() => {
				expect(result.current.data).toBe("result-updated");
			});

			expect(mockQueryFn).toHaveBeenCalledTimes(2);
		});
	});
});
