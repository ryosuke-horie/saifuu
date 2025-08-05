/**
 * useCategoriesフックのテスト（React Query版）
 *
 * TDDサイクルに従って実装
 * 既存のインターフェースを維持しながらReact Queryに移行
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	type Mock,
	vi,
} from "vitest";
import type { Category } from "../lib/api/types";
import { useCategories } from "./useCategories";

// API関数のモック
vi.mock("../lib/api/services/categories", () => ({
	categoryService: {
		getCategories: vi.fn(),
	},
}));

import { categoryService } from "../lib/api/services/categories";

describe("useCategories（React Query版）", () => {
	let queryClient: QueryClient;
	const mockCategories: Category[] = [
		{
			id: "1",
			name: "食費",
			type: "expense",
			color: "#ff0000",
			createdAt: "2025-01-01T00:00:00Z",
			updatedAt: "2025-01-01T00:00:00Z",
		},
		{
			id: "2",
			name: "交通費",
			type: "expense",
			color: "#00ff00",
			createdAt: "2025-01-01T00:00:00Z",
			updatedAt: "2025-01-01T00:00:00Z",
		},
	];

	// React Query用のラッパーコンポーネント
	const createWrapper = () => {
		return ({ children }: { children: ReactNode }) => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		);
	};

	beforeEach(() => {
		// 各テスト前に新しいQueryClientインスタンスを作成
		queryClient = new QueryClient({
			defaultOptions: {
				queries: {
					// テスト中は再試行を無効化
					retry: false,
					// キャッシュを無効化してテストの独立性を保つ
					gcTime: 0,
					staleTime: 0,
				},
			},
		});
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
		queryClient.clear();
	});

	describe("基本動作", () => {
		it("初期状態でローディング中、データ取得後にカテゴリ一覧を返す", async () => {
			const mockGetCategories = categoryService.getCategories as Mock;
			mockGetCategories.mockResolvedValueOnce(mockCategories);

			const { result } = renderHook(() => useCategories(), {
				wrapper: createWrapper(),
			});

			// 初期状態の確認
			expect(result.current.loading).toBe(true);
			expect(result.current.categories).toEqual([]);
			expect(result.current.error).toBeNull();

			// データ取得成功後
			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			expect(result.current.categories).toEqual(mockCategories);
			expect(result.current.error).toBeNull();
			expect(mockGetCategories).toHaveBeenCalledTimes(1);
		});

		it("エラー発生時にエラーメッセージを返す", async () => {
			const mockGetCategories = categoryService.getCategories as Mock;
			const mockError = new Error("Network Error");
			mockGetCategories.mockRejectedValue(mockError);

			const { result } = renderHook(() => useCategories(), {
				wrapper: createWrapper(),
			});

			// エラー発生後の状態確認
			// React Queryは非同期でエラーを処理するため、エラーが設定されるまで待つ
			await waitFor(
				() => {
					expect(result.current.error).not.toBeNull();
				},
				{ timeout: 3000 },
			);

			// 最終的な状態を確認
			expect(result.current.loading).toBe(false);
			// エラーメッセージが正しく設定されているか確認
			expect(result.current.error).toContain(
				"ネットワークエラーが発生しました",
			);
			expect(result.current.categories).toEqual([]);
		});
	});

	describe("refetch機能", () => {
		it("手動でデータを再取得できる", async () => {
			const mockGetCategories = categoryService.getCategories as Mock;

			// 初回取得
			mockGetCategories.mockResolvedValueOnce(mockCategories);
			const { result } = renderHook(() => useCategories(), {
				wrapper: createWrapper(),
			});

			await waitFor(() => {
				expect(result.current.categories).toEqual(mockCategories);
			});

			// 新しいデータで再取得
			const updatedCategories = [
				...mockCategories,
				{
					id: "3",
					name: "娯楽費",
					type: "expense" as const,
					color: "#0000ff",
					createdAt: "2025-01-01T00:00:00Z",
					updatedAt: "2025-01-01T00:00:00Z",
				},
			];
			mockGetCategories.mockResolvedValueOnce(updatedCategories);

			// refetchを実行
			await act(async () => {
				await result.current.refetch();
			});

			await waitFor(() => {
				expect(result.current.categories).toEqual(updatedCategories);
			});

			expect(mockGetCategories).toHaveBeenCalledTimes(2);
		});

		it("refetch中にローディング状態になる", async () => {
			const mockGetCategories = categoryService.getCategories as Mock;
			mockGetCategories.mockResolvedValueOnce(mockCategories);

			const { result } = renderHook(() => useCategories(), {
				wrapper: createWrapper(),
			});

			// 初回ロード完了を待つ
			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			// 遅延のあるPromiseを設定
			let resolvePromise: (value: Category[]) => void;
			const delayedPromise = new Promise<Category[]>((resolve) => {
				resolvePromise = resolve;
			});
			mockGetCategories.mockReturnValueOnce(delayedPromise);

			// refetchを開始
			act(() => {
				result.current.refetch();
			});

			// refetch中はloadingがtrueになることを確認
			await waitFor(() => {
				expect(result.current.loading).toBe(true);
			});

			// Promiseを解決
			act(() => {
				resolvePromise!(mockCategories);
			});

			// refetch完了を待つ
			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			expect(mockGetCategories).toHaveBeenCalledTimes(2);
		});
	});

	describe("インターフェースの互換性", () => {
		it("既存のインターフェースと同じプロパティを返す", async () => {
			const mockGetCategories = categoryService.getCategories as Mock;
			mockGetCategories.mockResolvedValueOnce(mockCategories);

			const { result } = renderHook(() => useCategories(), {
				wrapper: createWrapper(),
			});

			// 返り値の型が既存のインターフェースと一致することを確認
			expect(result.current).toHaveProperty("categories");
			expect(result.current).toHaveProperty("loading");
			expect(result.current).toHaveProperty("error");
			expect(result.current).toHaveProperty("refetch");

			// refetchが関数であることを確認
			expect(typeof result.current.refetch).toBe("function");
		});
	});
});
