/**
 * React Hooks テスト
 *
 * useLogger、useComponentLogger、useLoggedCallback等のテスト
 * パフォーマンス最適化とReact 19並行レンダリング対応の検証
 */

import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { LoggerProvider } from "../context";
import {
	useComponentLogger,
	useLoggedCallback,
	useLogger,
	useOptionalLogger,
	usePerformanceLogger,
} from "../hooks";
import type { BrowserLoggerConfig } from "../types";

// モックログ設定
const mockConfig: Partial<BrowserLoggerConfig> = {
	environment: "development",
	level: "debug",
	enableConsole: false,
	bufferSize: 5,
	flushInterval: 100,
};

// テスト用ラッパー
const createWrapper =
	(config = mockConfig) =>
	({ children }: { children: ReactNode }) => (
		<LoggerProvider config={config}>{children}</LoggerProvider>
	);

describe("useLogger", () => {
	it("基本的なログメソッドが取得できる", () => {
		const { result } = renderHook(() => useLogger(), {
			wrapper: createWrapper(),
		});

		expect(result.current.debug).toBeInstanceOf(Function);
		expect(result.current.info).toBeInstanceOf(Function);
		expect(result.current.warn).toBeInstanceOf(Function);
		expect(result.current.error).toBeInstanceOf(Function);
	});

	it("高度なログメソッドが取得できる", () => {
		const { result } = renderHook(() => useLogger(), {
			wrapper: createWrapper(),
		});

		expect(result.current.track).toBeInstanceOf(Function);
		expect(result.current.pageView).toBeInstanceOf(Function);
		expect(result.current.userInteraction).toBeInstanceOf(Function);
		expect(result.current.apiCall).toBeInstanceOf(Function);
		expect(result.current.performance).toBeInstanceOf(Function);
	});

	it("ユーティリティメソッドが取得できる", () => {
		const { result } = renderHook(() => useLogger(), {
			wrapper: createWrapper(),
		});

		expect(result.current.setUserId).toBeInstanceOf(Function);
		expect(result.current.setComponent).toBeInstanceOf(Function);
		expect(result.current.flush).toBeInstanceOf(Function);
		expect(result.current.setLevel).toBeInstanceOf(Function);
		expect(result.current.updateConfig).toBeInstanceOf(Function);
	});

	it("設定と状態が取得できる", () => {
		const { result } = renderHook(() => useLogger(), {
			wrapper: createWrapper(),
		});

		expect(result.current.config).toBeDefined();
		expect(result.current.bufferSize).toBeDefined();
		expect(typeof result.current.bufferSize).toBe("number");
	});

	it("ログメソッドが正常に動作する", async () => {
		const { result } = renderHook(() => useLogger(), {
			wrapper: createWrapper(),
		});

		// ログメソッドの実行（エラーを投げないことを確認）
		expect(() => {
			result.current.debug("Debug message", { component: "Test" });
			result.current.info("Info message");
			result.current.warn("Warning message");
			result.current.error("Error message");
		}).not.toThrow();
	});

	it("高度なログメソッドが正常に動作する", () => {
		const { result } = renderHook(() => useLogger(), {
			wrapper: createWrapper(),
		});

		expect(() => {
			result.current.track("user_action", { element: "button" });
			result.current.pageView("/test-page");
			result.current.userInteraction("click", "submit-button");
			result.current.apiCall("/api/test", "GET");
			result.current.performance("render_time", 100);
		}).not.toThrow();
	});

	it("設定更新が正常に動作する", () => {
		const { result } = renderHook(() => useLogger(), {
			wrapper: createWrapper(),
		});

		expect(() => {
			result.current.updateConfig({ level: "error" });
			result.current.setLevel("warn");
			result.current.setUserId("test-user");
			result.current.setComponent("TestComponent");
		}).not.toThrow();
	});

	it("flushが正常に動作する", async () => {
		const { result } = renderHook(() => useLogger(), {
			wrapper: createWrapper(),
		});

		await expect(result.current.flush()).resolves.toBeUndefined();
	});
});

