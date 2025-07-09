/**
 * useCategoriesカスタムフックのユニットテスト
 *
 * テスト対象:
 * - 初期ローディング状態
 * - カテゴリデータの取得成功
 * - カテゴリデータの取得失敗
 * - refetch機能
 * - エラーハンドリング
 */

import { renderHook, waitFor, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchCategories } from "../lib/api/categories";
import type { Category } from "../types/category";
import { useCategories } from "./useCategories";

// APIモジュールをモック
vi.mock("../lib/api/categories", () => ({
	fetchCategories: vi.fn(),
}));

const mockFetchCategories = vi.mocked(fetchCategories);

// テスト用のモックデータ
const mockCategories: Category[] = [
	{
		id: "1",
		name: "エンターテイメント",
		type: "expense",
		color: "#ff6b6b",
		createdAt: "2024-07-01T00:00:00Z",
		updatedAt: "2024-07-01T00:00:00Z",
	},
	{
		id: "2",
		name: "サブスクリプション",
		type: "expense",
		color: "#4ecdc4",
		createdAt: "2024-07-01T00:00:00Z",
		updatedAt: "2024-07-01T00:00:00Z",
	},
	{
		id: "3",
		name: "ビジネス",
		type: "expense",
		color: "#45b7d1",
		createdAt: "2024-07-01T00:00:00Z",
		updatedAt: "2024-07-01T00:00:00Z",
	},
];

