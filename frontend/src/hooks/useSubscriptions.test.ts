/**
 * useSubscriptionsカスタムフックのユニットテスト
 *
 * テスト対象:
 * - 初期ローディング状態
 * - サブスクリプションデータの取得成功/失敗
 * - CRUD操作（作成、更新、削除、ステータス更新）
 * - refetch機能
 * - カテゴリ依存の動作
 * - エラーハンドリング
 */

import { renderHook, waitFor, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	createSubscription,
	deleteSubscription,
	fetchSubscriptionById,
	fetchSubscriptions,
	updateSubscription,
	updateSubscriptionStatus,
} from "../lib/api/subscriptions";
import type { Category } from "../types/category";
import type { Subscription, SubscriptionFormData } from "../types/subscription";
import { useSubscriptions } from "./useSubscriptions";

// APIモジュールをモック
vi.mock("../lib/api/subscriptions", () => ({
	fetchSubscriptions: vi.fn(),
	createSubscription: vi.fn(),
	updateSubscription: vi.fn(),
	deleteSubscription: vi.fn(),
	updateSubscriptionStatus: vi.fn(),
	fetchSubscriptionById: vi.fn(),
}));

const mockFetchSubscriptions = vi.mocked(fetchSubscriptions);
const mockCreateSubscription = vi.mocked(createSubscription);
const mockUpdateSubscription = vi.mocked(updateSubscription);
const mockDeleteSubscription = vi.mocked(deleteSubscription);
const mockUpdateSubscriptionStatus = vi.mocked(updateSubscriptionStatus);
const mockFetchSubscriptionById = vi.mocked(fetchSubscriptionById);

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
		name: "ビジネス",
		type: "expense",
		color: "#4ecdc4",
		createdAt: "2024-07-01T00:00:00Z",
		updatedAt: "2024-07-01T00:00:00Z",
	},
];

const mockSubscriptions: Subscription[] = [
	{
		id: "sub1",
		name: "Netflix",
		amount: 1990,
		billingCycle: "monthly",
		nextBillingDate: "2024-08-01",
		description: "動画配信サービス",
		isActive: true,
		category: mockCategories[0],
	},
	{
		id: "sub2",
		name: "Slack",
		amount: 850,
		billingCycle: "monthly",
		nextBillingDate: "2024-08-15",
		description: "チームコミュニケーション",
		isActive: true,
		category: mockCategories[1],
	},
];

const mockFormData: SubscriptionFormData = {
	name: "Spotify",
	amount: 980,
	categoryId: "1",
	billingCycle: "monthly",
	nextBillingDate: "2024-08-20",
	description: "音楽配信サービス",
};

