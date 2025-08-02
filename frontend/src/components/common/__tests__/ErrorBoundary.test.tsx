/**
 * ErrorBoundaryコンポーネントのテスト
 *
 * エラーバウンダリの機能を包括的にテストする
 * - エラー分類ロジック
 * - リトライ機能
 * - 開発/本番モードの表示
 * - カスタムフォールバックUI
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Component, type ReactNode, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	classifyError,
	DefaultErrorFallback,
	ErrorBoundary,
	type ErrorFallbackProps,
	ErrorType,
} from "../ErrorBoundary";

// エラーをスローするテスト用コンポーネント
class ThrowError extends Component<{
	error?: Error;
	shouldThrow?: boolean;
	children?: ReactNode;
}> {
	componentDidMount() {
		if (this.props.shouldThrow && this.props.error) {
			throw this.props.error;
		}
	}

	render() {
		if (this.props.shouldThrow && this.props.error) {
			throw this.props.error;
		}
		return <div>{this.props.children || "正常なコンテンツ"}</div>;
	}
}

// console.errorをモック化してテスト時のエラー出力を抑制
const originalConsoleError = console.error;

beforeEach(() => {
	console.error = vi.fn();
});

afterEach(() => {
	console.error = originalConsoleError;
	vi.clearAllMocks();
});

describe("classifyError関数", () => {
	describe("ネットワークエラーの分類", () => {
		it("NetworkErrorを正しく分類する", () => {
			const error = new Error("Network error occurred");
			error.name = "NetworkError";
			expect(classifyError(error)).toBe(ErrorType.NETWORK);
		});

		it("fetch関連のエラーを正しく分類する", () => {
			const error = new Error("Failed to fetch data");
			expect(classifyError(error)).toBe(ErrorType.NETWORK);
		});

		it("connection関連のエラーを正しく分類する", () => {
			const error = new Error("Connection refused");
			expect(classifyError(error)).toBe(ErrorType.NETWORK);
		});
	});

	describe("バリデーションエラーの分類", () => {
		it("ValidationErrorを正しく分類する", () => {
			const error = new Error("Validation failed");
			error.name = "ValidationError";
			expect(classifyError(error)).toBe(ErrorType.VALIDATION);
		});

		it("ZodErrorを正しく分類する", () => {
			const error = new Error("Invalid data");
			error.name = "ZodError";
			expect(classifyError(error)).toBe(ErrorType.VALIDATION);
		});

		it("invalid関連のエラーを正しく分類する", () => {
			const error = new Error("Invalid input provided");
			expect(classifyError(error)).toBe(ErrorType.VALIDATION);
		});
	});

	describe("サーバーエラーの分類", () => {
		it("500エラーを正しく分類する", () => {
			const error = new Error("500 Internal Server Error");
			expect(classifyError(error)).toBe(ErrorType.SERVER);
		});

		it("502エラーを正しく分類する", () => {
			const error = new Error("502 Bad Gateway");
			expect(classifyError(error)).toBe(ErrorType.SERVER);
		});

		it("503エラーを正しく分類する", () => {
			const error = new Error("503 Service Unavailable");
			expect(classifyError(error)).toBe(ErrorType.SERVER);
		});

		it("504エラーを正しく分類する", () => {
			const error = new Error("504 Gateway Timeout");
			expect(classifyError(error)).toBe(ErrorType.SERVER);
		});

		it("server関連のエラーを正しく分類する", () => {
			const error = new Error("Server is down");
			expect(classifyError(error)).toBe(ErrorType.SERVER);
		});
	});

	describe("不明なエラーの分類", () => {
		it("分類できないエラーはUNKNOWNとして分類する", () => {
			const error = new Error("Something went wrong");
			expect(classifyError(error)).toBe(ErrorType.UNKNOWN);
		});

		it("空のエラーメッセージはUNKNOWNとして分類する", () => {
			const error = new Error("");
			expect(classifyError(error)).toBe(ErrorType.UNKNOWN);
		});
	});
});

describe("DefaultErrorFallback", () => {
	const defaultProps: ErrorFallbackProps = {
		error: new Error("テストエラー"),
		errorType: ErrorType.UNKNOWN,
		resetError: vi.fn(),
		showDetails: false,
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("基本的な表示", () => {
		it("エラーメッセージが表示される", () => {
			render(<DefaultErrorFallback {...defaultProps} />);
			expect(screen.getByText("エラーが発生しました")).toBeInTheDocument();
			expect(
				screen.getByText(
					"予期しないエラーが発生しました。問題が解決しない場合は、サポートにお問い合わせください。",
				),
			).toBeInTheDocument();
		});

		it("ネットワークエラーの場合、適切なメッセージが表示される", () => {
			render(
				<DefaultErrorFallback
					{...defaultProps}
					errorType={ErrorType.NETWORK}
				/>,
			);
			expect(screen.getByText("ネットワークエラー")).toBeInTheDocument();
			expect(
				screen.getByText(
					"インターネット接続を確認してください。問題が解決しない場合は、しばらく待ってから再度お試しください。",
				),
			).toBeInTheDocument();
		});

		it("バリデーションエラーの場合、適切なメッセージが表示される", () => {
			render(
				<DefaultErrorFallback
					{...defaultProps}
					errorType={ErrorType.VALIDATION}
				/>,
			);
			expect(screen.getByText("入力エラー")).toBeInTheDocument();
			expect(
				screen.getByText(
					"入力内容に問題があります。フォームの内容を確認してください。",
				),
			).toBeInTheDocument();
		});

		it("サーバーエラーの場合、適切なメッセージが表示される", () => {
			render(
				<DefaultErrorFallback {...defaultProps} errorType={ErrorType.SERVER} />,
			);
			expect(screen.getByText("サーバーエラー")).toBeInTheDocument();
			expect(
				screen.getByText(
					"サーバーで問題が発生しました。しばらく待ってから再度お試しください。",
				),
			).toBeInTheDocument();
		});
	});

	describe("再試行機能", () => {
		it("再試行ボタンが表示される", () => {
			render(<DefaultErrorFallback {...defaultProps} />);
			expect(screen.getByText("再試行")).toBeInTheDocument();
		});

		it("再試行ボタンをクリックするとresetError関数が呼ばれる", () => {
			const resetError = vi.fn();
			render(
				<DefaultErrorFallback {...defaultProps} resetError={resetError} />,
			);

			const retryButton = screen.getByText("再試行");
			fireEvent.click(retryButton);

			expect(resetError).toHaveBeenCalledTimes(1);
		});
	});

	describe("エラー詳細の表示", () => {
		it("showDetails=falseの場合、詳細は表示されない", () => {
			render(<DefaultErrorFallback {...defaultProps} showDetails={false} />);
			expect(screen.queryByText("エラー詳細")).not.toBeInTheDocument();
			expect(screen.queryByText("エラーを報告")).not.toBeInTheDocument();
		});

		it("showDetails=trueの場合、詳細ボタンが表示される", () => {
			render(<DefaultErrorFallback {...defaultProps} showDetails={true} />);
			expect(screen.getByText("エラー詳細")).toBeInTheDocument();
			expect(screen.getByText("エラーを報告")).toBeInTheDocument();
		});

		it("詳細ボタンをクリックすると詳細が表示される", () => {
			const error = new Error("詳細なエラーメッセージ");
			render(
				<DefaultErrorFallback
					{...defaultProps}
					error={error}
					showDetails={true}
				/>,
			);

			// 初期状態では詳細は非表示
			expect(screen.queryByText("エラータイプ")).not.toBeInTheDocument();

			// 詳細ボタンをクリック
			const detailsButton = screen.getByText("エラー詳細");
			fireEvent.click(detailsButton);

			// 詳細が表示される
			expect(screen.getByText("エラータイプ")).toBeInTheDocument();
			expect(screen.getByText("エラーメッセージ")).toBeInTheDocument();
			expect(screen.getByText("詳細なエラーメッセージ")).toBeInTheDocument();
		});

		it("詳細ボタンを再度クリックすると詳細が非表示になる", () => {
			render(<DefaultErrorFallback {...defaultProps} showDetails={true} />);

			const detailsButton = screen.getByText("エラー詳細");

			// 詳細を表示
			fireEvent.click(detailsButton);
			expect(screen.getByText("エラータイプ")).toBeInTheDocument();

			// 詳細を非表示
			fireEvent.click(detailsButton);
			expect(screen.queryByText("エラータイプ")).not.toBeInTheDocument();
		});

		it("スタックトレースが存在する場合は表示される", () => {
			const error = new Error("エラー");
			error.stack = "Error: エラー\n    at test.js:1:1";
			render(
				<DefaultErrorFallback
					{...defaultProps}
					error={error}
					showDetails={true}
				/>,
			);

			// 詳細を表示
			fireEvent.click(screen.getByText("エラー詳細"));

			expect(screen.getByText("スタックトレース")).toBeInTheDocument();
			expect(screen.getByText(/at test\.js:1:1/)).toBeInTheDocument();
		});

		it("エラーダイジェストが存在する場合は表示される", () => {
			const error: any = new Error("エラー");
			error.digest = "abc123";
			render(
				<DefaultErrorFallback
					{...defaultProps}
					error={error}
					showDetails={true}
				/>,
			);

			// 詳細を表示
			fireEvent.click(screen.getByText("エラー詳細"));

			expect(screen.getByText("エラーダイジェスト")).toBeInTheDocument();
			expect(screen.getByText("abc123")).toBeInTheDocument();
		});
	});

	describe("エラー報告機能", () => {
		it("エラーを報告ボタンをクリックするとコンソールにログが出力される", () => {
			const consoleSpy = vi.spyOn(console, "error");
			const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

			render(<DefaultErrorFallback {...defaultProps} showDetails={true} />);

			const reportButton = screen.getByText("エラーを報告");
			fireEvent.click(reportButton);

			expect(consoleSpy).toHaveBeenCalledWith(
				"Error reported:",
				expect.objectContaining({
					error: "テストエラー",
					timestamp: expect.any(String),
				}),
			);

			expect(alertSpy).toHaveBeenCalledWith(
				"エラーレポートを送信しました。ご協力ありがとうございます。",
			);

			alertSpy.mockRestore();
		});
	});
});

describe("ErrorBoundary", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// process.env.NODE_ENVのモック
		vi.stubEnv("NODE_ENV", "test");
	});

	describe("正常な状態", () => {
		it("エラーがない場合は子コンポーネントを表示する", () => {
			render(
				<ErrorBoundary>
					<div>正常なコンテンツ</div>
				</ErrorBoundary>,
			);

			expect(screen.getByText("正常なコンテンツ")).toBeInTheDocument();
		});

		it("複数の子コンポーネントを正しく表示する", () => {
			render(
				<ErrorBoundary>
					<div>コンテンツ1</div>
					<div>コンテンツ2</div>
				</ErrorBoundary>,
			);

			expect(screen.getByText("コンテンツ1")).toBeInTheDocument();
			expect(screen.getByText("コンテンツ2")).toBeInTheDocument();
		});
	});

	describe("エラー捕捉", () => {
		it("子コンポーネントでエラーが発生した場合、エラーUIを表示する", () => {
			const error = new Error("テストエラー");

			render(
				<ErrorBoundary>
					<ThrowError error={error} shouldThrow={true} />
				</ErrorBoundary>,
			);

			expect(screen.getByText("エラーが発生しました")).toBeInTheDocument();
			expect(screen.queryByText("正常なコンテンツ")).not.toBeInTheDocument();
		});

		it("ネットワークエラーを正しく分類して表示する", () => {
			const error = new Error("Failed to fetch");

			render(
				<ErrorBoundary>
					<ThrowError error={error} shouldThrow={true} />
				</ErrorBoundary>,
			);

			expect(screen.getByText("ネットワークエラー")).toBeInTheDocument();
		});

		it("onErrorコールバックが呼ばれる", () => {
			const onError = vi.fn();
			const error = new Error("テストエラー");

			render(
				<ErrorBoundary onError={onError}>
					<ThrowError error={error} shouldThrow={true} />
				</ErrorBoundary>,
			);

			expect(onError).toHaveBeenCalledWith(
				error,
				expect.objectContaining({
					componentStack: expect.any(String),
				}),
			);
		});
	});

	describe("リトライ機能", () => {
		it("再試行ボタンをクリックするとエラー状態がリセットされる", () => {
			const TestComponent = () => {
				const [shouldThrow, setShouldThrow] = useState(true);

				return (
					<ErrorBoundary onRetry={() => setShouldThrow(false)}>
						<ThrowError
							error={new Error("テストエラー")}
							shouldThrow={shouldThrow}
						>
							<button type="button" onClick={() => setShouldThrow(true)}>
								エラーを発生させる
							</button>
						</ThrowError>
					</ErrorBoundary>
				);
			};

			render(<TestComponent />);

			// エラーが表示される
			expect(screen.getByText("エラーが発生しました")).toBeInTheDocument();

			// 再試行ボタンをクリック
			const retryButton = screen.getByText("再試行");
			fireEvent.click(retryButton);

			// 正常なコンテンツが表示される
			expect(screen.getByText("エラーを発生させる")).toBeInTheDocument();
			expect(
				screen.queryByText("エラーが発生しました"),
			).not.toBeInTheDocument();
		});

		it("onRetryコールバックが呼ばれる", () => {
			const onRetry = vi.fn();

			render(
				<ErrorBoundary onRetry={onRetry}>
					<ThrowError error={new Error("テストエラー")} shouldThrow={true} />
				</ErrorBoundary>,
			);

			const retryButton = screen.getByText("再試行");
			fireEvent.click(retryButton);

			expect(onRetry).toHaveBeenCalledTimes(1);
		});
	});

	describe("カスタムフォールバックUI", () => {
		it("カスタムフォールバックコンポーネントを表示できる", () => {
			const CustomFallback = ({ error, resetError }: ErrorFallbackProps) => (
				<div>
					<h1>カスタムエラー画面</h1>
					<p>{error.message}</p>
					<button type="button" onClick={resetError}>
						カスタム再試行
					</button>
				</div>
			);

			render(
				<ErrorBoundary fallback={CustomFallback}>
					<ThrowError error={new Error("カスタムエラー")} shouldThrow={true} />
				</ErrorBoundary>,
			);

			expect(screen.getByText("カスタムエラー画面")).toBeInTheDocument();
			expect(screen.getByText("カスタムエラー")).toBeInTheDocument();
			expect(screen.getByText("カスタム再試行")).toBeInTheDocument();
		});

		it("カスタムフォールバックでもリトライ機能が動作する", () => {
			const CustomFallback = ({ resetError }: ErrorFallbackProps) => (
				<button type="button" onClick={resetError}>
					カスタム再試行
				</button>
			);

			const onRetry = vi.fn();

			render(
				<ErrorBoundary fallback={CustomFallback} onRetry={onRetry}>
					<ThrowError error={new Error("エラー")} shouldThrow={true} />
				</ErrorBoundary>,
			);

			const retryButton = screen.getByText("カスタム再試行");
			fireEvent.click(retryButton);

			expect(onRetry).toHaveBeenCalledTimes(1);
		});
	});

	describe("開発環境と本番環境の違い", () => {
		it("開発環境ではデフォルトで詳細が表示される", () => {
			vi.stubEnv("NODE_ENV", "development");

			render(
				<ErrorBoundary>
					<ThrowError error={new Error("エラー")} shouldThrow={true} />
				</ErrorBoundary>,
			);

			expect(screen.getByText("エラー詳細")).toBeInTheDocument();
			expect(screen.getByText("エラーを報告")).toBeInTheDocument();
		});

		it("本番環境ではデフォルトで詳細が表示されない", () => {
			vi.stubEnv("NODE_ENV", "production");

			render(
				<ErrorBoundary>
					<ThrowError error={new Error("エラー")} shouldThrow={true} />
				</ErrorBoundary>,
			);

			expect(screen.queryByText("エラー詳細")).not.toBeInTheDocument();
			expect(screen.queryByText("エラーを報告")).not.toBeInTheDocument();
		});

		it("showDetailsプロップで詳細表示を制御できる", () => {
			vi.stubEnv("NODE_ENV", "production");

			render(
				<ErrorBoundary showDetails={true}>
					<ThrowError error={new Error("エラー")} shouldThrow={true} />
				</ErrorBoundary>,
			);

			expect(screen.getByText("エラー詳細")).toBeInTheDocument();
		});
	});

	describe("コンソールログ", () => {
		it("開発環境ではエラーがコンソールに出力される", () => {
			vi.stubEnv("NODE_ENV", "development");
			const consoleSpy = vi.spyOn(console, "error");

			const error = new Error("開発エラー");

			render(
				<ErrorBoundary>
					<ThrowError error={error} shouldThrow={true} />
				</ErrorBoundary>,
			);

			expect(consoleSpy).toHaveBeenCalledWith(
				"ErrorBoundary caught an error:",
				error,
			);
			expect(consoleSpy).toHaveBeenCalledWith(
				"Error info:",
				expect.objectContaining({
					componentStack: expect.any(String),
				}),
			);
		});

		it("本番環境ではエラーがコンソールに出力されない", () => {
			vi.stubEnv("NODE_ENV", "production");
			const consoleSpy = vi.spyOn(console, "error");

			render(
				<ErrorBoundary>
					<ThrowError error={new Error("本番エラー")} shouldThrow={true} />
				</ErrorBoundary>,
			);

			// React自体のエラー出力はあるが、ErrorBoundaryからの出力はない
			expect(consoleSpy).not.toHaveBeenCalledWith(
				"ErrorBoundary caught an error:",
				expect.any(Error),
			);
		});
	});

	describe("複数のErrorBoundary", () => {
		it("ネストされたErrorBoundaryで内側のエラーが捕捉される", () => {
			render(
				<ErrorBoundary>
					<div>外側のコンテンツ</div>
					<ErrorBoundary>
						<ThrowError error={new Error("内側のエラー")} shouldThrow={true} />
					</ErrorBoundary>
				</ErrorBoundary>,
			);

			// 外側のコンテンツは表示される
			expect(screen.getByText("外側のコンテンツ")).toBeInTheDocument();
			// 内側のエラーが表示される
			expect(screen.getByText("エラーが発生しました")).toBeInTheDocument();
		});
	});
});
