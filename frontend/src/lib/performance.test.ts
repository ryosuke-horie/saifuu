/**
 * performance.ts のテスト
 *
 * debounceとthrottle関数の動作を検証
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { debounce, throttle } from "./performance";

describe("performance utilities", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.clearAllTimers();
		vi.useRealTimers();
	});

	describe("debounce", () => {
		it("指定された遅延時間後に関数を実行する", () => {
			// given: モック関数とdebounce関数を準備
			const mockFn = vi.fn();
			const debouncedFn = debounce(mockFn, 300);

			// when: debounced関数を実行
			debouncedFn("test");

			// then: 即座には実行されない
			expect(mockFn).not.toHaveBeenCalled();

			// when: 300ms経過後
			vi.advanceTimersByTime(300);

			// then: 関数が実行される
			expect(mockFn).toHaveBeenCalledWith("test");
			expect(mockFn).toHaveBeenCalledTimes(1);
		});

		it("連続した呼び出しでは最後の呼び出しのみが実行される", () => {
			// given: モック関数とdebounce関数を準備
			const mockFn = vi.fn();
			const debouncedFn = debounce(mockFn, 300);

			// when: 連続して3回呼び出し
			debouncedFn("first");
			vi.advanceTimersByTime(100);
			debouncedFn("second");
			vi.advanceTimersByTime(100);
			debouncedFn("third");

			// then: まだ実行されていない
			expect(mockFn).not.toHaveBeenCalled();

			// when: 300ms経過後
			vi.advanceTimersByTime(300);

			// then: 最後の呼び出しのみが実行される
			expect(mockFn).toHaveBeenCalledWith("third");
			expect(mockFn).toHaveBeenCalledTimes(1);
		});

		it("複数の引数を正しく渡す", () => {
			// given: 複数引数を受け取るモック関数
			const mockFn = vi.fn();
			const debouncedFn = debounce(mockFn, 300);

			// when: 複数の引数で呼び出し
			debouncedFn("arg1", "arg2", "arg3");
			vi.advanceTimersByTime(300);

			// then: すべての引数が正しく渡される
			expect(mockFn).toHaveBeenCalledWith("arg1", "arg2", "arg3");
		});
	});

	describe("throttle", () => {
		it("最初の呼び出しは即座に実行される", () => {
			// given: モック関数とthrottle関数を準備
			const mockFn = vi.fn();
			const throttledFn = throttle(mockFn, 500);

			// when: throttled関数を実行
			throttledFn("first");

			// then: 即座に実行される
			expect(mockFn).toHaveBeenCalledWith("first");
			expect(mockFn).toHaveBeenCalledTimes(1);
		});

		it("指定間隔内の呼び出しは制限される", () => {
			// given: モック関数とthrottle関数を準備
			const mockFn = vi.fn();
			const throttledFn = throttle(mockFn, 500);

			// when: 連続して呼び出し
			throttledFn("first");
			throttledFn("second");
			throttledFn("third");

			// then: 最初の呼び出しのみが実行される
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenCalledWith("first");

			// when: 500ms経過後
			vi.advanceTimersByTime(500);

			// then: 最後の呼び出しが実行される
			expect(mockFn).toHaveBeenCalledTimes(2);
			expect(mockFn).toHaveBeenLastCalledWith("third");
		});

		it("間隔を空けた呼び出しは両方実行される", () => {
			// given: モック関数とthrottle関数を準備
			const mockFn = vi.fn();
			const throttledFn = throttle(mockFn, 500);

			// when: 最初の呼び出し
			throttledFn("first");
			expect(mockFn).toHaveBeenCalledWith("first");

			// when: 500ms経過後に2回目の呼び出し
			vi.advanceTimersByTime(500);
			throttledFn("second");

			// then: 両方の呼び出しが実行される
			expect(mockFn).toHaveBeenCalledTimes(2);
			expect(mockFn).toHaveBeenCalledWith("first");
			expect(mockFn).toHaveBeenCalledWith("second");
		});

		it("thisコンテキストを正しく保持する", () => {
			// given: thisを使用するモック関数
			const obj = {
				value: "test",
				method: vi.fn(function (this: any) {
					return this.value;
				}),
			};
			const throttledMethod = throttle(obj.method, 500);

			// when: オブジェクトのコンテキストで呼び出し
			throttledMethod.call(obj);

			// then: thisコンテキストが保持される
			expect(obj.method).toHaveBeenCalled();
			expect(obj.method.mock.instances[0]).toBe(obj);
		});
	});
});