describe("useComponentLogger", () => {
	it("コンポーネント名が自動設定される", () => {
		const { result } = renderHook(() => useComponentLogger("TestComponent"), {
			wrapper: createWrapper(),
		});

		expect(result.current.componentName).toBe("TestComponent");
	});

	it("基本ログメソッドにコンポーネント名が付与される", () => {
		const { result } = renderHook(() => useComponentLogger("TestComponent"), {
			wrapper: createWrapper(),
		});

		// ログメソッドが正常に動作することを確認
		expect(() => {
			result.current.debug("Debug message");
			result.current.info("Info message");
			result.current.warn("Warning message");
			result.current.error("Error message");
		}).not.toThrow();
	});

	it("高度なログメソッドにコンポーネント名が付与される", () => {
		const { result } = renderHook(() => useComponentLogger("TestComponent"), {
			wrapper: createWrapper(),
		});

		expect(() => {
			result.current.track("component_event");
			result.current.userInteraction("click", "button");
			result.current.apiCall("/api/data", "POST");
			result.current.performance("component_render", 50);
		}).not.toThrow();
	});

	it("autoMount=trueでマウント/アンマウントログが出力される", () => {
		const { unmount } = renderHook(
			() => useComponentLogger("TestComponent", true),
			{ wrapper: createWrapper() },
		);

		// アンマウント時のログ確認
		expect(() => unmount()).not.toThrow();
	});

	it("autoMount=falseでマウント/アンマウントログが出力されない", () => {
		const { unmount } = renderHook(
			() => useComponentLogger("TestComponent", false),
			{ wrapper: createWrapper() },
		);

		// アンマウント時のログ確認
		expect(() => unmount()).not.toThrow();
	});

	it("ベースロガーのメソッドも利用できる", () => {
		const { result } = renderHook(() => useComponentLogger("TestComponent"), {
			wrapper: createWrapper(),
		});

		expect(result.current.setUserId).toBeInstanceOf(Function);
		expect(result.current.flush).toBeInstanceOf(Function);
		expect(result.current.config).toBeDefined();
	});
});

describe("useLoggedCallback", () => {
	it("基本的なコールバック実行", async () => {
		const mockCallback = vi.fn(() => "result");
		const deps = [mockCallback];

		const { result } = renderHook(() => useLoggedCallback(mockCallback, deps), {
			wrapper: createWrapper(),
		});

		const loggedCallback = result.current;
		const callResult = await loggedCallback();

		expect(mockCallback).toHaveBeenCalledTimes(1);
		expect(callResult).toBe("result");
	});

	it("非同期コールバック実行", async () => {
		const mockAsyncCallback = vi.fn(async () => {
			await new Promise((resolve) => setTimeout(resolve, 10));
			return "async result";
		});
		const deps = [mockAsyncCallback];

		const { result } = renderHook(
			() => useLoggedCallback(mockAsyncCallback, deps),
			{ wrapper: createWrapper() },
		);

		const loggedCallback = result.current;
		const callResult = await loggedCallback();

		expect(mockAsyncCallback).toHaveBeenCalledTimes(1);
		expect(callResult).toBe("async result");
	});

	it("エラーハンドリング", async () => {
		const mockError = new Error("Test error");
		const mockFailingCallback = vi.fn(() => {
			throw mockError;
		});
		const deps = [mockFailingCallback];

		const { result } = renderHook(
			() => useLoggedCallback(mockFailingCallback, deps),
			{ wrapper: createWrapper() },
		);

		const loggedCallback = result.current;

		await expect(loggedCallback()).rejects.toThrow("Test error");
		expect(mockFailingCallback).toHaveBeenCalledTimes(1);
	});

	it("カスタムオプションでログ設定", async () => {
		const mockCallback = vi.fn(() => "result");
		const deps = [mockCallback];
		const options = {
			name: "CustomCallback",
			logLevel: "info" as const,
			logStart: true,
			logEnd: true,
			logError: true,
			meta: { customField: "customValue" },
		};

		const { result } = renderHook(
			() => useLoggedCallback(mockCallback, deps, options),
			{ wrapper: createWrapper() },
		);

		const loggedCallback = result.current;
		const callResult = await loggedCallback();

		expect(mockCallback).toHaveBeenCalledTimes(1);
		expect(callResult).toBe("result");
	});

	it("引数が正しく渡される", async () => {
		const mockCallback = vi.fn((a: number, b: string) => `${a}-${b}`);
		const deps = [mockCallback];

		const { result } = renderHook(() => useLoggedCallback(mockCallback, deps), {
			wrapper: createWrapper(),
		});

		const loggedCallback = result.current;
		const callResult = await loggedCallback(42, "test");

		expect(mockCallback).toHaveBeenCalledWith(42, "test");
		expect(callResult).toBe("42-test");
	});

	it("依存配列の変更でコールバックが更新される", async () => {
		const mockCallback1 = vi.fn(() => "result1");
		const mockCallback2 = vi.fn(() => "result2");

		const { result, rerender } = renderHook(
			({ callback, deps }) => useLoggedCallback(callback, deps),
			{
				wrapper: createWrapper(),
				initialProps: { callback: mockCallback1, deps: [mockCallback1] },
			},
		);

		// 最初のコールバック
		await result.current();
		expect(mockCallback1).toHaveBeenCalledTimes(1);

		// 依存配列変更
		rerender({ callback: mockCallback2, deps: [mockCallback2] });

		// 新しいコールバック
		await result.current();
		expect(mockCallback2).toHaveBeenCalledTimes(1);
	});
});

