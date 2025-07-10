/**
 * API層useSubscriptionsフックのユニットテスト
 *
 * テスト対象:
 * - useApiQueryを使用したリファクタリング後のuseSubscriptions
 * - queryパラメータの依存関係
 * - エラーハンドリング
 * - 型定義の整合性
 * - useActiveSubscriptions、useInactiveSubscriptionsの動作
 */

import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../errors";
import { handleApiError, subscriptionService } from "../../index";
import type {
	GetSubscriptionsQuery,
	Subscription,
	SubscriptionStatsResponse,
} from "../../types";
import {
	useActiveSubscriptions,
	useInactiveSubscriptions,
	useSubscription,
	useSubscriptionStats,
	useSubscriptions,
} from "../useSubscriptions";

// subscriptionServiceとhandleApiErrorをモック化
vi.mock("../../index", () => ({
	subscriptionService: {
		getSubscriptions: vi.fn(),
		getSubscription: vi.fn(),
		getSubscriptionStats: vi.fn(),
	},
	handleApiError: vi.fn(),
}));

const mockSubscriptionService = vi.mocked(subscriptionService);
const mockHandleApiError = vi.mocked(handleApiError);

// テスト用のモックデータ
const mockSubscriptions: Subscription[] = [
	{
		id: "1",
		name: "Netflix",
		amount: 1990,
		billingCycle: "monthly",
		nextBillingDate: "2024-08-01",
		description: "動画配信サービス",
		isActive: true,
		category: null,
		createdAt: "2024-07-01T00:00:00Z",
		updatedAt: "2024-07-01T00:00:00Z",
	},
	{
		id: "2",
		name: "Slack",
		amount: 850,
		billingCycle: "monthly",
		nextBillingDate: "2024-08-15",
		description: "チームコミュニケーション",
		isActive: false,
		category: null,
		createdAt: "2024-07-01T00:00:00Z",
		updatedAt: "2024-07-01T00:00:00Z",
	},
];

describe("useSubscriptions", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("基本的な動作", () => {
		it("初期状態で空配列とローディング状態が設定される", () => {
			// 永続的なPending状態を作成
			mockSubscriptionService.getSubscriptions.mockImplementation(
				() => new Promise(() => {}),
			);

			const { result } = renderHook(() => useSubscriptions());

			expect(result.current.subscriptions).toEqual([]);
			expect(result.current.isLoading).toBe(true);
			expect(result.current.error).toBe(null);
			expect(typeof result.current.refetch).toBe("function");
		});

		it("サブスクリプション一覧が正常に取得される", async () => {
			mockSubscriptionService.getSubscriptions.mockResolvedValue(
				mockSubscriptions,
			);

			const { result } = renderHook(() => useSubscriptions());

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(result.current.subscriptions).toEqual(mockSubscriptions);
			expect(result.current.error).toBe(null);
			expect(mockSubscriptionService.getSubscriptions).toHaveBeenCalledWith(
				undefined,
			);
		});

		it("空配列が返された場合も正常に処理される", async () => {
			mockSubscriptionService.getSubscriptions.mockResolvedValue([]);

			const { result } = renderHook(() => useSubscriptions());

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(result.current.subscriptions).toEqual([]);
			expect(result.current.error).toBe(null);
		});

		it("エラーが発生した場合にエラーメッセージが設定される", async () => {
			const errorMessage = "サブスクリプション一覧取得に失敗しました";
			mockSubscriptionService.getSubscriptions.mockRejectedValue(
				new Error("API Error"),
			);
			mockHandleApiError.mockReturnValue(new ApiError("unknown", errorMessage));

			const { result } = renderHook(() => useSubscriptions());

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(result.current.subscriptions).toEqual([]);
			expect(result.current.error).toBe(errorMessage);
			expect(mockHandleApiError).toHaveBeenCalledWith(
				expect.any(Error),
				"サブスクリプション一覧取得",
			);
		});
	});

	describe("queryパラメータの依存関係", () => {
		it("queryパラメータが渡された場合、subscriptionServiceに正しく渡される", async () => {
			const query: GetSubscriptionsQuery = { isActive: true };
			mockSubscriptionService.getSubscriptions.mockResolvedValue(
				mockSubscriptions,
			);

			const { result } = renderHook(() => useSubscriptions(query));

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(mockSubscriptionService.getSubscriptions).toHaveBeenCalledWith(
				query,
			);
		});

		it("queryパラメータが変更されると再フェッチが実行される", async () => {
			const initialQuery: GetSubscriptionsQuery = { isActive: true };
			const updatedQuery: GetSubscriptionsQuery = { isActive: false };

			mockSubscriptionService.getSubscriptions.mockResolvedValue(
				mockSubscriptions,
			);

			const { result, rerender } = renderHook(
				({ query }) => useSubscriptions(query),
				{
					initialProps: { query: initialQuery },
				},
			);

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(mockSubscriptionService.getSubscriptions).toHaveBeenCalledWith(
				initialQuery,
			);

			// queryパラメータを変更
			rerender({ query: updatedQuery });

			await waitFor(() => {
				expect(mockSubscriptionService.getSubscriptions).toHaveBeenCalledWith(
					updatedQuery,
				);
			});

			// useApiQueryの実装により、複数回呼ばれる可能性がある
			expect(mockSubscriptionService.getSubscriptions).toHaveBeenCalledWith(
				initialQuery,
			);
			expect(mockSubscriptionService.getSubscriptions).toHaveBeenCalledWith(
				updatedQuery,
			);
		});
	});

	describe("refetch機能", () => {
		it("refetchが正常に動作する", async () => {
			mockSubscriptionService.getSubscriptions.mockResolvedValue(
				mockSubscriptions,
			);

			const { result } = renderHook(() => useSubscriptions());

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(result.current.subscriptions).toEqual(mockSubscriptions);

			// refetch実行
			const updatedData = [mockSubscriptions[0]];
			mockSubscriptionService.getSubscriptions.mockResolvedValue(updatedData);

			await result.current.refetch();

			await waitFor(() => {
				expect(result.current.subscriptions).toEqual(updatedData);
			});

			// useApiQueryの実装により、複数回呼ばれる可能性がある
			expect(mockSubscriptionService.getSubscriptions).toHaveBeenCalledWith(
				undefined,
			);
		});
	});
});

