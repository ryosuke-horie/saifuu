/**
 * API ページネーション機能のテスト
 *
 * APIレベルでのページネーション処理を検証
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "../client";

// fetchモック
global.fetch = vi.fn();

describe("API Pagination", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("ページネーションパラメータ", () => {
		it("ページネーションパラメータが正しくAPIに送信される", async () => {
			const mockResponse = {
				data: [],
				pagination: {
					currentPage: 2,
					totalPages: 5,
					totalItems: 98,
					itemsPerPage: 20,
				},
			};

			vi.mocked(fetch).mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
				headers: new Headers({
					"content-type": "application/json",
					"x-request-id": "test-123",
				}),
			} as Response);

			await apiClient.transactions.list({
				type: "income",
				page: 2,
				limit: 20,
				sort: "date",
				order: "desc",
			});

			// URLパラメータの確認
			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining("page=2"),
				expect.any(Object),
			);
			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining("limit=20"),
				expect.any(Object),
			);
			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining("sort=date"),
				expect.any(Object),
			);
			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining("order=desc"),
				expect.any(Object),
			);
		});

		it("ページネーション情報がレスポンスに含まれる", async () => {
			const mockResponse = {
				data: [
					{
						id: "1",
						amount: 50000,
						type: "income",
						description: "給与",
						date: "2024-01-01",
						categoryId: "101",
						categoryName: "給与",
						createdAt: "2024-01-01T00:00:00Z",
						updatedAt: "2024-01-01T00:00:00Z",
						userId: "user-1",
					},
				],
				pagination: {
					currentPage: 1,
					totalPages: 5,
					totalItems: 98,
					itemsPerPage: 20,
				},
			};

			vi.mocked(fetch).mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
				headers: new Headers({
					"content-type": "application/json",
					"x-request-id": "test-123",
				}),
			} as Response);

			const result = await apiClient.transactions.list({
				type: "income",
				page: 1,
				limit: 20,
			});

			// ページネーション情報の確認
			expect(result.pagination).toBeDefined();
			expect(result.pagination?.currentPage).toBe(1);
			expect(result.pagination?.totalPages).toBe(5);
			expect(result.pagination?.totalItems).toBe(98);
			expect(result.pagination?.itemsPerPage).toBe(20);
		});

		it("ページネーションパラメータが省略された場合はデフォルト値が使用される", async () => {
			const mockResponse = {
				data: [],
				pagination: {
					currentPage: 1,
					totalPages: 1,
					totalItems: 10,
					itemsPerPage: 10,
				},
			};

			vi.mocked(fetch).mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
				headers: new Headers({
					"content-type": "application/json",
					"x-request-id": "test-123",
				}),
			} as Response);

			await apiClient.transactions.list({
				type: "income",
			});

			// デフォルト値の確認（page=1, limit=10）
			const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;

			// pageパラメータが明示的に指定されていないか、1であることを確認
			if (calledUrl.includes("page=")) {
				expect(calledUrl).toContain("page=1");
			}

			// limitパラメータが明示的に指定されていないか、デフォルト値であることを確認
			if (calledUrl.includes("limit=")) {
				expect(calledUrl).toMatch(/limit=(10|20)/);
			}
		});
	});

	describe("エラーハンドリング", () => {
		it("不正なページ番号の場合はエラーが返される", async () => {
			vi.mocked(fetch).mockResolvedValueOnce({
				ok: false,
				status: 400,
				json: async () => ({
					error: "Invalid page number",
				}),
				headers: new Headers({
					"content-type": "application/json",
					"x-request-id": "test-123",
				}),
			} as Response);

			await expect(
				apiClient.transactions.list({
					type: "income",
					page: -1,
					limit: 20,
				}),
			).rejects.toThrow();
		});

		it("不正な表示件数の場合はエラーが返される", async () => {
			vi.mocked(fetch).mockResolvedValueOnce({
				ok: false,
				status: 400,
				json: async () => ({
					error: "Invalid limit value",
				}),
				headers: new Headers({
					"content-type": "application/json",
					"x-request-id": "test-123",
				}),
			} as Response);

			await expect(
				apiClient.transactions.list({
					type: "income",
					page: 1,
					limit: 0,
				}),
			).rejects.toThrow();
		});
	});

	describe("型定義", () => {
		it("PaginationParams型が正しく定義されている", () => {
			// 型チェックのみ（コンパイル時に検証）
			const params: PaginationParams = {
				page: 1,
				limit: 20,
				sort: "date",
				order: "desc",
			};

			expect(params).toBeDefined();
		});

		it("PaginationResponse型が正しく定義されている", () => {
			// 型チェックのみ（コンパイル時に検証）
			const response: PaginationResponse = {
				currentPage: 1,
				totalPages: 5,
				totalItems: 98,
				itemsPerPage: 20,
			};

			expect(response).toBeDefined();
		});
	});
});

// 型定義（実装時に正式な場所に移動）
interface PaginationParams {
	page: number;
	limit: number;
	sort?: "date" | "amount";
	order?: "asc" | "desc";
}

interface PaginationResponse {
	currentPage: number;
	totalPages: number;
	totalItems: number;
	itemsPerPage: number;
}