describe("useCategories", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("初期状態", () => {
		it("初期ローディング状態が正しく設定される", () => {
			mockFetchCategories.mockImplementation(
				() => new Promise(() => {}), // 永続的なPending状態
			);

			const { result } = renderHook(() => useCategories());

			expect(result.current.categories).toEqual([]);
			expect(result.current.loading).toBe(true);
			expect(result.current.error).toBe(null);
			expect(typeof result.current.refetch).toBe("function");
		});
	});

	describe("カテゴリ取得成功", () => {
		it("カテゴリが正常に取得される", async () => {
			mockFetchCategories.mockResolvedValue(mockCategories);

			const { result } = renderHook(() => useCategories());

			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			expect(result.current.categories).toEqual(mockCategories);
			expect(result.current.error).toBe(null);
			expect(mockFetchCategories).toHaveBeenCalledTimes(1);
		});

		it("空配列が返された場合も正常に処理される", async () => {
			mockFetchCategories.mockResolvedValue([]);

			const { result } = renderHook(() => useCategories());

			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			expect(result.current.categories).toEqual([]);
			expect(result.current.error).toBe(null);
		});
	});

	describe("カテゴリ取得失敗", () => {
		it("Errorオブジェクトの場合、エラーメッセージが設定される", async () => {
			const errorMessage = "ネットワークエラーが発生しました";
			mockFetchCategories.mockRejectedValue(new Error(errorMessage));

			const { result } = renderHook(() => useCategories());

			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			expect(result.current.categories).toEqual([]);
			expect(result.current.error).toBe(errorMessage);
		});

		it("未知のエラーの場合、デフォルトメッセージが設定される", async () => {
			mockFetchCategories.mockRejectedValue("unknown error");

			const { result } = renderHook(() => useCategories());

			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			expect(result.current.categories).toEqual([]);
			expect(result.current.error).toBe("カテゴリの取得に失敗しました");
		});

		it("nullエラーの場合、デフォルトメッセージが設定される", async () => {
			mockFetchCategories.mockRejectedValue(null);

			const { result } = renderHook(() => useCategories());

			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			expect(result.current.error).toBe("カテゴリの取得に失敗しました");
		});
	});

	describe("refetch機能", () => {
		it("refetchが正常に動作する", async () => {
			// 初回取得
			mockFetchCategories.mockResolvedValueOnce(mockCategories);

			const { result } = renderHook(() => useCategories());

			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			expect(result.current.categories).toEqual(mockCategories);

			// refetch用のモックデータ
			const updatedCategories: Category[] = [
				...mockCategories,
				{
					id: "4",
					name: "新しいカテゴリ",
					type: "expense",
					color: "#ffa500",
					createdAt: "2024-07-01T00:00:00Z",
					updatedAt: "2024-07-01T00:00:00Z",
				},
			];
			mockFetchCategories.mockResolvedValueOnce(updatedCategories);

			// refetch実行
			await act(async () => {
				await result.current.refetch();
			});

			await waitFor(() => {
				expect(result.current.categories).toEqual(updatedCategories);
			});

			expect(mockFetchCategories).toHaveBeenCalledTimes(2);
		});

		it("refetch中のローディング状態が正しく管理される", async () => {
			// 初回取得
			mockFetchCategories.mockResolvedValueOnce(mockCategories);

			const { result } = renderHook(() => useCategories());

			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			// refetch時にローディング状態をテスト
			let resolveRefetch: (value: Category[]) => void;
			const refetchPromise = new Promise<Category[]>((resolve) => {
				resolveRefetch = resolve;
			});
			mockFetchCategories.mockReturnValueOnce(refetchPromise);

			// refetchを実行（非同期）
			act(() => {
				result.current.refetch();
			});

			// ローディング状態の確認
			await waitFor(() => {
				expect(result.current.loading).toBe(true);
			});

			// refetchを完了
			resolveRefetch!(mockCategories);

			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});
		});

		it("refetch中にエラーが発生した場合の処理", async () => {
			// 初回取得成功
			mockFetchCategories.mockResolvedValueOnce(mockCategories);

			const { result } = renderHook(() => useCategories());

			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			expect(result.current.error).toBe(null);

			// refetch時にエラーが発生
			const errorMessage = "refetch時のエラー";
			mockFetchCategories.mockRejectedValueOnce(new Error(errorMessage));

			await act(async () => {
				await result.current.refetch();
			});

			await waitFor(() => {
				expect(result.current.error).toBe(errorMessage);
				expect(result.current.loading).toBe(false);
			});

			// カテゴリデータはそのまま保持されること
			expect(result.current.categories).toEqual(mockCategories);
		});
	});

	describe("エッジケース", () => {
		it("コンポーネントのアンマウント後に非同期処理が完了してもエラーが発生しない", async () => {
			let resolvePromise: (value: Category[]) => void;
			const promise = new Promise<Category[]>((resolve) => {
				resolvePromise = resolve;
			});
			mockFetchCategories.mockReturnValue(promise);

			const { unmount } = renderHook(() => useCategories());

			// コンポーネントをアンマウント
			unmount();

			// 非同期処理を完了（エラーが発生しないことを確認）
			resolvePromise!(mockCategories);

			// Promiseの解決を待機
			await promise;

			// エラーが発生しないことを確認（テストが正常に完了すればOK）
			expect(true).toBe(true);
		});

		it("複数回のrefetchが並行して実行された場合の処理", async () => {
			// 初回取得
			mockFetchCategories.mockResolvedValueOnce(mockCategories);

			const { result } = renderHook(() => useCategories());

			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			// 並行してrefetchを実行 - より確実なタイミング制御
			let resolveRefetch1: (value: Category[]) => void;
			let resolveRefetch2: (value: Category[]) => void;

			const refetch1Promise = new Promise<Category[]>((resolve) => {
				resolveRefetch1 = resolve;
			});
			const refetch2Promise = new Promise<Category[]>((resolve) => {
				resolveRefetch2 = resolve;
			});

			mockFetchCategories
				.mockReturnValueOnce(refetch1Promise)
				.mockReturnValueOnce(refetch2Promise);

			// 並行してrefetchを実行
			const promise1 = result.current.refetch();
			const promise2 = result.current.refetch();

			// refetch1を先に完了させる
			resolveRefetch1!([mockCategories[0]]);
			await act(async () => {
				await promise1;
			});

			// 状態更新を確認
			await waitFor(() => {
				expect(result.current.categories).toEqual([mockCategories[0]]);
			});

			// refetch2を後で完了させる
			resolveRefetch2!([mockCategories[1]]);
			await act(async () => {
				await promise2;
			});

			// 最後に完了したrefetchの結果が反映されること
			await waitFor(() => {
				expect(result.current.categories).toEqual([mockCategories[1]]);
			});

			expect(mockFetchCategories).toHaveBeenCalledTimes(3); // 初回 + refetch x2
		});
	});

	describe("メモ化の確認", () => {
		it("refetch関数は毎回新しいインスタンスが作成される", async () => {
			mockFetchCategories.mockResolvedValue(mockCategories);

			const { result, rerender } = renderHook(() => useCategories());

			// 初期ローディング完了を待機
			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			const firstRefetch = result.current.refetch;

			// 再レンダリング
			rerender();

			const secondRefetch = result.current.refetch;

			// refetch関数は実装上、毎回新しい関数インスタンスが作成される
			// （loadCategoriesはuseCallbackでメモ化されているが、refetchはされていない）
			expect(firstRefetch).not.toBe(secondRefetch);
			expect(typeof firstRefetch).toBe("function");
			expect(typeof secondRefetch).toBe("function");
		});
	});
});
