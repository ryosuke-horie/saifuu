/**
 * エラーバウンダリテスト
 *
 * LoggedErrorBoundary、withErrorBoundary HOC、useErrorHandlerのテスト
 * React Error Boundaryの動作とログ統合機能の検証
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ReactNode, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { LoggerProvider } from "../context";
import {
	DefaultErrorFallback,
	ErrorBoundaryPresets,
	type ErrorFallbackProps,
	LoggedErrorBoundary,
	useErrorHandler,
	withErrorBoundary,
} from "../error-boundary";
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

// エラーを投げるテストコンポーネント
const ThrowingComponent = ({
	shouldThrow = false,
	message = "Test error",
}: {
	shouldThrow?: boolean;
	message?: string;
}) => {
	if (shouldThrow) {
		throw new Error(message);
	}
	return <div data-testid="working-component">Working component</div>;
};

// 動的にエラーを投げるコンポーネント
const ConditionalThrowingComponent = () => {
	const [shouldThrow, setShouldThrow] = useState(false);

	if (shouldThrow) {
		throw new Error("User triggered error");
	}

	return (
		<div>
			<div data-testid="working-component">Working component</div>
			<button
				type="button"
				data-testid="throw-error"
				onClick={() => setShouldThrow(true)}
			>
				Throw Error
			</button>
		</div>
	);
};

// カスタムエラーフォールバック
const CustomErrorFallback = ({
	error,
	retry,
	canRetry,
}: ErrorFallbackProps) => (
	<div data-testid="custom-fallback">
		<h2>Custom Error: {error.message}</h2>
		{canRetry && (
			<button type="button" data-testid="custom-retry" onClick={retry}>
				Custom Retry
			</button>
		)}
	</div>
);

describe("LoggedErrorBoundary", () => {
	// コンソールエラーを抑制
	const originalConsoleError = console.error;
	beforeAll(() => {
		console.error = vi.fn();
	});
	afterAll(() => {
		console.error = originalConsoleError;
	});

	it("エラーがない場合は子コンポーネントを正常表示", () => {
		const Wrapper = createWrapper();

		render(
			<Wrapper>
				<LoggedErrorBoundary>
					<ThrowingComponent shouldThrow={false} />
				</LoggedErrorBoundary>
			</Wrapper>,
		);

		expect(screen.getByTestId("working-component")).toBeInTheDocument();
	});




	it("再試行機能が動作する", async () => {
		const user = userEvent.setup();
		const Wrapper = createWrapper();

		render(
			<Wrapper>
				<LoggedErrorBoundary enableRetry={true} maxRetries={2}>
					<ConditionalThrowingComponent />
				</LoggedErrorBoundary>
			</Wrapper>,
		);

		// 正常な状態を確認
		expect(screen.getByTestId("working-component")).toBeInTheDocument();

		// エラーをトリガー
		await user.click(screen.getByTestId("throw-error"));

		// エラーUI表示を確認
		expect(screen.getByText("⚠️ エラーが発生しました")).toBeInTheDocument();

		// 再試行ボタンの存在確認
		const retryButton = screen.getByText(/再試行/);
		expect(retryButton).toBeInTheDocument();

		// 再試行実行
		await user.click(retryButton);

		// コンポーネントが復旧することを確認
		expect(screen.getByTestId("working-component")).toBeInTheDocument();
	});





});

describe("DefaultErrorFallback", () => {
	it("デフォルトエラーUIが正しく表示される", () => {
		const mockProps: ErrorFallbackProps = {
			error: new Error("Test error message"),
			errorInfo: { componentStack: "TestStack" },
			errorId: "test-error-id",
			retry: vi.fn(),
			retryCount: 1,
			maxRetries: 3,
			canRetry: true,
			componentName: "TestComponent",
		};

		render(<DefaultErrorFallback {...mockProps} />);

		expect(screen.getByText("⚠️ エラーが発生しました")).toBeInTheDocument();
		expect(
			screen.getByText("コンポーネント: TestComponent"),
		).toBeInTheDocument();
		expect(screen.getByText(/エラーID: test-error-id/)).toBeInTheDocument();
		expect(screen.getByText(/再試行回数: 1\/3/)).toBeInTheDocument();
		expect(screen.getByText(/Test error message/)).toBeInTheDocument();
	});

	it("再試行ボタンが動作する", async () => {
		const user = userEvent.setup();
		const mockRetry = vi.fn();
		const mockProps: ErrorFallbackProps = {
			error: new Error("Test error"),
			errorInfo: { componentStack: "TestStack" },
			errorId: "test-error-id",
			retry: mockRetry,
			retryCount: 0,
			maxRetries: 3,
			canRetry: true,
		};

		render(<DefaultErrorFallback {...mockProps} />);

		const retryButton = screen.getByText(/再試行/);
		await user.click(retryButton);

		expect(mockRetry).toHaveBeenCalledTimes(1);
	});

	it("ページ再読み込みボタンが動作する", async () => {
		const user = userEvent.setup();
		const mockReload = vi.fn();

		// window.location.reloadをモック
		Object.defineProperty(window, "location", {
			value: { reload: mockReload },
			writable: true,
		});

		const mockProps: ErrorFallbackProps = {
			error: new Error("Test error"),
			errorInfo: { componentStack: "TestStack" },
			errorId: "test-error-id",
			retry: vi.fn(),
			retryCount: 0,
			maxRetries: 3,
			canRetry: false,
		};

		render(<DefaultErrorFallback {...mockProps} />);

		const reloadButton = screen.getByText("ページを再読み込み");
		await user.click(reloadButton);

		expect(mockReload).toHaveBeenCalledTimes(1);
	});
});

describe("withErrorBoundary HOC", () => {
	it("コンポーネントをエラーバウンダリでラップ", () => {
		const TestComponent = ({ shouldError }: { shouldError: boolean }) => (
			<ThrowingComponent shouldThrow={shouldError} />
		);

		const WrappedComponent = withErrorBoundary(TestComponent, {
			componentName: "WrappedTest",
			enableRetry: false,
		});

		const Wrapper = createWrapper();

		render(
			<Wrapper>
				<WrappedComponent shouldError={false} />
			</Wrapper>,
		);

		expect(screen.getByTestId("working-component")).toBeInTheDocument();
	});


	it("displayNameが正しく設定される", () => {
		const TestComponent = () => <div>Test</div>;
		TestComponent.displayName = "TestComponent";

		const WrappedComponent = withErrorBoundary(TestComponent);

		expect(WrappedComponent.displayName).toBe(
			"withErrorBoundary(TestComponent)",
		);
	});
});

describe("useErrorHandler", () => {
	it("エラーハンドラが取得できる", () => {
		const TestComponent = () => {
			const handleError = useErrorHandler();

			return (
				<button
					type="button"
					data-testid="handle-error"
					onClick={() => handleError(new Error("Manual error"))}
				>
					Handle Error
				</button>
			);
		};

		const Wrapper = createWrapper();

		render(
			<Wrapper>
				<TestComponent />
			</Wrapper>,
		);

		expect(screen.getByTestId("handle-error")).toBeInTheDocument();
	});

	it("LoggerProviderなしでもエラーを投げない", () => {
		const TestComponent = () => {
			const handleError = useErrorHandler();

			return (
				<button
					type="button"
					data-testid="handle-error"
					onClick={() => handleError(new Error("Manual error"))}
				>
					Handle Error
				</button>
			);
		};

		render(<TestComponent />);

		expect(screen.getByTestId("handle-error")).toBeInTheDocument();
	});
});

describe("ErrorBoundaryPresets", () => {
	it("development プリセットが正しい設定", () => {
		expect(ErrorBoundaryPresets.development).toEqual({
			logLevel: "error",
			enableRetry: false,
			maxRetries: 0,
			resetOnPropsChange: true,
		});
	});

	it("production プリセットが正しい設定", () => {
		expect(ErrorBoundaryPresets.production).toEqual({
			logLevel: "error",
			enableRetry: true,
			maxRetries: 3,
			resetOnPropsChange: false,
		});
	});

	it("storybook プリセットが正しい設定", () => {
		expect(ErrorBoundaryPresets.storybook).toEqual({
			logLevel: "warn",
			enableRetry: true,
			maxRetries: 1,
			resetOnPropsChange: true,
		});
	});

});
