/**
 * useDeleteSubscriptionフックのテスト
 *
 * 削除機能の基本動作、エラーハンドリング、ローディング状態、トースト通知のテストを実施
 * 既存のフックテストパターンに従って実装
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	type Mock,
	vi,
} from "vitest";
import type { DeleteResponse } from "../../lib/api/types";
import { useDeleteSubscription } from "../useDeleteSubscription";

// ToastContextのモック
vi.mock("../../contexts/ToastContext", () => ({
	useToast: vi.fn(),
}));

// APIサービスのモック
vi.mock("../../lib/api/index", () => ({
	subscriptionService: {
		deleteSubscription: vi.fn(),
	},
}));

import { useToast } from "../../contexts/ToastContext";
import { subscriptionService } from "../../lib/api/index";

describe("useDeleteSubscription", () => {
	const mockShowToast = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		(useToast as Mock).mockReturnValue({
			showToast: mockShowToast,
		});
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("初期状態", () => {
		it("初期状態が正しく設定される", () => {
			const { result } = renderHook(() => useDeleteSubscription());

			expect(result.current.isLoading).toBe(false);
			expect(result.current.error).toBeNull();
			expect(typeof result.current.deleteSubscription).toBe("function");
		});
	});

	describe("削除処理の成功", () => {
		it("削除が成功した場合、正しい値を返す", async () => {
			const mockDeleteResponse: DeleteResponse = { success: true };
			const mockDeleteSubscription =
				subscriptionService.deleteSubscription as Mock;
			mockDeleteSubscription.mockResolvedValueOnce(mockDeleteResponse);

			const { result } = renderHook(() => useDeleteSubscription());

			let deleteResult: DeleteResponse | null = null;

			await act(async () => {
				deleteResult = await result.current.deleteSubscription("sub-123");
			});

			// 削除が成功し、正しいレスポンスが返されることを確認
			expect(deleteResult).toEqual(mockDeleteResponse);
			expect(mockDeleteSubscription).toHaveBeenCalledWith("sub-123");
			expect(mockDeleteSubscription).toHaveBeenCalledTimes(1);

			// 成功後の状態確認
			expect(result.current.isLoading).toBe(false);
			expect(result.current.error).toBeNull();

			// 成功トーストが表示されることを確認
			expect(mockShowToast).toHaveBeenCalledWith(
				"サブスクリプションを削除しました",
				"success",
			);
		});

		it("削除成功時のローディング状態が適切に管理される", async () => {
			const mockDeleteResponse: DeleteResponse = { success: true };
			const mockDeleteSubscription =
				subscriptionService.deleteSubscription as Mock;

			// API呼び出しを遅延させるPromiseを作成
			let resolvePromise: (value: DeleteResponse) => void;
			const delayedPromise = new Promise<DeleteResponse>((resolve) => {
				resolvePromise = resolve;
			});
			mockDeleteSubscription.mockReturnValueOnce(delayedPromise);

			const { result } = renderHook(() => useDeleteSubscription());

			// 削除処理を開始
			const deletePromise = act(async () => {
				return result.current.deleteSubscription("sub-123");
			});

			// ローディング状態が開始されることを確認
			await waitFor(() => {
				expect(result.current.isLoading).toBe(true);
			});
			expect(result.current.error).toBeNull();

			// API呼び出しを完了
			await act(async () => {
				resolvePromise(mockDeleteResponse);
				await deletePromise;
			});

			// ローディング状態が終了することを確認
			expect(result.current.isLoading).toBe(false);
			expect(result.current.error).toBeNull();
		});
	});

	describe("削除処理のエラー", () => {
		it("APIエラーが発生した場合、適切にエラーを処理する", async () => {
			const errorMessage = "サーバーエラーが発生しました";
			const mockError = new Error(errorMessage);
			const mockDeleteSubscription =
				subscriptionService.deleteSubscription as Mock;
			mockDeleteSubscription.mockRejectedValueOnce(mockError);

			const { result } = renderHook(() => useDeleteSubscription());

			let deleteResult: DeleteResponse | null = null;

			await act(async () => {
				deleteResult = await result.current.deleteSubscription("sub-123");
			});

			// エラー時はnullが返されることを確認
			expect(deleteResult).toBeNull();

			// エラー状態が適切に設定されることを確認
			expect(result.current.isLoading).toBe(false);
			expect(result.current.error).toBe(errorMessage);

			// エラートーストが表示されることを確認
			expect(mockShowToast).toHaveBeenCalledWith(errorMessage, "error");
		});

		it("Errorオブジェクト以外のエラーが発生した場合、デフォルトメッセージを使用する", async () => {
			const mockDeleteSubscription =
				subscriptionService.deleteSubscription as Mock;
			mockDeleteSubscription.mockRejectedValueOnce("文字列エラー");

			const { result } = renderHook(() => useDeleteSubscription());

			await act(async () => {
				await result.current.deleteSubscription("sub-123");
			});

			const expectedMessage = "サブスクリプションの削除に失敗しました";
			expect(result.current.error).toBe(expectedMessage);
			expect(mockShowToast).toHaveBeenCalledWith(expectedMessage, "error");
		});

		it("ネットワークエラーの場合も適切に処理される", async () => {
			const networkError = new Error("Network Error");
			const mockDeleteSubscription =
				subscriptionService.deleteSubscription as Mock;
			mockDeleteSubscription.mockRejectedValueOnce(networkError);

			const { result } = renderHook(() => useDeleteSubscription());

			await act(async () => {
				await result.current.deleteSubscription("sub-123");
			});

			expect(result.current.error).toBe("Network Error");
			expect(mockShowToast).toHaveBeenCalledWith("Network Error", "error");
		});
	});

	describe("複数の削除処理", () => {
		it("複数のサブスクリプションを連続削除できる", async () => {
			const mockDeleteResponse: DeleteResponse = { success: true };
			const mockDeleteSubscription =
				subscriptionService.deleteSubscription as Mock;
			mockDeleteSubscription.mockResolvedValue(mockDeleteResponse);

			const { result } = renderHook(() => useDeleteSubscription());

			// 1回目の削除
			await act(async () => {
				await result.current.deleteSubscription("sub-123");
			});

			// 2回目の削除
			await act(async () => {
				await result.current.deleteSubscription("sub-456");
			});

			// 3回目の削除
			await act(async () => {
				await result.current.deleteSubscription("sub-789");
			});

			expect(mockDeleteSubscription).toHaveBeenCalledTimes(3);
			expect(mockDeleteSubscription).toHaveBeenNthCalledWith(1, "sub-123");
			expect(mockDeleteSubscription).toHaveBeenNthCalledWith(2, "sub-456");
			expect(mockDeleteSubscription).toHaveBeenNthCalledWith(3, "sub-789");

			// 成功トーストが3回表示されることを確認
			expect(mockShowToast).toHaveBeenCalledTimes(3);
		});
	});

	describe("トースト通知のテスト", () => {
		it("成功時に正しいトースト通知が表示される", async () => {
			const mockDeleteResponse: DeleteResponse = { success: true };
			const mockDeleteSubscription =
				subscriptionService.deleteSubscription as Mock;
			mockDeleteSubscription.mockResolvedValueOnce(mockDeleteResponse);

			const { result } = renderHook(() => useDeleteSubscription());

			await act(async () => {
				await result.current.deleteSubscription("sub-123");
			});

			expect(mockShowToast).toHaveBeenCalledWith(
				"サブスクリプションを削除しました",
				"success",
			);
			expect(mockShowToast).toHaveBeenCalledTimes(1);
		});

		it("エラー時に正しいトースト通知が表示される", async () => {
			const errorMessage = "削除できませんでした";
			const mockDeleteSubscription =
				subscriptionService.deleteSubscription as Mock;
			mockDeleteSubscription.mockRejectedValueOnce(new Error(errorMessage));

			const { result } = renderHook(() => useDeleteSubscription());

			await act(async () => {
				await result.current.deleteSubscription("sub-123");
			});

			expect(mockShowToast).toHaveBeenCalledWith(errorMessage, "error");
			expect(mockShowToast).toHaveBeenCalledTimes(1);
		});
	});
});
