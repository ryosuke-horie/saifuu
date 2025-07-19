/**
 * useCategoriesフックのテスト（最適化版）
 *
 * 基本機能に焦点を当てた簡素化版
 */
import { renderHook, waitFor } from "@testing-library/react";
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

// APIクライアントのモック
vi.mock("../lib/api/client", () => ({
	apiClient: {
		get: vi.fn(),
	},
}));

import { apiClient } from "../lib/api/client";

describe("useCategories", () => {
	const mockCategories: Category[] = [
		{
			id: "1",
			name: "食費",
			type: "expense" as const,
			color: "#ff0000",
			createdAt: "2025-01-01T00:00:00Z",
			updatedAt: "2025-01-01T00:00:00Z",
		},
		{
			id: "2",
			name: "交通費",
			type: "expense" as const,
			color: "#00ff00",
			createdAt: "2025-01-01T00:00:00Z",
			updatedAt: "2025-01-01T00:00:00Z",
		},
	];

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("基本動作とエラーハンドリング", () => {
		it("初期状態、データ取得、エラー処理が正しく動作する", async () => {
			const mockGet = apiClient.get as Mock;

			// 初回: 成功
			mockGet.mockResolvedValueOnce(mockCategories);
			const { result, rerender } = renderHook(() => useCategories());

			// 初期状態の確認
			expect(result.current.categories).toEqual([]);
			expect(result.current.loading).toBe(true);
			expect(result.current.error).toBeNull();

			// データ取得成功後
			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			expect(result.current.categories).toEqual(mockCategories);
			expect(result.current.error).toBeNull();
			expect(mockGet).toHaveBeenCalledWith("/categories");

			// エラーケースをテスト
			const mockError = new Error("Network Error");
			mockGet.mockRejectedValueOnce(mockError);

			// コンポーネントを再マウント
			rerender();
			const newHook = renderHook(() => useCategories());

			await waitFor(() => {
				expect(newHook.result.current.loading).toBe(false);
			});

			expect(newHook.result.current.error).toBe("Network Error");
			expect(newHook.result.current.categories).toEqual([]);
		});
	});

	describe("refetch機能", () => {
		it("手動でデータを再取得できる", async () => {
			const mockGet = apiClient.get as Mock;

			// 初回取得
			mockGet.mockResolvedValueOnce(mockCategories);
			const { result } = renderHook(() => useCategories());

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
			mockGet.mockResolvedValueOnce(updatedCategories);

			await result.current.refetch();

			await waitFor(() => {
				expect(result.current.categories).toEqual(updatedCategories);
			});

			expect(mockGet).toHaveBeenCalledTimes(2);
		});
	});
});
