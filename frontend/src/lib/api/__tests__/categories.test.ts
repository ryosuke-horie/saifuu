/**
 * Categories API のテスト
 *
 * Issue #53 修正対応:
 * - APIレスポンス形式変更（オブジェクト→配列）の検証
 * - fetchCategories(), fetchCategoryById() の動作確認
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Category } from "../../../types/category";
import { fetchCategories, fetchCategoryById } from "../categories/api";
import type { ApiCategoryResponse } from "../categories/types";
import { apiClient } from "../client";

// apiClientをモック化
vi.mock("../client", () => ({
	apiClient: {
		get: vi.fn(),
	},
}));

describe("Categories API", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("fetchCategories", () => {
		it("should fetch categories successfully with array response format", async () => {
			// 今回の修正: APIが配列を直接返すケース
			const mockApiResponse: ApiCategoryResponse[] = [
				{
					id: 1,
					name: "エンターテイメント",
					createdAt: "2025-07-05T07:06:39Z",
					updatedAt: "2025-07-05T07:06:39Z",
				},
				{
					id: 2,
					name: "仕事・ビジネス",
					createdAt: "2025-07-05T07:06:39Z",
					updatedAt: "2025-07-05T07:06:39Z",
				},
			];

			const mockGet = vi.mocked(apiClient.get);
			mockGet.mockResolvedValueOnce(mockApiResponse);

			const result = await fetchCategories();

			expect(mockGet).toHaveBeenCalledWith("/categories");
			expect(result).toHaveLength(2);
			expect(result[0]).toEqual({
				id: "1", // number -> string変換を確認
				name: "エンターテイメント",
				type: "expense", // デフォルト値設定を確認
				color: null, // デフォルト値設定を確認
				createdAt: "2025-07-05T07:06:39Z",
				updatedAt: "2025-07-05T07:06:39Z",
			});
		});

		it("should handle empty categories array", async () => {
			// 空配列レスポンスのテスト
			const mockGet = vi.mocked(apiClient.get);
			mockGet.mockResolvedValueOnce([]);

			const result = await fetchCategories();

			expect(mockGet).toHaveBeenCalledWith("/categories");
			expect(result).toEqual([]);
		});

		it("should handle API client errors", async () => {
			// API エラー時のテスト
			const mockGet = vi.mocked(apiClient.get);
			mockGet.mockRejectedValueOnce(new Error("Network Error"));

			await expect(fetchCategories()).rejects.toThrow(
				"カテゴリ一覧の取得に失敗しました",
			);
			expect(mockGet).toHaveBeenCalledWith("/categories");
		});

		it("should handle server errors gracefully", async () => {
			// サーバーエラー時の適切な例外処理
			const mockGet = vi.mocked(apiClient.get);
			mockGet.mockRejectedValueOnce(new Error("Server Error"));

			await expect(fetchCategories()).rejects.toThrow(
				"カテゴリ一覧の取得に失敗しました",
			);
		});
	});

	describe("fetchCategoryById", () => {
		it("should fetch single category by id", async () => {
			const mockApiResponse: ApiCategoryResponse = {
				id: 1,
				name: "エンターテイメント",
				createdAt: "2025-07-05T07:06:39Z",
				updatedAt: "2025-07-05T07:06:39Z",
			};

			const mockGet = vi.mocked(apiClient.get);
			mockGet.mockResolvedValueOnce(mockApiResponse);

			const result = await fetchCategoryById("1");

			expect(mockGet).toHaveBeenCalledWith("/categories/1");
			expect(result).toEqual({
				id: "1",
				name: "エンターテイメント",
				type: "expense",
				color: null,
				createdAt: "2025-07-05T07:06:39Z",
				updatedAt: "2025-07-05T07:06:39Z",
			});
		});

		it("should handle fetchCategoryById errors", async () => {
			const mockGet = vi.mocked(apiClient.get);
			mockGet.mockRejectedValueOnce(new Error("Not Found"));

			await expect(fetchCategoryById("999")).rejects.toThrow(
				"カテゴリ詳細の取得に失敗しました",
			);
			expect(mockGet).toHaveBeenCalledWith("/categories/999");
		});
	});

	describe("API Response Format Validation", () => {
		it("should handle array response format correctly (Issue #53 fix)", async () => {
			// 今回の修正の核心: 配列レスポンス形式の正しい処理
			const mockArrayResponse: ApiCategoryResponse[] = [
				{
					id: 1,
					name: "カテゴリ1",
					createdAt: "2025-01-01",
					updatedAt: "2025-01-01",
				},
				{
					id: 2,
					name: "カテゴリ2",
					createdAt: "2025-01-01",
					updatedAt: "2025-01-01",
				},
			];

			const mockGet = vi.mocked(apiClient.get);
			mockGet.mockResolvedValueOnce(mockArrayResponse);

			const result = await fetchCategories();

			// 配列が正しく処理されることを確認
			expect(Array.isArray(result)).toBe(true);
			expect(result).toHaveLength(2);

			// 各要素が正しく変換されることを確認
			result.forEach((category: Category, index: number) => {
				expect(category.id).toBe(mockArrayResponse[index].id.toString());
				expect(category.name).toBe(mockArrayResponse[index].name);
				expect(category.type).toBe("expense"); // デフォルト値
				expect(category.color).toBe(null); // デフォルト値
			});
		});

		it("should handle malformed API response", async () => {
			const mockGet = vi.mocked(apiClient.get);
			// 不正な形式のレスポンス
			mockGet.mockResolvedValueOnce(null as any);

			await expect(fetchCategories()).rejects.toThrow();
		});
	});
});
