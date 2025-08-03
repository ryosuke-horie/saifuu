/**
 * useIncomeFilters フックのテスト
 *
 * パフォーマンス最適化されたフィルター機能の動作を検証
 */

import { act, renderHook } from "@testing-library/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useIncomeFilters } from "./useIncomeFilters";

// Next.js navigationモジュールをモック
vi.mock("next/navigation", () => ({
	useRouter: vi.fn(),
	usePathname: vi.fn(),
	useSearchParams: vi.fn(),
}));

describe("useIncomeFilters", () => {
	const mockPush = vi.fn();
	const mockReplace = vi.fn();
	const mockRouter = { push: mockPush, replace: mockReplace };
	const mockPathname = "/income";

	beforeEach(() => {
		vi.useFakeTimers();
		vi.mocked(useRouter).mockReturnValue(mockRouter as any);
		vi.mocked(usePathname).mockReturnValue(mockPathname);
		vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams() as any);
	});

	afterEach(() => {
		vi.clearAllMocks();
		vi.clearAllTimers();
		vi.useRealTimers();
	});

	describe("パフォーマンス最適化", () => {
		it("URL更新がdebounceされる（300ms遅延）", async () => {
			// given: フックをレンダリング
			const { result } = renderHook(() => useIncomeFilters());

			// when: フィルターを更新
			act(() => {
				result.current.updateFilter("period", "thisMonth");
			});

			// then: 即座にはURL更新されない
			expect(mockReplace).not.toHaveBeenCalled();

			// when: 299ms経過
			act(() => {
				vi.advanceTimersByTime(299);
			});

			// then: まだURL更新されない
			expect(mockReplace).not.toHaveBeenCalled();

			// when: 300ms経過
			act(() => {
				vi.advanceTimersByTime(1);
			});

			// then: URL更新が実行される
			expect(mockReplace).toHaveBeenCalledTimes(1);
			expect(mockReplace).toHaveBeenCalledWith("/income?period=thisMonth");
		});

		it("連続したフィルター更新では最後の値のみがURLに反映される", () => {
			// given: フックをレンダリング
			const { result } = renderHook(() => useIncomeFilters());

			// when: 連続してフィルターを更新
			act(() => {
				result.current.updateFilter("period", "thisMonth");
			});
			act(() => {
				vi.advanceTimersByTime(100);
				result.current.updateFilter("period", "lastMonth");
			});
			act(() => {
				vi.advanceTimersByTime(100);
				result.current.updateFilter("period", "thisYear");
			});

			// then: まだURL更新されない
			expect(mockReplace).not.toHaveBeenCalled();

			// when: 300ms経過
			act(() => {
				vi.advanceTimersByTime(300);
			});

			// then: 最後の値でURL更新される
			expect(mockReplace).toHaveBeenCalledTimes(1);
			expect(mockReplace).toHaveBeenCalledWith("/income?period=thisYear");
		});

		it("複数のフィルター変更でもパフォーマンス最適化が機能する", () => {
			// given: コールバック関数付きでフックをレンダリング
			const mockCallback = vi.fn();
			const { result } = renderHook(() =>
				useIncomeFilters({ onFiltersChange: mockCallback }),
			);

			// when: 複数のフィルターを短時間で更新
			act(() => {
				result.current.updateFilter("period", "thisMonth");
				result.current.updateFilter("minAmount", 1000);
				result.current.updateFilter("maxAmount", 5000);
				result.current.toggleCategory("food");
			});

			// then: コールバックは1回のみ実行（throttle）
			expect(mockCallback).toHaveBeenCalledTimes(1);

			// then: URL更新はまだ実行されない（debounce）
			expect(mockReplace).not.toHaveBeenCalled();

			// when: 300ms経過（debounce解除）
			act(() => {
				vi.advanceTimersByTime(300);
			});

			// then: URL更新が実行される
			expect(mockReplace).toHaveBeenCalledTimes(1);
			const urlCall = mockReplace.mock.calls[0][0];
			expect(urlCall).toContain("period=thisMonth");
			expect(urlCall).toContain("minAmount=1000");
			expect(urlCall).toContain("maxAmount=5000");
			expect(urlCall).toContain("categories=food");
		});
	});

	describe("基本機能の動作確認", () => {
		it("disableUrlSync=trueの場合、URL更新が無効化される", () => {
			// given: URL同期を無効化してフックをレンダリング
			const { result } = renderHook(() =>
				useIncomeFilters({ disableUrlSync: true }),
			);

			// when: フィルターを更新
			act(() => {
				result.current.updateFilter("period", "thisMonth");
			});

			// when: debounce時間経過
			act(() => {
				vi.advanceTimersByTime(300);
			});

			// then: URL更新が実行されない
			expect(mockReplace).not.toHaveBeenCalled();
		});

		it("resetFiltersで全フィルターがリセットされる", () => {
			// given: フィルターを設定済みのフック
			const { result } = renderHook(() => useIncomeFilters());
			act(() => {
				result.current.updateFilter("period", "thisMonth");
				result.current.updateFilter("minAmount", 1000);
				result.current.toggleCategory("food");
			});

			// when: フィルターをリセット
			act(() => {
				result.current.resetFilters();
			});

			// then: 全フィルターがクリアされる
			expect(result.current.filters).toEqual({});
			expect(result.current.selectedCategories).toEqual([]);

			// when: debounce時間経過
			act(() => {
				vi.advanceTimersByTime(300);
			});

			// then: URLもリセットされる
			expect(mockReplace).toHaveBeenLastCalledWith(mockPathname);
		});
	});
});