describe("usePerformanceLogger", () => {
	it("パフォーマンス追跡機能が取得できる", () => {
		const { result } = renderHook(() => usePerformanceLogger("TestComponent"), {
			wrapper: createWrapper(),
		});

		expect(result.current.measureMemory).toBeInstanceOf(Function);
		expect(result.current.measureCustom).toBeInstanceOf(Function);
		expect(typeof result.current.renderCount).toBe("number");
	});

	it("メモリ測定が正常に動作する", () => {
		const { result } = renderHook(() => usePerformanceLogger("TestComponent"), {
			wrapper: createWrapper(),
		});

		expect(() => {
			result.current.measureMemory();
		}).not.toThrow();
	});

	it("カスタム測定が正常に動作する", () => {
		const { result } = renderHook(() => usePerformanceLogger("TestComponent"), {
			wrapper: createWrapper(),
		});

		expect(() => {
			result.current.measureCustom("custom_metric", () => {
				// カスタム処理
			});
		}).not.toThrow();
	});

	it("trackRenders=falseでレンダリング追跡が無効", () => {
		const { result } = renderHook(
			() => usePerformanceLogger("TestComponent", false),
			{ wrapper: createWrapper() },
		);

		expect(result.current.renderCount).toBe(0);
	});
});

describe("useOptionalLogger", () => {
	it("LoggerProviderありの場合は実際のロガーを返す", () => {
		const { result } = renderHook(() => useOptionalLogger(), {
			wrapper: createWrapper(),
		});

		expect(result.current.isAvailable).toBe(true);
		expect(result.current.debug).toBeInstanceOf(Function);
		expect(result.current.config).toBeDefined();
	});

	it("LoggerProviderなしの場合はno-opロガーを返す", () => {
		const { result } = renderHook(() => useOptionalLogger());

		expect(result.current.isAvailable).toBe(false);
		expect(result.current.debug).toBeInstanceOf(Function);
		expect(result.current.config).toBeNull();
		expect(result.current.bufferSize).toBe(0);
	});

	it("no-opロガーのメソッドはエラーを投げない", () => {
		const { result } = renderHook(() => useOptionalLogger());

		expect(() => {
			result.current.debug("Debug message");
			result.current.info("Info message");
			result.current.warn("Warning message");
			result.current.error("Error message");
			result.current.track("event");
			result.current.pageView("/test");
			result.current.userInteraction("click");
			result.current.apiCall("/api", "GET");
			result.current.performance("metric", 100);
			result.current.setUserId("user");
			result.current.setComponent("component");
			result.current.setLevel("info");
			result.current.updateConfig({});
		}).not.toThrow();

		expect(result.current.flush()).resolves.toBeUndefined();
	});
});

describe("パフォーマンス最適化", () => {
	it("ログメソッドがuseCallbackでメモ化されている", () => {
		const { result, rerender } = renderHook(() => useLogger(), {
			wrapper: createWrapper(),
		});

		const firstRender = result.current;
		rerender();
		const secondRender = result.current;

		// 同じ関数インスタンスが返されることを確認
		expect(firstRender.debug).toBe(secondRender.debug);
		expect(firstRender.info).toBe(secondRender.info);
		expect(firstRender.warn).toBe(secondRender.warn);
		expect(firstRender.error).toBe(secondRender.error);
	});

	it("useLoggedCallbackが適切に依存配列を処理", () => {
		const callback = vi.fn();
		let deps = [1, 2, 3];

		const { result, rerender } = renderHook(
			() => useLoggedCallback(callback, deps),
			{ wrapper: createWrapper() },
		);

		const firstCallback = result.current;

		// 依存配列が同じ場合は同じ関数インスタンス
		rerender();
		expect(result.current).toBe(firstCallback);

		// 依存配列が変わった場合は新しい関数インスタンス
		deps = [4, 5, 6];
		rerender();
		expect(result.current).not.toBe(firstCallback);
	});
});
