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

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../errors";
import { handleApiError, subscriptionService } from "../../index";
import type { GetSubscriptionsQuery, Subscription } from "../../types";
import {
	useActiveSubscriptions,
	useInactiveSubscriptions,
	useSubscriptions,
} from "../useSubscriptions";

// subscriptionServiceとhandleApiErrorをモック化
vi.mock("../../index", () => ({
	subscriptionService: {
		getSubscriptions: vi.fn(),
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

			await act(async () => {
				await waitFor(() => {
					expect(result.current.isLoading).toBe(false);
				});
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

			await act(async () => {
				await waitFor(() => {
					expect(result.current.isLoading).toBe(false);
				});
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

			await act(async () => {
				await waitFor(() => {
					expect(result.current.isLoading).toBe(false);
				});
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

			await act(async () => {
				await waitFor(() => {
					expect(result.current.isLoading).toBe(false);
				});
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

			await act(async () => {
				await waitFor(() => {
					expect(result.current.isLoading).toBe(false);
				});
			});

			expect(mockSubscriptionService.getSubscriptions).toHaveBeenCalledWith(
				initialQuery,
			);

			// queryパラメータを変更
			rerender({ query: updatedQuery });

			await act(async () => {
				await waitFor(() => {
					expect(mockSubscriptionService.getSubscriptions).toHaveBeenCalledWith(
						updatedQuery,
					);
				});
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

			await act(async () => {
				await waitFor(() => {
					expect(result.current.isLoading).toBe(false);
				});
			});

			expect(result.current.subscriptions).toEqual(mockSubscriptions);

			// refetch実行
			const updatedData = [mockSubscriptions[0]];
			mockSubscriptionService.getSubscriptions.mockResolvedValue(updatedData);

			await act(async () => {
				await result.current.refetch();
			});

			await act(async () => {
				await waitFor(() => {
					expect(result.current.subscriptions).toEqual(updatedData);
				});
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

		await act(async () => {
			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});
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

		await act(async () => {
			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});
		});

		expect(mockSubscriptionService.getSubscriptions).toHaveBeenCalledWith({
			isActive: false,
		});
		expect(result.current.subscriptions).toEqual(inactiveSubscriptions);
	});
});
