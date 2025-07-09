/**
 * useApiQuery汎用フックのユニットテスト
 *
 * テスト対象:
 * - 基本的なAPI呼び出しとデータ取得
 * - 初期データの設定
 * - ローディング状態の管理
 * - エラーハンドリング
 * - refetch機能
 * - shouldFetchオプション
 * - 型安全性の確保
 */

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../errors";
import { handleApiError } from "../../index";
import { useApiQuery } from "../useApiQuery";

// API エラーハンドリングをモック
vi.mock("../../index", () => ({
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
		it("初期データが正しく設定される", () => {
			const mockQueryFn = vi.fn().mockResolvedValue(mockData);
			const initialData: TestData[] = [];

			const { result } = renderHook(() =>
				useApiQuery({
					queryFn: mockQueryFn,
					initialData,
					errorContext: "テストデータ取得",
				}),
			);

			expect(result.current.data).toEqual(initialData);
			expect(result.current.isLoading).toBe(true);
			expect(result.current.error).toBe(null);
			expect(typeof result.current.refetch).toBe("function");
		});

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

		it("空のデータが返された場合も正常に処理される", async () => {
			const mockQueryFn = vi.fn().mockResolvedValue([]);
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

			expect(result.current.data).toEqual([]);
			expect(result.current.error).toBe(null);
		});
	});

	describe("ローディング状態の管理", () => {
		it("初期状態でローディングがtrueになる", () => {
			const mockQueryFn = vi.fn().mockImplementation(
				() => new Promise(() => {}), // 永続的なPending状態
			);
			const initialData: TestData[] = [];

			const { result } = renderHook(() =>
				useApiQuery({
					queryFn: mockQueryFn,
					initialData,
					errorContext: "テストデータ取得",
				}),
			);

			expect(result.current.isLoading).toBe(true);
			expect(result.current.data).toEqual(initialData);
			expect(result.current.error).toBe(null);
		});

		it("API呼び出し完了後にローディングがfalseになる", async () => {
			const mockQueryFn = vi.fn().mockResolvedValue(mockData);
			const initialData: TestData[] = [];

			const { result } = renderHook(() =>
				useApiQuery({
					queryFn: mockQueryFn,
					initialData,
					errorContext: "テストデータ取得",
				}),
			);

			expect(result.current.isLoading).toBe(true);

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(result.current.data).toEqual(mockData);
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

		it("エラー発生時もローディング状態が正しく解除される", async () => {
			const mockError = new Error("Test Error");
			const mockQueryFn = vi.fn().mockRejectedValue(mockError);

			mockHandleApiError.mockReturnValue(
				new ApiError("unknown", "エラーが発生しました"),
			);

			const { result } = renderHook(() =>
				useApiQuery({
					queryFn: mockQueryFn,
					initialData: [],
					errorContext: "テストデータ取得",
				}),
			);

			expect(result.current.isLoading).toBe(true);

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(result.current.error).toBe("エラーが発生しました");
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

		it("refetch中のローディング状態が管理される", async () => {
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

			// refetch用のPromiseを制御できるようにする
			let resolveRefetch: (value: TestData[]) => void;
			const refetchPromise = new Promise<TestData[]>((resolve) => {
				resolveRefetch = resolve;
			});
			mockQueryFn.mockReturnValue(refetchPromise);

			// refetch実行
			const refetchCall = result.current.refetch();

			// ローディング状態になることを確認
			await waitFor(() => {
				expect(result.current.isLoading).toBe(true);
			});

			// refetch完了
			resolveRefetch!([mockSingleData]);
			await act(async () => {
				await refetchCall;
			});

			// ローディング状態が解除されることを確認
			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(result.current.data).toEqual([mockSingleData]);
		});

		it("refetch中のエラーが正しく処理される", async () => {
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

			// refetch時にエラーが発生
			const refetchError = new Error("Refetch Error");
			mockQueryFn.mockRejectedValueOnce(refetchError);
			mockHandleApiError.mockReturnValue(
				new ApiError("unknown", "再取得エラー"),
			);

			await act(async () => {
				await result.current.refetch();
			});

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(result.current.error).toBe("再取得エラー");
			expect(result.current.data).toEqual(mockData); // 前回のデータは保持
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

		it("shouldFetchがtrueの場合、通常通り取得される", async () => {
			const mockQueryFn = vi.fn().mockResolvedValue(mockData);
			const initialData: TestData[] = [];

			const { result } = renderHook(() =>
				useApiQuery({
					queryFn: mockQueryFn,
					initialData,
					errorContext: "テストデータ取得",
					shouldFetch: true,
				}),
			);

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(mockQueryFn).toHaveBeenCalledTimes(1);
			expect(result.current.data).toEqual(mockData);
		});

		it("shouldFetchが未指定の場合、デフォルトで取得される", async () => {
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

			expect(mockQueryFn).toHaveBeenCalledTimes(1);
			expect(result.current.data).toEqual(mockData);
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

	describe("エッジケース", () => {
		it("複数のrefetchを連続実行した場合", async () => {
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

			// 連続でrefetchを実行
			const refetch1 = result.current.refetch();
			const refetch2 = result.current.refetch();

			await act(async () => {
				await Promise.all([refetch1, refetch2]);
			});

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(result.current.data).toEqual(mockData);
			// 初回 + refetch2回 = 3回の呼び出し
			expect(mockQueryFn).toHaveBeenCalledTimes(3);
		});

		it("queryFnが変更された場合、自動で再取得される", async () => {
			const mockQueryFn1 = vi.fn().mockResolvedValue(mockData);
			const mockQueryFn2 = vi.fn().mockResolvedValue([mockSingleData]);
			const initialData: TestData[] = [];

			const { result, rerender } = renderHook(
				({ queryFn }) =>
					useApiQuery({
						queryFn,
						initialData,
						errorContext: "テストデータ取得",
					}),
				{
					initialProps: { queryFn: mockQueryFn1 },
				},
			);

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(result.current.data).toEqual(mockData);
			expect(mockQueryFn1).toHaveBeenCalledTimes(1);

			// queryFnを変更
			rerender({ queryFn: mockQueryFn2 });

			await waitFor(() => {
				expect(result.current.data).toEqual([mockSingleData]);
			});

			expect(mockQueryFn2).toHaveBeenCalledTimes(1);
		});
	});
});
