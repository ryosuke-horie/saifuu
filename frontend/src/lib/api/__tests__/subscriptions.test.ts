/**
 * Subscriptions API のテスト
 *
 * Issue #53 修正対応:
 * - APIレスポンス形式変更（オブジェクト→配列）の検証
 * - fetchSubscriptions() の動作確認とカテゴリ連携テスト
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "../client";
import {
	createSubscription,
	deleteSubscription,
	fetchSubscriptionById,
	fetchSubscriptions,
	updateSubscription,
	updateSubscriptionStatus,
} from "../subscriptions/api";
import type { ApiSubscriptionResponse } from "../subscriptions/types";
import type { Category, SubscriptionFormData } from "../types";

// apiClientをモック化
vi.mock("../client", () => ({
	apiClient: {
		get: vi.fn(),
		post: vi.fn(),
		put: vi.fn(),
		delete: vi.fn(),
	},
}));

describe("Subscriptions API", () => {
	const mockCategories: Category[] = [
		{
			id: "1",
			name: "エンターテイメント",
			type: "expense",
			color: "#FF6B6B",
			createdAt: "2025-07-05T07:06:39Z",
			updatedAt: "2025-07-05T07:06:39Z",
		},
		{
			id: "2",
			name: "仕事・ビジネス",
			type: "expense",
			color: "#4ECDC4",
			createdAt: "2025-07-05T07:06:39Z",
			updatedAt: "2025-07-05T07:06:39Z",
		},
	];

	// 共通のモックレスポンスを定義
	const createMockSubscription = (
		overrides: Partial<ApiSubscriptionResponse> = {},
	): ApiSubscriptionResponse => ({
		id: 1,
		name: "Netflix",
		amount: 1980,
		categoryId: 1,
		billingCycle: "monthly",
		nextBillingDate: "2025-08-01T00:00:00Z",
		isActive: true,
		description: "動画ストリーミング",
		createdAt: "2025-07-05T07:06:39Z",
		updatedAt: "2025-07-05T07:06:39Z",
		...overrides,
	});

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("fetchSubscriptions", () => {
		it("should fetch subscriptions successfully with array response format", async () => {
			// 今回の修正: APIが配列を直接返すケース
			const mockApiResponse: ApiSubscriptionResponse[] = [
				createMockSubscription(),
				createMockSubscription({
					id: 2,
					name: "GitHub Pro",
					amount: 400,
					categoryId: 2,
					description: null,
				}),
			];

			const mockGet = vi.mocked(apiClient.get);
			mockGet.mockResolvedValueOnce(mockApiResponse);

			const result = await fetchSubscriptions(mockCategories);

			expect(mockGet).toHaveBeenCalledWith("/subscriptions");
			expect(result).toHaveLength(2);

			// 第1サブスクリプションの検証
			expect(result[0]).toEqual({
				id: "1",
				name: "Netflix",
				amount: 1980,
				categoryId: "1", // categoryIdを使用
				billingCycle: "monthly",
				startDate: "2025-07-05", // createdAtから日付部分を抽出
				nextBillingDate: "2025-08-01", // YYYY-MM-DD形式に変換される
				isActive: true,
				description: "動画ストリーミング",
				createdAt: "2025-07-05T07:06:39Z",
				updatedAt: "2025-07-05T07:06:39Z",
			});

			// 第2サブスクリプションの検証
			expect(result[1]).toEqual({
				id: "2",
				name: "GitHub Pro",
				amount: 400,
				categoryId: "2", // categoryIdを使用
				billingCycle: "monthly",
				startDate: "2025-07-05", // createdAtから日付部分を抽出
				nextBillingDate: "2025-08-01", // YYYY-MM-DD形式に変換される
				isActive: true,
				description: undefined, // undefinedに変換される
				createdAt: "2025-07-05T07:06:39Z",
				updatedAt: "2025-07-05T07:06:39Z",
			});
		});

		it("should handle empty subscriptions array", async () => {
			// 空配列レスポンスのテスト
			const mockGet = vi.mocked(apiClient.get);
			mockGet.mockResolvedValueOnce([]);

			const result = await fetchSubscriptions(mockCategories);

			expect(mockGet).toHaveBeenCalledWith("/subscriptions");
			expect(result).toEqual([]);
		});

		it("should handle missing category with error", async () => {
			// 存在しないカテゴリIDを持つサブスクリプション
			const mockApiResponse: ApiSubscriptionResponse[] = [
				{
					id: 1,
					name: "Unknown Service",
					amount: 1000,
					categoryId: 999, // 存在しないカテゴリID
					billingCycle: "monthly",
					nextBillingDate: "2025-08-01T00:00:00Z",
					isActive: true,
					description: null,
					createdAt: "2025-07-05T07:06:39Z",
					updatedAt: "2025-07-05T07:06:39Z",
				},
			];

			const mockGet = vi.mocked(apiClient.get);
			mockGet.mockResolvedValueOnce(mockApiResponse);

			// 存在しないカテゴリの場合、エラーが投げられることを確認
			await expect(fetchSubscriptions(mockCategories)).rejects.toThrow(
				"Category with ID 999 not found",
			);
		});

		it("should handle API errors", async () => {
			const mockGet = vi.mocked(apiClient.get);
			mockGet.mockRejectedValueOnce(new Error("Network Error"));

			await expect(fetchSubscriptions(mockCategories)).rejects.toThrow(
				"Network Error",
			);
		});
	});

	describe("fetchSubscriptionById", () => {
		it("should fetch single subscription by id", async () => {
			const mockApiResponse = createMockSubscription();

			const mockGet = vi.mocked(apiClient.get);
			mockGet.mockResolvedValueOnce(mockApiResponse);

			const result = await fetchSubscriptionById("1", mockCategories);

			expect(mockGet).toHaveBeenCalledWith("/subscriptions/1");
			expect(result.id).toBe("1");
			expect(result.name).toBe("Netflix");
			expect(result.categoryId).toEqual(mockCategories[0].id);
		});
	});

	describe("createSubscription", () => {
		it("should create subscription successfully", async () => {
			const mockFormData: SubscriptionFormData = {
				name: "Spotify",
				amount: 980,
				categoryId: "1",
				billingCycle: "monthly",
				nextBillingDate: "2025-08-01",
				isActive: true,
				description: "音楽ストリーミング",
			};

			const mockApiResponse = createMockSubscription({
				id: 3,
				name: "Spotify",
				amount: 980,
				description: "音楽ストリーミング",
			});

			const mockPost = vi.mocked(apiClient.post);
			mockPost.mockResolvedValueOnce(mockApiResponse);

			const result = await createSubscription(mockFormData, mockCategories);

			expect(mockPost).toHaveBeenCalledWith(
				"/subscriptions",
				expect.any(Object),
			);
			expect(result.id).toBe("3");
			expect(result.name).toBe("Spotify");
		});
	});

	describe("updateSubscription", () => {
		it("should update subscription successfully", async () => {
			const mockFormData: Partial<SubscriptionFormData> = {
				name: "Spotify Premium",
				amount: 1480,
			};

			const mockApiResponse = createMockSubscription({
				name: "Spotify Premium",
				amount: 1480,
			});

			const mockPut = vi.mocked(apiClient.put);
			mockPut.mockResolvedValueOnce(mockApiResponse);

			const result = await updateSubscription(
				"1",
				mockFormData,
				mockCategories,
			);

			expect(mockPut).toHaveBeenCalledWith(
				"/subscriptions/1",
				expect.any(Object),
			);
			expect(result.name).toBe("Spotify Premium");
			expect(result.amount).toBe(1480);
		});
	});

	describe("deleteSubscription", () => {
		it("should delete subscription successfully", async () => {
			const mockDelete = vi.mocked(apiClient.delete);
			mockDelete.mockResolvedValueOnce(undefined);

			await deleteSubscription("1");

			expect(mockDelete).toHaveBeenCalledWith("/subscriptions/1");
		});
	});

	describe("updateSubscriptionStatus", () => {
		it("should update subscription status successfully", async () => {
			const mockApiResponse = createMockSubscription({
				isActive: false, // ステータス更新後
			});

			const mockPut = vi.mocked(apiClient.put);
			mockPut.mockResolvedValueOnce(mockApiResponse);

			const result = await updateSubscriptionStatus("1", false, mockCategories);

			expect(mockPut).toHaveBeenCalledWith("/subscriptions/1", {
				isActive: false,
			});
			expect(result.isActive).toBe(false);
		});
	});
});
