/**
 * React統合テスト（最適化版）
 *
 * Provider、Hooks、ErrorBoundaryの基本動作を検証
 */

import { render, renderHook, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	createMockLoggerConfig,
	setupBrowserMocks,
	setupFetchMock,
} from "../../../test-utils/logger-test-helpers";
import { LoggerProvider } from "../context";
import { LoggedErrorBoundary } from "../error-boundary";
import { useComponentLogger, useLoggedCallback, useLogger } from "../hooks";
import type { BrowserLoggerConfig } from "../types";

describe("React Logger 統合テスト", () => {
	let mockFetch: ReturnType<typeof setupFetchMock>;
	let config: BrowserLoggerConfig;

	beforeEach(() => {
		vi.clearAllMocks();
		setupBrowserMocks();
		mockFetch = setupFetchMock();
		config = createMockLoggerConfig() as BrowserLoggerConfig;
	});

	describe("LoggerProvider", () => {
		it("子コンポーネントにロガーを提供する", () => {
			const TestComponent = () => {
				const logger = useLogger();
				return <div>{logger ? "Logger available" : "No logger"}</div>;
			};

			render(
				<LoggerProvider config={config}>
					<TestComponent />
				</LoggerProvider>,
			);

			expect(screen.getByText("Logger available")).toBeInTheDocument();
		});

		it("ProviderなしでuseLoggerがnullを返す", () => {
			const { result } = renderHook(() => useLogger());
			expect(result.current).toBeNull();
		});

		it("unmount時にロガーが破棄される", () => {
			const { unmount } = render(
				<LoggerProvider config={config}>
					<div>Test</div>
				</LoggerProvider>,
			);

			const destroySpy = vi.spyOn(console, "log");
			unmount();

			// destroy時のログが出力されているか確認
			expect(destroySpy).toHaveBeenCalled();
			destroySpy.mockRestore();
		});
	});

	describe("Hooks", () => {
		const wrapper = ({ children }: { children: React.ReactNode }) => (
			<LoggerProvider config={config}>{children}</LoggerProvider>
		);

		it("useComponentLogger - コンポーネント専用ロガーを提供", () => {
			const { result } = renderHook(() => useComponentLogger("TestComponent"), {
				wrapper,
			});

			expect(result.current).toBeDefined();
			expect(result.current.info).toBeInstanceOf(Function);
		});

		it("useLoggedCallback - コールバックをログ付きでラップ", async () => {
			const callback = vi.fn().mockResolvedValue("success");

			const { result } = renderHook(
				() => useLoggedCallback(callback, [], { name: "test-action" }),
				{ wrapper },
			);

			await result.current();

			expect(callback).toHaveBeenCalled();
			await waitFor(() => {
				expect(mockFetch).toHaveBeenCalled();
				const logs = JSON.parse(mockFetch.mock.calls[0][1].body).logs;
				expect(
					logs.some((log: any) => log.message.includes("test-action")),
				).toBe(true);
			});
		});

		it("useLoggedCallback - エラーをログに記録", async () => {
			const error = new Error("Test error");
			const callback = vi.fn().mockRejectedValue(error);

			const { result } = renderHook(
				() => useLoggedCallback(callback, [], { name: "failing-action" }),
				{ wrapper },
			);

			await expect(result.current()).rejects.toThrow("Test error");

			await waitFor(() => {
				expect(mockFetch).toHaveBeenCalled();
				const logs = JSON.parse(mockFetch.mock.calls[0][1].body).logs;
				expect(
					logs.some(
						(log: any) =>
							log.level === "error" && log.message.includes("failing-action"),
					),
				).toBe(true);
			});
		});
	});

	describe("ErrorBoundary", () => {
		const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
			if (shouldThrow) {
				throw new Error("Test error");
			}
			return <div>No error</div>;
		};

		it("エラーをキャッチしてログに記録", async () => {
			const onError = vi.fn();

			render(
				<LoggerProvider config={config}>
					<LoggedErrorBoundary onError={onError}>
						<ThrowError shouldThrow={true} />
					</LoggedErrorBoundary>
				</LoggerProvider>,
			);

			expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
			expect(onError).toHaveBeenCalledWith(
				expect.any(Error),
				expect.any(Object),
			);

			await waitFor(() => {
				expect(mockFetch).toHaveBeenCalled();
				const logs = JSON.parse(mockFetch.mock.calls[0][1].body).logs;
				expect(
					logs.some(
						(log: any) =>
							log.level === "error" &&
							log.message.includes("Error boundary caught error"),
					),
				).toBe(true);
			});
		});

		it("カスタムフォールバックUIを表示", () => {
			const FallbackComponent = () => <div>Custom error UI</div>;

			render(
				<LoggerProvider config={config}>
					<LoggedErrorBoundary fallback={FallbackComponent}>
						<ThrowError shouldThrow={true} />
					</LoggedErrorBoundary>
				</LoggerProvider>,
			);

			expect(screen.getByText("Custom error UI")).toBeInTheDocument();
		});

		it("リセット機能が動作する", () => {
			let _resetFn: (() => void) | undefined;

			const CustomFallback = ({ resetErrorBoundary }: any) => {
				_resetFn = resetErrorBoundary;
				return <div>Error occurred</div>;
			};

			const { rerender } = render(
				<LoggerProvider config={config}>
					<LoggedErrorBoundary fallback={CustomFallback}>
						<ThrowError shouldThrow={true} />
					</LoggedErrorBoundary>
				</LoggerProvider>,
			);

			expect(screen.getByText("Error occurred")).toBeInTheDocument();

			// エラーをクリア
			rerender(
				<LoggerProvider config={config}>
					<LoggedErrorBoundary fallback={CustomFallback}>
						<ThrowError shouldThrow={false} />
					</LoggedErrorBoundary>
				</LoggerProvider>,
			);

			expect(screen.getByText("No error")).toBeInTheDocument();
		});
	});

	describe("統合シナリオ", () => {
		it("Provider + Hooks + ErrorBoundary の連携", async () => {
			const TestApp = () => {
				const logger = useComponentLogger("TestApp");
				const [count, setCount] = React.useState(0);

				const increment = useLoggedCallback(
					async () => {
						const newCount = count + 1;
						setCount(newCount);
						if (newCount > 2) {
							throw new Error("Count too high!");
						}
					},
					[count],
					{ name: "increment-count" },
				);

				React.useEffect(() => {
					logger.info("Count changed", { count });
				}, [count, logger]);

				return (
					<div>
						<span>Count: {count}</span>
						<button type="button" onClick={increment}>
							Increment
						</button>
					</div>
				);
			};

			render(
				<LoggerProvider config={config}>
					<LoggedErrorBoundary>
						<TestApp />
					</LoggedErrorBoundary>
				</LoggerProvider>,
			);

			// 初期状態の確認
			expect(screen.getByText("Count: 0")).toBeInTheDocument();

			// カウントを増やしてエラーを発生させる
			const button = screen.getByText("Increment");

			// count = 1
			button.click();
			await waitFor(() =>
				expect(screen.getByText("Count: 1")).toBeInTheDocument(),
			);

			// count = 2
			button.click();
			await waitFor(() =>
				expect(screen.getByText("Count: 2")).toBeInTheDocument(),
			);

			// count = 3, throws error
			button.click();

			await waitFor(() => {
				expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
			});

			// ログが記録されていることを確認
			await waitFor(() => {
				const calls = mockFetch.mock.calls;
				const allLogs = calls.flatMap(
					(call: any) => JSON.parse(call[1].body).logs,
				);

				// カウント変更ログ
				expect(
					allLogs.some((log: any) => log.message.includes("Count changed")),
				).toBe(true);

				// エラーログ
				expect(
					allLogs.some(
						(log: any) =>
							log.level === "error" && log.message.includes("Count too high"),
					),
				).toBe(true);
			});
		});
	});
});
