import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { ErrorBoundary } from "./ErrorBoundary";

// next/navigationのモック
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: mockPush,
	}),
}));

// コンソールエラーをモック
const originalError = console.error;
beforeAll(() => {
	console.error = vi.fn();
});
afterAll(() => {
	console.error = originalError;
});

describe("ErrorBoundary", () => {
	// テスト用のエラーを投げるコンポーネント
	const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
		if (shouldThrow) {
			throw new Error("Test error");
		}
		return <div>正常なコンテンツ</div>;
	};

	// ネットワークエラーを投げるコンポーネント
	const ThrowNetworkError = () => {
		const error = new Error("Network error");
		(error as any).type = "network";
		throw error;
	};

	// バリデーションエラーを投げるコンポーネント
	const ThrowValidationError = () => {
		const error = new Error("Validation error");
		(error as any).type = "validation";
		(error as any).details = [
			{ field: "email", message: "メールアドレスが無効です" },
			{ field: "password", message: "パスワードは8文字以上必要です" },
		];
		throw error;
	};

	afterEach(() => {
		vi.clearAllMocks();
		mockPush.mockClear();
	});

	describe("正常系", () => {
		it("エラーがない場合は子コンポーネントを表示する", () => {
			render(
				<ErrorBoundary>
					<ThrowError shouldThrow={false} />
				</ErrorBoundary>,
			);

			expect(screen.getByText("正常なコンテンツ")).toBeInTheDocument();
		});
	});

	describe("エラーハンドリング", () => {
		it("エラーが発生した場合はエラーUIを表示する", () => {
			render(
				<ErrorBoundary>
					<ThrowError shouldThrow={true} />
				</ErrorBoundary>,
			);

			expect(
				screen.getByRole("heading", { name: /エラーが発生しました/ }),
			).toBeInTheDocument();
			expect(
				screen.getByRole("button", { name: /再試行/ }),
			).toBeInTheDocument();
		});

		it("開発環境ではエラーの詳細を表示する", () => {
			const originalEnv = process.env.NODE_ENV;
			(process.env as any).NODE_ENV = "development";

			render(
				<ErrorBoundary>
					<ThrowError shouldThrow={true} />
				</ErrorBoundary>,
			);

			expect(screen.getByText(/Test error/)).toBeInTheDocument();
			expect(screen.getByText(/エラーID:/)).toBeInTheDocument();

			(process.env as any).NODE_ENV = originalEnv;
		});

		it("本番環境ではエラーの詳細を表示しない", () => {
			const originalEnv = process.env.NODE_ENV;
			(process.env as any).NODE_ENV = "production";

			render(
				<ErrorBoundary>
					<ThrowError shouldThrow={true} />
				</ErrorBoundary>,
			);

			expect(screen.queryByText(/Test error/)).not.toBeInTheDocument();
			expect(screen.queryByText(/エラーID:/)).not.toBeInTheDocument();

			(process.env as any).NODE_ENV = originalEnv;
		});
	});

	describe("エラータイプ別の表示", () => {
		it("ネットワークエラーの場合は専用メッセージを表示する", () => {
			render(
				<ErrorBoundary>
					<ThrowNetworkError />
				</ErrorBoundary>,
			);

			expect(
				screen.getByText(/ネットワークエラーが発生しました/),
			).toBeInTheDocument();
			expect(
				screen.getByText(/インターネット接続を確認してください/),
			).toBeInTheDocument();
		});

		it("バリデーションエラーの場合は詳細を表示する", () => {
			render(
				<ErrorBoundary>
					<ThrowValidationError />
				</ErrorBoundary>,
			);

			expect(screen.getByText(/入力内容に問題があります/)).toBeInTheDocument();
			expect(screen.getByText(/メールアドレスが無効です/)).toBeInTheDocument();
			expect(
				screen.getByText(/パスワードは8文字以上必要です/),
			).toBeInTheDocument();
		});
	});

	describe("リカバリー機能", () => {
		it("再試行ボタンをクリックするとエラー状態がリセットされる", async () => {
			const user = userEvent.setup();
			let shouldThrow = true;

			const TestComponent = () => {
				return <ThrowError shouldThrow={shouldThrow} />;
			};

			const { rerender } = render(
				<ErrorBoundary>
					<TestComponent />
				</ErrorBoundary>,
			);

			// エラーが表示されていることを確認
			expect(
				screen.getByRole("heading", { name: /エラーが発生しました/ }),
			).toBeInTheDocument();

			// エラーを修正
			shouldThrow = false;

			// 再試行ボタンをクリック
			await user.click(screen.getByRole("button", { name: /再試行/ }));

			// 再レンダリング
			rerender(
				<ErrorBoundary>
					<TestComponent />
				</ErrorBoundary>,
			);

			// 正常なコンテンツが表示されることを確認
			expect(screen.getByText("正常なコンテンツ")).toBeInTheDocument();
		});

		it("カスタムリトライハンドラーが提供された場合はそれを実行する", async () => {
			const user = userEvent.setup();
			const onRetry = vi.fn();

			render(
				<ErrorBoundary onRetry={onRetry}>
					<ThrowError shouldThrow={true} />
				</ErrorBoundary>,
			);

			await user.click(screen.getByRole("button", { name: /再試行/ }));

			expect(onRetry).toHaveBeenCalledOnce();
		});

		it("ホームに戻るボタンをクリックするとルートに遷移する", async () => {
			const user = userEvent.setup();

			render(
				<ErrorBoundary>
					<ThrowError shouldThrow={true} />
				</ErrorBoundary>,
			);

			await user.click(screen.getByRole("button", { name: /ホームに戻る/ }));

			expect(mockPush).toHaveBeenCalledWith("/");
		});
	});

	describe("エラーレポート機能", () => {
		it("エラーレポートボタンをクリックするとレポートフォームが表示される", async () => {
			const user = userEvent.setup();

			render(
				<ErrorBoundary>
					<ThrowError shouldThrow={true} />
				</ErrorBoundary>,
			);

			await user.click(screen.getByRole("button", { name: /エラーを報告/ }));

			expect(
				screen.getByRole("dialog", { name: /エラーレポート/ }),
			).toBeInTheDocument();
			expect(screen.getByLabelText(/発生時の操作/)).toBeInTheDocument();
			expect(screen.getByRole("button", { name: /送信/ })).toBeInTheDocument();
		});

		it("レポートを送信するとonReportハンドラーが呼ばれる", async () => {
			const user = userEvent.setup();
			const onReport = vi.fn();

			render(
				<ErrorBoundary onReport={onReport}>
					<ThrowError shouldThrow={true} />
				</ErrorBoundary>,
			);

			await user.click(screen.getByRole("button", { name: /エラーを報告/ }));

			const textarea = screen.getByLabelText(/発生時の操作/);
			await user.type(textarea, "テストエラーの報告");

			await user.click(screen.getByRole("button", { name: /送信/ }));

			expect(onReport).toHaveBeenCalledWith(
				expect.objectContaining({
					error: expect.any(Error),
					errorInfo: expect.any(Object),
					userDescription: "テストエラーの報告",
				}),
			);
		});
	});

	describe("フォールバックUI", () => {
		it("カスタムフォールバックコンポーネントが提供された場合はそれを表示する", () => {
			const CustomFallback = ({ error }: { error: Error }) => (
				<div>カスタムエラー: {error.message}</div>
			);

			render(
				<ErrorBoundary fallback={CustomFallback}>
					<ThrowError shouldThrow={true} />
				</ErrorBoundary>,
			);

			expect(
				screen.getByText(/カスタムエラー: Test error/),
			).toBeInTheDocument();
		});

		it("特定のエラータイプに対してカスタムUIを表示する", () => {
			const errorTypeUI = {
				network: <div>ネットワークエラー専用UI</div>,
				validation: <div>バリデーションエラー専用UI</div>,
			};

			render(
				<ErrorBoundary errorTypeUI={errorTypeUI}>
					<ThrowNetworkError />
				</ErrorBoundary>,
			);

			expect(screen.getByText("ネットワークエラー専用UI")).toBeInTheDocument();
		});
	});

	describe("エラーログ", () => {
		it("エラーが発生した場合はコンソールにログを出力する", () => {
			render(
				<ErrorBoundary>
					<ThrowError shouldThrow={true} />
				</ErrorBoundary>,
			);

			expect(console.error).toHaveBeenCalledWith(
				expect.stringContaining("[ErrorBoundary]"),
				expect.any(Error),
				expect.any(Object),
			);
		});

		it("カスタムログハンドラーが提供された場合はそれを使用する", () => {
			const onError = vi.fn();

			render(
				<ErrorBoundary onError={onError}>
					<ThrowError shouldThrow={true} />
				</ErrorBoundary>,
			);

			expect(onError).toHaveBeenCalledWith(
				expect.any(Error),
				expect.any(Object),
			);
		});
	});
});
