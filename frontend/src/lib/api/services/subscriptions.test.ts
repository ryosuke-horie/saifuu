/**
 * サブスクリプションAPIサービスのユニットテスト
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "../client";
import { endpoints } from "../config";
import type {
	CreateSubscriptionRequest,
	DeleteResponse,
	GetSubscriptionsQuery,
	Subscription,
	SubscriptionStats,
	UpdateSubscriptionRequest,
} from "../types";
import {
	createSubscription,
	deleteSubscription,
	getActiveSubscriptions,
	getInactiveSubscriptions,
	getSubscription,
	getSubscriptionStats,
	getSubscriptions,
	getSubscriptionsByBillingCycle,
	getSubscriptionsByCategory,
	toggleSubscriptionStatus,
	updateSubscription,
} from "./subscriptions";

// APIクライアントをモック
vi.mock("../client", () => ({
	apiClient: {
		get: vi.fn(),
		post: vi.fn(),
		put: vi.fn(),
		delete: vi.fn(),
	},
	addQueryParams: vi.fn((endpoint, params) => {
		if (!params) return endpoint;
		const url = new URL(endpoint, "http://localhost");
		Object.entries(params).forEach(([key, value]) => {
			if (value !== undefined && value !== null) {
				url.searchParams.append(key, String(value));
			}
		});
		return url.pathname + url.search;
	}),
}));

const mockApiClient = vi.mocked(apiClient);

// テスト用のモックデータ
const mockSubscription: Subscription = {
	id: "sub1",
	name: "Netflix",
	amount: 1980,
	billingCycle: "monthly",
	nextBillingDate: "2024-08-01",
	category: {
		id: "cat1",
		name: "エンタメ",
		type: "expense",
		color: "#FF6B6B",
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	description: "動画配信サービス",
	isActive: true,
	createdAt: "2024-01-01T00:00:00Z",
	updatedAt: "2024-01-01T00:00:00Z",
};

const mockSubscriptions: Subscription[] = [mockSubscription];

const mockCreateRequest: CreateSubscriptionRequest = {
	name: "Netflix",
	amount: 1980,
	billingCycle: "monthly",
	nextBillingDate: "2024-08-01",
	categoryId: "cat1",
	description: "動画配信サービス",
};

const mockUpdateRequest: UpdateSubscriptionRequest = {
	amount: 2490,
	description: "プレミアムプラン",
};

const mockStatsResponse: SubscriptionStats = {
	totalActive: 5,
	totalInactive: 2,
	monthlyTotal: 15000,
	yearlyTotal: 180000,
};

const mockDeleteResponse: DeleteResponse = {
	message: "削除が完了しました",
	deletedId: "sub1",
};

describe("subscriptions service", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("基本CRUD操作", () => {
		it("サブスクリプション一覧を取得する（クエリパラメータ有無両方）", async () => {
			mockApiClient.get.mockResolvedValue(mockSubscriptions);

			// クエリなし
			const result1 = await getSubscriptions();
			expect(result1).toEqual(mockSubscriptions);
			expect(mockApiClient.get).toHaveBeenCalledWith(endpoints.subscriptions.list);

			// クエリあり
			const query: GetSubscriptionsQuery = {
				isActive: true,
				categoryId: "cat1",
			};
			const result2 = await getSubscriptions(query);
			expect(result2).toEqual(mockSubscriptions);
			expect(mockApiClient.get).toHaveBeenCalledWith(
				expect.stringContaining("isActive=true&categoryId=cat1"),
			);
		});

		it("全てのCRUD操作が正しく動作する", async () => {
			// Read (single)
			mockApiClient.get.mockResolvedValue(mockSubscription);
			const getResult = await getSubscription("sub1");
			expect(getResult).toEqual(mockSubscription);
			expect(mockApiClient.get).toHaveBeenCalledWith(
				endpoints.subscriptions.detail("sub1"),
			);

			// Create
			mockApiClient.post.mockResolvedValue(mockSubscription);
			const createResult = await createSubscription(mockCreateRequest);
			expect(createResult).toEqual(mockSubscription);
			expect(mockApiClient.post).toHaveBeenCalledWith(
				endpoints.subscriptions.create,
				mockCreateRequest,
			);

			// Update
			mockApiClient.put.mockResolvedValue(mockSubscription);
			const updateResult = await updateSubscription("sub1", mockUpdateRequest);
			expect(updateResult).toEqual(mockSubscription);
			expect(mockApiClient.put).toHaveBeenCalledWith(
				endpoints.subscriptions.update("sub1"),
				mockUpdateRequest,
			);

			// Delete
			mockApiClient.delete.mockResolvedValue(mockDeleteResponse);
			const deleteResult = await deleteSubscription("sub1");
			expect(deleteResult).toEqual(mockDeleteResponse);
			expect(mockApiClient.delete).toHaveBeenCalledWith(
				endpoints.subscriptions.delete("sub1"),
			);
		});

		it("統計情報を取得する", async () => {
			mockApiClient.get.mockResolvedValue(mockStatsResponse);
			const result = await getSubscriptionStats();
			expect(result).toEqual(mockStatsResponse);
			expect(mockApiClient.get).toHaveBeenCalledWith(endpoints.subscriptions.stats);
		});
	});

	describe("ユーティリティ関数", () => {
		it.each([
			["getActiveSubscriptions", getActiveSubscriptions, "isActive=true"],
			["getInactiveSubscriptions", getInactiveSubscriptions, "isActive=false"],
			["getSubscriptionsByCategory", () => getSubscriptionsByCategory("cat1"), "categoryId=cat1"],
			["getSubscriptionsByBillingCycle", () => getSubscriptionsByBillingCycle("monthly"), "billingCycle=monthly"],
		])("%s が正しいフィルターで getSubscriptions を呼ぶ", async (name, fn, expectedParam) => {
			mockApiClient.get.mockResolvedValue(mockSubscriptions);
			await fn();
			expect(mockApiClient.get).toHaveBeenCalledWith(
				expect.stringContaining(expectedParam),
			);
		});

		it("toggleSubscriptionStatus が isActive フィールドを更新する", async () => {
			mockApiClient.put.mockResolvedValue(mockSubscription);
			
			// アクティブに切り替え
			await toggleSubscriptionStatus("sub1", true);
			expect(mockApiClient.put).toHaveBeenCalledWith(
				endpoints.subscriptions.update("sub1"),
				{ isActive: true },
			);

			// 非アクティブに切り替え
			vi.clearAllMocks();
			await toggleSubscriptionStatus("sub1", false);
			expect(mockApiClient.put).toHaveBeenCalledWith(
				endpoints.subscriptions.update("sub1"),
				{ isActive: false },
			);
		});
	});

	describe("エラーハンドリング", () => {
		it("APIエラーを正しく伝播する", async () => {
			const error = new Error("API Error");
			mockApiClient.get.mockRejectedValue(error);

			await expect(getSubscriptions()).rejects.toThrow(error);
		});
	});
});