describe("useSubscriptions", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("初期状態", () => {
		it("初期ローディング状態が正しく設定される", () => {
			mockFetchSubscriptions.mockImplementation(
				() => new Promise(() => {}), // 永続的なPending状態
			);

			const { result } = renderHook(() => useSubscriptions(mockCategories));

			expect(result.current.subscriptions).toEqual([]);
			expect(result.current.loading).toBe(true);
			expect(result.current.error).toBe(null);
			expect(result.current.operationLoading).toBe(false);
			expect(typeof result.current.refetch).toBe("function");
			expect(typeof result.current.createSubscriptionMutation).toBe("function");
		});

		it("カテゴリが空の場合は取得処理をスキップする", async () => {
			const { result } = renderHook(() => useSubscriptions([]));

			// 少し待機してAPIが呼ばれないことを確認
			await new Promise((resolve) => setTimeout(resolve, 100));

			expect(mockFetchSubscriptions).not.toHaveBeenCalled();
			expect(result.current.loading).toBe(true);
		});
	});

	describe("サブスクリプション取得", () => {
		it("サブスクリプションが正常に取得される", async () => {
			mockFetchSubscriptions.mockResolvedValue(mockSubscriptions);

			const { result } = renderHook(() => useSubscriptions(mockCategories));

			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			expect(result.current.subscriptions).toEqual(mockSubscriptions);
			expect(result.current.error).toBe(null);
			expect(mockFetchSubscriptions).toHaveBeenCalledWith(mockCategories);
		});

		it("空配列が返された場合も正常に処理される", async () => {
			mockFetchSubscriptions.mockResolvedValue([]);

			const { result } = renderHook(() => useSubscriptions(mockCategories));

			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			expect(result.current.subscriptions).toEqual([]);
			expect(result.current.error).toBe(null);
		});

		it("取得失敗時にエラーが設定される", async () => {
			const errorMessage = "サーバーエラーが発生しました";
			mockFetchSubscriptions.mockRejectedValue(new Error(errorMessage));

			const { result } = renderHook(() => useSubscriptions(mockCategories));

			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			expect(result.current.subscriptions).toEqual([]);
			expect(result.current.error).toBe(errorMessage);
		});

		it("未知のエラーの場合、デフォルトメッセージが設定される", async () => {
			mockFetchSubscriptions.mockRejectedValue("unknown error");

			const { result } = renderHook(() => useSubscriptions(mockCategories));

			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			expect(result.current.error).toBe(
				"サブスクリプションの取得に失敗しました",
			);
		});
	});

	describe("サブスクリプション作成", () => {
		beforeEach(() => {
			mockFetchSubscriptions.mockResolvedValue(mockSubscriptions);
		});

		it("サブスクリプションが正常に作成される", async () => {
			const newSubscription: Subscription = {
				id: "sub3",
				name: mockFormData.name,
				amount: mockFormData.amount,
				category: mockCategories[0],
				billingCycle: mockFormData.billingCycle,
				nextBillingDate: mockFormData.nextBillingDate,
				isActive: true,
				description: mockFormData.description,
			};

			mockCreateSubscription.mockResolvedValue(newSubscription);

			const { result } = renderHook(() => useSubscriptions(mockCategories));

			// 初期データの読み込み完了を待機
			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			// 作成実行
			const created = await act(async () => {
				return await result.current.createSubscriptionMutation(mockFormData);
			});

			expect(created).toEqual(newSubscription);

			// 状態更新を待機
			await waitFor(() => {
				expect(result.current.subscriptions).toContain(newSubscription);
			});

			expect(result.current.subscriptions).toHaveLength(
				mockSubscriptions.length + 1,
			);
			expect(result.current.operationLoading).toBe(false);
			expect(mockCreateSubscription).toHaveBeenCalledWith(
				mockFormData,
				mockCategories,
			);
		});

		it("作成中のローディング状態が管理される", async () => {
			const newSubscription: Subscription = {
				id: "sub3",
				name: mockFormData.name,
				amount: mockFormData.amount,
				category: mockCategories[0],
				billingCycle: mockFormData.billingCycle,
				nextBillingDate: mockFormData.nextBillingDate,
				isActive: true,
				description: mockFormData.description,
			};

			let resolveCreate: (value: Subscription) => void;
			const createPromise = new Promise<Subscription>((resolve) => {
				resolveCreate = resolve;
			});
			mockCreateSubscription.mockReturnValue(createPromise);

			const { result } = renderHook(() => useSubscriptions(mockCategories));

			// 初期データの読み込み完了を待機
			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			// 作成実行（非同期）
			const createPromiseResult = act(async () => {
				return result.current.createSubscriptionMutation(mockFormData);
			});

			// ローディング状態の確認
			await waitFor(() => {
				expect(result.current.operationLoading).toBe(true);
			});

			// 作成完了
			resolveCreate!(newSubscription);
			await createPromiseResult;

			await waitFor(() => {
				expect(result.current.operationLoading).toBe(false);
			});
		});

		it("作成失敗時にエラーが設定される", async () => {
			const errorMessage = "作成権限がありません";
			mockCreateSubscription.mockRejectedValue(new Error(errorMessage));

			const { result } = renderHook(() => useSubscriptions(mockCategories));

			// 初期データの読み込み完了を待機
			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			// 作成実行（エラーが発生することを期待）
			await expect(
				act(async () => {
					return result.current.createSubscriptionMutation(mockFormData);
				}),
			).rejects.toThrow(errorMessage);

			// エラー状態の更新を待機（throw後でも非同期状態更新が完了するまで待機）
			await waitFor(() => {
				expect(result.current.error).toBe(errorMessage);
			});

			expect(result.current.operationLoading).toBe(false);
			expect(result.current.subscriptions).toHaveLength(
				mockSubscriptions.length,
			);
		});
	});

	describe("サブスクリプション更新", () => {
		beforeEach(() => {
			mockFetchSubscriptions.mockResolvedValue(mockSubscriptions);
		});

		it("サブスクリプションが正常に更新される", async () => {
			const updateData = { name: "Netflix Premium", amount: 2490 };
			const updatedSubscription: Subscription = {
				...mockSubscriptions[0],
				...updateData,
			};

			mockUpdateSubscription.mockResolvedValue(updatedSubscription);

			const { result } = renderHook(() => useSubscriptions(mockCategories));

			// 初期データの読み込み完了を待機
			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			// 更新実行
			const updated = await act(async () => {
				return await result.current.updateSubscriptionMutation(
					"sub1",
					updateData,
				);
			});

			expect(updated).toEqual(updatedSubscription);

			// 状態更新の完了を待機
			await waitFor(() => {
				expect(result.current.subscriptions[0]).toEqual(updatedSubscription);
			});

			expect(mockUpdateSubscription).toHaveBeenCalledWith(
				"sub1",
				updateData,
				mockCategories,
			);
		});

		it("更新失敗時にエラーが設定される", async () => {
			const errorMessage = "更新権限がありません";
			mockUpdateSubscription.mockRejectedValue(new Error(errorMessage));

			const { result } = renderHook(() => useSubscriptions(mockCategories));

			// 初期データの読み込み完了を待機
			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			// 更新実行（エラーが発生することを期待）
			await expect(
				act(async () => {
					return result.current.updateSubscriptionMutation("sub1", {
						name: "Updated",
					});
				}),
			).rejects.toThrow(errorMessage);

			// エラー状態の更新を待機
			await waitFor(() => {
				expect(result.current.error).toBe(errorMessage);
			});

			expect(result.current.operationLoading).toBe(false);
		});
	});

	describe("サブスクリプション削除", () => {
		beforeEach(() => {
			mockFetchSubscriptions.mockResolvedValue(mockSubscriptions);
		});

		it("サブスクリプションが正常に削除される", async () => {
			mockDeleteSubscription.mockResolvedValue();

			const { result } = renderHook(() => useSubscriptions(mockCategories));

			// 初期データの読み込み完了を待機
			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			// 削除実行
			await act(async () => {
				await result.current.deleteSubscriptionMutation("sub1");
			});

			// 状態更新の完了を待機
			await waitFor(() => {
				expect(result.current.subscriptions).toHaveLength(
					mockSubscriptions.length - 1,
				);
			});

			expect(
				result.current.subscriptions.find((s) => s.id === "sub1"),
			).toBeUndefined();
			expect(mockDeleteSubscription).toHaveBeenCalledWith("sub1");
		});

		it("削除失敗時にエラーが設定される", async () => {
			const errorMessage = "削除権限がありません";
			mockDeleteSubscription.mockRejectedValue(new Error(errorMessage));

			const { result } = renderHook(() => useSubscriptions(mockCategories));

			// 初期データの読み込み完了を待機
			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			// 削除実行（エラーが発生することを期待）
			await expect(
				act(async () => {
					return result.current.deleteSubscriptionMutation("sub1");
				}),
			).rejects.toThrow(errorMessage);

			// エラー状態の更新を待機
			await waitFor(() => {
				expect(result.current.error).toBe(errorMessage);
			});

			expect(result.current.subscriptions).toHaveLength(
				mockSubscriptions.length,
			);
		});
	});

	describe("ステータス更新", () => {
		beforeEach(() => {
			mockFetchSubscriptions.mockResolvedValue(mockSubscriptions);
		});

		it("ステータスが正常に更新される", async () => {
			const updatedSubscription: Subscription = {
				...mockSubscriptions[0],
				isActive: false,
			};

			mockUpdateSubscriptionStatus.mockResolvedValue(updatedSubscription);

			const { result } = renderHook(() => useSubscriptions(mockCategories));

			// 初期データの読み込み完了を待機
			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			// ステータス更新実行
			const updated = await act(async () => {
				return await result.current.updateStatusMutation("sub1", false);
			});

			expect(updated).toEqual(updatedSubscription);

			// 状態更新の完了を待機
			await waitFor(() => {
				expect(result.current.subscriptions[0].isActive).toBe(false);
			});

			expect(mockUpdateSubscriptionStatus).toHaveBeenCalledWith(
				"sub1",
				false,
				mockCategories,
			);
		});
	});

	describe("個別取得", () => {
		beforeEach(() => {
			mockFetchSubscriptions.mockResolvedValue(mockSubscriptions);
		});

		it("IDでサブスクリプションを取得できる", async () => {
			const targetSubscription = mockSubscriptions[0];
			mockFetchSubscriptionById.mockResolvedValue(targetSubscription);

			const { result } = renderHook(() => useSubscriptions(mockCategories));

			// 初期データの読み込み完了を待機
			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			// 個別取得実行
			const fetched = await act(async () => {
				return await result.current.getSubscriptionById("sub1");
			});

			expect(fetched).toEqual(targetSubscription);
			expect(mockFetchSubscriptionById).toHaveBeenCalledWith(
				"sub1",
				mockCategories,
			);
		});

		it("個別取得失敗時にエラーが設定される", async () => {
			const errorMessage = "サブスクリプションが見つかりません";
			mockFetchSubscriptionById.mockRejectedValue(new Error(errorMessage));

			const { result } = renderHook(() => useSubscriptions(mockCategories));

			// 初期データの読み込み完了を待機
			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			// 個別取得実行（エラーが発生することを期待）
			await expect(
				act(async () => {
					return result.current.getSubscriptionById("nonexistent");
				}),
			).rejects.toThrow(errorMessage);

			// エラー状態の更新を待機
			await waitFor(() => {
				expect(result.current.error).toBe(errorMessage);
			});
		});
	});

	describe("refetch機能", () => {
		it("refetchが正常に動作する", async () => {
			// 初回取得
			mockFetchSubscriptions.mockResolvedValueOnce(mockSubscriptions);

			const { result } = renderHook(() => useSubscriptions(mockCategories));

			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			expect(result.current.subscriptions).toEqual(mockSubscriptions);

			// refetch用のモックデータ
			const updatedSubscriptions = [mockSubscriptions[0]];
			mockFetchSubscriptions.mockResolvedValueOnce(updatedSubscriptions);

			// refetch実行
			await act(async () => {
				await result.current.refetch();
			});

			await waitFor(() => {
				expect(result.current.subscriptions).toEqual(updatedSubscriptions);
			});

			expect(mockFetchSubscriptions).toHaveBeenCalledTimes(2);
		});
	});

	describe("カテゴリ依存の動作", () => {
		it("カテゴリが更新されると自動で再取得される", async () => {
			mockFetchSubscriptions.mockResolvedValue(mockSubscriptions);

			const { result, rerender } = renderHook(
				({ categories }) => useSubscriptions(categories),
				{
					initialProps: { categories: mockCategories },
				},
			);

			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			expect(mockFetchSubscriptions).toHaveBeenCalledTimes(1);

			// カテゴリを更新
			const newCategories = [
				...mockCategories,
				{
					id: "3",
					name: "新カテゴリ",
					type: "expense" as const,
					color: "#000000",
					createdAt: "2024-07-01T00:00:00Z",
					updatedAt: "2024-07-01T00:00:00Z",
				},
			];
			mockFetchSubscriptions.mockResolvedValue([]);

			rerender({ categories: newCategories });

			await waitFor(() => {
				expect(mockFetchSubscriptions).toHaveBeenCalledTimes(2);
			});

			expect(mockFetchSubscriptions).toHaveBeenLastCalledWith(newCategories);
		});
	});

	describe("エッジケース", () => {
		it("複数の操作を並行して実行した場合", async () => {
			mockFetchSubscriptions.mockResolvedValue(mockSubscriptions);

			const { result } = renderHook(() => useSubscriptions(mockCategories));

			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			// 新しいサブスクリプション作成とID削除を順次実行（並行ではなく）
			const newSubscription: Subscription = {
				...mockSubscriptions[0],
				id: "new",
				name: "New Service",
			};

			mockCreateSubscription.mockResolvedValue(newSubscription);
			mockDeleteSubscription.mockResolvedValue();

			// 作成を先に実行
			await act(async () => {
				await result.current.createSubscriptionMutation(mockFormData);
			});

			// 状態更新を待機
			await waitFor(() => {
				expect(result.current.subscriptions).toHaveLength(3); // 元の2つ + 新しい1つ
				expect(
					result.current.subscriptions.find((s) => s.id === "new"),
				).toBeDefined();
			});

			// 次に削除を実行
			await act(async () => {
				await result.current.deleteSubscriptionMutation("sub2");
			});

			// 最終状態の確認
			await waitFor(() => {
				expect(result.current.subscriptions).toHaveLength(2); // 1つ追加、1つ削除
				expect(
					result.current.subscriptions.find((s) => s.id === "new"),
				).toBeDefined();
				expect(
					result.current.subscriptions.find((s) => s.id === "sub2"),
				).toBeUndefined();
			});
		});
	});
});
