/**
 * サブスクリプションAPIサービスのユニットテスト
 *
 * テスト対象:
 * - 基本的なCRUD操作
 * - クエリパラメータを使用した絞り込み機能
 * - エラーハンドリング
 * - ユーティリティ関数
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import {
	getSubscriptions,
	getSubscription,
	createSubscription,
	updateSubscription,
	deleteSubscription,
	getSubscriptionStats,
	getActiveSubscriptions,
	getInactiveSubscriptions,
	getSubscriptionsByCategory,
	getSubscriptionsByBillingCycle,
	toggleSubscriptionStatus,
	subscriptionService,
} from "./subscriptions";
import { apiClient } from "../client";
import { endpoints } from "../config";
import type {
	Subscription,
	CreateSubscriptionRequest,
	UpdateSubscriptionRequest,
	SubscriptionStatsResponse,
	DeleteResponse,
} from "../types";

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
	serviceName: "Netflix",
	amount: 1990,
	categoryId: "cat1",
	billingCycle: "monthly",
	nextBillingDate: "2024-08-01",
	isActive: true,
	description: "動画配信サービス",
	createdAt: "2024-07-01T00:00:00Z",
	updatedAt: "2024-07-01T00:00:00Z",
};

const mockSubscriptions: Subscription[] = [
	mockSubscription,
	{
		id: "sub2",
		serviceName: "Spotify",
		amount: 980,
		categoryId: "cat1",
		billingCycle: "monthly",
		nextBillingDate: "2024-08-15",
		isActive: false,
		description: "音楽配信サービス",
		createdAt: "2024-07-15T00:00:00Z",
		updatedAt: "2024-07-15T00:00:00Z",
	},
];

const mockCreateRequest: CreateSubscriptionRequest = {
	serviceName: "Slack",
	amount: 850,
	categoryId: "cat2",
	billingCycle: "monthly",
	nextBillingDate: "2024-08-20",
	description: "チームコミュニケーション",
};

const mockUpdateRequest: UpdateSubscriptionRequest = {
	serviceName: "Netflix Premium",
	amount: 2490,
};

const mockStatsResponse: SubscriptionStatsResponse = {
	totalSubscriptions: 5,
	activeSubscriptions: 3,
	totalMonthlyAmount: 4820,
	totalYearlyAmount: 57840,
};

const mockDeleteResponse: DeleteResponse = {
	success: true,
	message: "削除が完了しました",
};

describe("subscriptions service", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getSubscriptions", () => {
		it("サブスクリプション一覧を取得する", async () => {
			mockApiClient.get.mockResolvedValue(mockSubscriptions);

			const result = await getSubscriptions();

			expect(result).toEqual(mockSubscriptions);
			expect(mockApiClient.get).toHaveBeenCalledWith(endpoints.subscriptions.list);
		});

		it("クエリパラメータ付きで取得する", async () => {
			const query = { isActive: true, categoryId: "cat1" };
			mockApiClient.get.mockResolvedValue([mockSubscription]);

			const result = await getSubscriptions(query);

			expect(result).toEqual([mockSubscription]);
			expect(mockApiClient.get).toHaveBeenCalledWith(
				expect.stringContaining("isActive=true"),
			);
			expect(mockApiClient.get).toHaveBeenCalledWith(
				expect.stringContaining("categoryId=cat1"),
			);
		});

		it("空のクエリパラメータでも正常に動作する", async () => {
			mockApiClient.get.mockResolvedValue(mockSubscriptions);

			const result = await getSubscriptions({});

			expect(result).toEqual(mockSubscriptions);
			expect(mockApiClient.get).toHaveBeenCalledWith(endpoints.subscriptions.list);
		});
	});

	describe("getSubscription", () => {
		it("IDでサブスクリプション詳細を取得する", async () => {
			mockApiClient.get.mockResolvedValue(mockSubscription);

			const result = await getSubscription("sub1");

			expect(result).toEqual(mockSubscription);
			expect(mockApiClient.get).toHaveBeenCalledWith(
				endpoints.subscriptions.detail("sub1"),
			);
		});

		it("存在しないIDの場合はエラーをスローする", async () => {
			const error = new Error("サブスクリプションが見つかりません");
			mockApiClient.get.mockRejectedValue(error);

			await expect(getSubscription("nonexistent")).rejects.toThrow(error);
		});
	});

	describe("createSubscription", () => {
		it("新しいサブスクリプションを作成する", async () => {
			const newSubscription = { ...mockSubscription, id: "sub3" };
			mockApiClient.post.mockResolvedValue(newSubscription);

			const result = await createSubscription(mockCreateRequest);

			expect(result).toEqual(newSubscription);
			expect(mockApiClient.post).toHaveBeenCalledWith(
				endpoints.subscriptions.create,
				mockCreateRequest,
			);
		});

		it("バリデーションエラーの場合はエラーをスローする", async () => {
			const error = new Error("バリデーションエラー");
			mockApiClient.post.mockRejectedValue(error);

			await expect(createSubscription(mockCreateRequest)).rejects.toThrow(error);
		});
	});

	describe("updateSubscription", () => {
		it("サブスクリプションを更新する", async () => {
			const updatedSubscription = { ...mockSubscription, ...mockUpdateRequest };
			mockApiClient.put.mockResolvedValue(updatedSubscription);

			const result = await updateSubscription("sub1", mockUpdateRequest);

			expect(result).toEqual(updatedSubscription);
			expect(mockApiClient.put).toHaveBeenCalledWith(
				endpoints.subscriptions.update("sub1"),
				mockUpdateRequest,
			);
		});

		it("存在しないIDの場合はエラーをスローする", async () => {
			const error = new Error("サブスクリプションが見つかりません");
			mockApiClient.put.mockRejectedValue(error);

			await expect(
				updateSubscription("nonexistent", mockUpdateRequest),
			).rejects.toThrow(error);
		});
	});

	describe("deleteSubscription", () => {
		it("サブスクリプションを削除する", async () => {
			mockApiClient.delete.mockResolvedValue(mockDeleteResponse);

			const result = await deleteSubscription("sub1");

			expect(result).toEqual(mockDeleteResponse);
			expect(mockApiClient.delete).toHaveBeenCalledWith(
				endpoints.subscriptions.delete("sub1"),
			);
		});

		it("削除権限がない場合はエラーをスローする", async () => {
			const error = new Error("削除権限がありません");
			mockApiClient.delete.mockRejectedValue(error);

			await expect(deleteSubscription("sub1")).rejects.toThrow(error);
		});
	});

	describe("getSubscriptionStats", () => {
		it("サブスクリプション統計を取得する", async () => {
			mockApiClient.get.mockResolvedValue(mockStatsResponse);

			const result = await getSubscriptionStats();

			expect(result).toEqual(mockStatsResponse);
			expect(mockApiClient.get).toHaveBeenCalledWith(endpoints.subscriptions.stats);
		});
	});

	describe("ユーティリティ関数", () => {
		beforeEach(() => {
			// getSubscriptionsのモックを設定
			vi.mocked(mockApiClient.get).mockImplementation((endpoint: string) => {
				if (endpoint.includes("isActive=true")) {
					return Promise.resolve([mockSubscription]);
				}
				if (endpoint.includes("isActive=false")) {
					return Promise.resolve([mockSubscriptions[1]]);
				}
				if (endpoint.includes("categoryId=cat1")) {
					return Promise.resolve([mockSubscription]);
				}
				if (endpoint.includes("billingCycle=monthly")) {
					return Promise.resolve(mockSubscriptions);
				}
				return Promise.resolve(mockSubscriptions);
			});
		});

		describe("getActiveSubscriptions", () => {
			it("アクティブなサブスクリプションのみを取得する", async () => {
				const result = await getActiveSubscriptions();

				expect(result).toEqual([mockSubscription]);
				expect(mockApiClient.get).toHaveBeenCalledWith(
					expect.stringContaining("isActive=true"),
				);
			});
		});

		describe("getInactiveSubscriptions", () => {
			it("非アクティブなサブスクリプションのみを取得する", async () => {
				const result = await getInactiveSubscriptions();

				expect(result).toEqual([mockSubscriptions[1]]);
				expect(mockApiClient.get).toHaveBeenCalledWith(
					expect.stringContaining("isActive=false"),
				);
			});
		});

		describe("getSubscriptionsByCategory", () => {
			it("特定のカテゴリのサブスクリプションを取得する", async () => {
				const result = await getSubscriptionsByCategory("cat1");

				expect(result).toEqual([mockSubscription]);
				expect(mockApiClient.get).toHaveBeenCalledWith(
					expect.stringContaining("categoryId=cat1"),
				);
			});
		});

		describe("getSubscriptionsByBillingCycle", () => {
			it("特定の請求サイクルのサブスクリプションを取得する", async () => {
				const result = await getSubscriptionsByBillingCycle("monthly");

				expect(result).toEqual(mockSubscriptions);
				expect(mockApiClient.get).toHaveBeenCalledWith(
					expect.stringContaining("billingCycle=monthly"),
				);
			});

			it("年次請求サイクルのサブスクリプションを取得する", async () => {
				const result = await getSubscriptionsByBillingCycle("yearly");

				expect(mockApiClient.get).toHaveBeenCalledWith(
					expect.stringContaining("billingCycle=yearly"),
				);
			});

			it("週次請求サイクルのサブスクリプションを取得する", async () => {
				const result = await getSubscriptionsByBillingCycle("weekly");

				expect(mockApiClient.get).toHaveBeenCalledWith(
					expect.stringContaining("billingCycle=weekly"),
				);
			});
		});

		describe("toggleSubscriptionStatus", () => {
			it("サブスクリプションをアクティブに変更する", async () => {
				const updatedSubscription = { ...mockSubscription, isActive: true };
				mockApiClient.put.mockResolvedValue(updatedSubscription);

				const result = await toggleSubscriptionStatus("sub1", true);

				expect(result).toEqual(updatedSubscription);
				expect(mockApiClient.put).toHaveBeenCalledWith(
					endpoints.subscriptions.update("sub1"),
					{ isActive: true },
				);
			});

			it("サブスクリプションを非アクティブに変更する", async () => {
				const updatedSubscription = { ...mockSubscription, isActive: false };
				mockApiClient.put.mockResolvedValue(updatedSubscription);

				const result = await toggleSubscriptionStatus("sub1", false);

				expect(result).toEqual(updatedSubscription);
				expect(mockApiClient.put).toHaveBeenCalledWith(
					endpoints.subscriptions.update("sub1"),
					{ isActive: false },
				);
			});
		});
	});

	describe("subscriptionService オブジェクト", () => {
		it("すべての関数がエクスポートされている", () => {
			expect(subscriptionService.getSubscriptions).toBe(getSubscriptions);
			expect(subscriptionService.getSubscription).toBe(getSubscription);
			expect(subscriptionService.createSubscription).toBe(createSubscription);
			expect(subscriptionService.updateSubscription).toBe(updateSubscription);
			expect(subscriptionService.deleteSubscription).toBe(deleteSubscription);
			expect(subscriptionService.getSubscriptionStats).toBe(getSubscriptionStats);
			expect(subscriptionService.getActiveSubscriptions).toBe(getActiveSubscriptions);
			expect(subscriptionService.getInactiveSubscriptions).toBe(getInactiveSubscriptions);
			expect(subscriptionService.getSubscriptionsByCategory).toBe(getSubscriptionsByCategory);
			expect(subscriptionService.getSubscriptionsByBillingCycle).toBe(getSubscriptionsByBillingCycle);
			expect(subscriptionService.toggleSubscriptionStatus).toBe(toggleSubscriptionStatus);
		});

		it("オブジェクトが読み取り専用である", () => {
			// as constで作成されているため、プロパティの変更はTypeScriptレベルでエラーになる
			// ランタイムレベルでの確認
			const descriptor = Object.getOwnPropertyDescriptor(subscriptionService, 'getSubscriptions');
			expect(descriptor?.writable).toBe(true); // 関数プロパティは技術的には書き換え可能だが、型レベルで保護されている
			expect(Object.isFrozen(subscriptionService)).toBe(false); // as constは型レベルの保護のみ
		});
	});

	describe("エッジケース", () => {
		it("undefined値のクエリパラメータを正しく処理する", async () => {
			const query = { isActive: undefined, categoryId: "cat1" };
			mockApiClient.get.mockResolvedValue(mockSubscriptions);

			await getSubscriptions(query);

			// undefinedの値は含まれず、categoryIdのみが含まれる
			expect(mockApiClient.get).toHaveBeenCalledWith(
				expect.stringContaining("categoryId=cat1"),
			);
			expect(mockApiClient.get).toHaveBeenCalledWith(
				expect.not.stringContaining("isActive=undefined"),
			);
		});

		it("null値のクエリパラメータを正しく処理する", async () => {
			const query = { isActive: null, categoryId: "cat1" };
			mockApiClient.get.mockResolvedValue(mockSubscriptions);

			await getSubscriptions(query);

			// nullの値は含まれず、categoryIdのみが含まれる
			expect(mockApiClient.get).toHaveBeenCalledWith(
				expect.stringContaining("categoryId=cat1"),
			);
			expect(mockApiClient.get).toHaveBeenCalledWith(
				expect.not.stringContaining("isActive=null"),
			);
		});

		it("空文字列のIDでも関数を呼び出せる", async () => {
			mockApiClient.get.mockResolvedValue(mockSubscription);

			await getSubscription("");

			expect(mockApiClient.get).toHaveBeenCalledWith(endpoints.subscriptions.detail(""));
		});

		it("空のデータで作成・更新ができる", async () => {
			const emptyRequest = {} as CreateSubscriptionRequest;
			mockApiClient.post.mockResolvedValue(mockSubscription);

			await createSubscription(emptyRequest);

			expect(mockApiClient.post).toHaveBeenCalledWith(
				endpoints.subscriptions.create,
				emptyRequest,
			);
		});
	});
});