describe("useActiveSubscriptions", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("isActive: trueのクエリパラメータでuseSubscriptionsを呼び出す", async () => {
		const activeSubscriptions = [mockSubscriptions[0]];
		mockSubscriptionService.getSubscriptions.mockResolvedValue(
			activeSubscriptions,
		);

		const { result } = renderHook(() => useActiveSubscriptions());

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(mockSubscriptionService.getSubscriptions).toHaveBeenCalledWith({
			isActive: true,
		});
		expect(result.current.subscriptions).toEqual(activeSubscriptions);
	});
});

describe("useInactiveSubscriptions", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("isActive: falseのクエリパラメータでuseSubscriptionsを呼び出す", async () => {
		const inactiveSubscriptions = [mockSubscriptions[1]];
		mockSubscriptionService.getSubscriptions.mockResolvedValue(
			inactiveSubscriptions,
		);

		const { result } = renderHook(() => useInactiveSubscriptions());

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(mockSubscriptionService.getSubscriptions).toHaveBeenCalledWith({
			isActive: false,
		});
		expect(result.current.subscriptions).toEqual(inactiveSubscriptions);
	});
});

// useApiQueryを使用したuseSubscriptionとuseSubscriptionStatsのテスト
describe("useSubscription (useApiQuery対応)", () => {
	const mockSubscription: Subscription = {
		id: "1",
		name: "Netflix",
		amount: 1200,
		billingCycle: "monthly",
		nextBillingDate: "2024-02-01",
		description: "ストリーミングサービス",
		isActive: true,
		category: null,
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("useApiQueryベースの実装でサブスクリプション詳細を取得する", async () => {
		mockSubscriptionService.getSubscription.mockResolvedValue(mockSubscription);

		const { result } = renderHook(() => useSubscription("1"));

		// 初期状態の検証
		expect(result.current.subscription).toBeNull();
		expect(result.current.isLoading).toBe(true);
		expect(result.current.error).toBeNull();

		// データ取得完了を待機
		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		// 結果の検証
		expect(result.current.subscription).toEqual(mockSubscription);
		expect(result.current.error).toBeNull();
		expect(mockSubscriptionService.getSubscription).toHaveBeenCalledWith("1");
	});

	it("idがnullの場合、フェッチを実行しない", () => {
		const { result } = renderHook(() => useSubscription(null));

		// 初期状態の検証
		expect(result.current.subscription).toBeNull();
		expect(result.current.isLoading).toBe(false);
		expect(result.current.error).toBeNull();
		expect(mockSubscriptionService.getSubscription).not.toHaveBeenCalled();
	});
});

describe("useSubscriptionStats (useApiQuery対応)", () => {
	const mockStats: SubscriptionStatsResponse = {
		stats: {
			totalActive: 3,
			totalInactive: 1,
			monthlyTotal: 5000,
			yearlyTotal: 60000,
			avgMonthlyAmount: 1666.67,
			categoryBreakdown: [
				{
					categoryId: "1",
					categoryName: "エンタメ",
					count: 2,
					totalAmount: 3000,
				},
				{
					categoryId: "2",
					categoryName: "ツール",
					count: 1,
					totalAmount: 2000,
				},
			],
		},
		upcomingBillings: [],
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("useApiQueryベースの実装で統計データを取得する", async () => {
		mockSubscriptionService.getSubscriptionStats.mockResolvedValue(mockStats);

		const { result } = renderHook(() => useSubscriptionStats());

		// 初期状態の検証
		expect(result.current.stats).toBeNull();
		expect(result.current.isLoading).toBe(true);
		expect(result.current.error).toBeNull();

		// データ取得完了を待機
		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		// 結果の検証
		expect(result.current.stats).toEqual(mockStats);
		expect(result.current.error).toBeNull();
		expect(mockSubscriptionService.getSubscriptionStats).toHaveBeenCalled();
	});
});
