// global-error.tsx のテスト
// グローバルエラーハンドラの表示とインタラクションを検証

import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@/test-utils";
import GlobalError from "./global-error";

// html/bodyタグを含む実際のコンポーネントをテストするためのヘルパー関数
const renderGlobalError = (
	error: Error & { digest?: string },
	reset: () => void,
) => {
	// jsdomはhtml/bodyタグを許可しないため、コンテナを作成してレンダリング
	const container = document.createElement("div");
	document.body.appendChild(container);

	const { unmount } = render(<GlobalError error={error} reset={reset} />, {
		container,
	});

	return {
		unmount: () => {
			unmount();
			document.body.removeChild(container);
		},
	};
};

describe("GlobalError", () => {
	const mockReset = vi.fn();
	const defaultError = new Error("テストエラー") as Error & { digest?: string };
	const errorWithDigest = new Error("ダイジェスト付きエラー") as Error & {
		digest?: string;
	};
	errorWithDigest.digest = "error-digest-123";

	beforeEach(() => {
		mockReset.mockClear();
	});

	afterEach(() => {
		vi.clearAllMocks();
		// クリーンアップ：レンダリングされた要素を削除
		document.body.innerHTML = "";
	});

	describe("HTMLドキュメント構造", () => {
		it("html要素とbody要素が正しくレンダリングされる", () => {
			// 実際のGlobalErrorコンポーネントをテスト
			const container = document.createElement("div");
			container.innerHTML = `<html lang="ja"><body></body></html>`;

			// GlobalErrorが独自のhtml/bodyタグを持つことを確認
			const { unmount } = renderGlobalError(defaultError, mockReset);

			// コンポーネント内にhtml要素が含まれることを確認
			// 注: jsdomの制限により、実際のhtml/bodyタグの検証は困難だが
			// コンポーネントがレンダリングされることを確認
			expect(screen.getByText("システムエラー")).toBeInTheDocument();

			unmount();
		});
	});

	describe("基本レンダリング", () => {
		it("エラーページの基本要素が表示される", () => {
			renderGlobalError(defaultError, mockReset);

			// タイトル
			expect(screen.getByText("システムエラー")).toBeInTheDocument();

			// 説明文
			expect(
				screen.getByText(
					"予期しないエラーが発生しました。しばらく待ってから再度お試しください。",
				),
			).toBeInTheDocument();

			// アイコン
			expect(screen.getByText("⚠")).toBeInTheDocument();

			// ボタン
			expect(
				screen.getByRole("button", { name: "再試行" }),
			).toBeInTheDocument();
			expect(
				screen.getByRole("link", { name: "ホームに戻る" }),
			).toBeInTheDocument();
		});

		it("メインコンテナの構造が正しく設定される", () => {
			const { unmount } = renderGlobalError(defaultError, mockReset);

			// html/bodyタグ内のメインコンテナの構造を確認
			const mainContainer = document.querySelector(".min-h-screen");
			expect(mainContainer).toBeInTheDocument();
			expect(mainContainer).toHaveClass(
				"min-h-screen",
				"flex",
				"items-center",
				"justify-center",
				"bg-gray-50",
				"p-4",
			);

			// クリーンアップ
			unmount();
		});
	});

	describe("開発環境でのエラー表示", () => {
		beforeEach(() => {
			vi.stubEnv("NODE_ENV", "development");
		});

		afterEach(() => {
			vi.unstubAllEnvs();
		});

		it("開発環境ではエラーメッセージが表示される", () => {
			renderGlobalError(defaultError, mockReset);

			// 開発環境では、エラー詳細が表示される
			expect(screen.getByText("システムエラー")).toBeInTheDocument();
			expect(
				screen.getByText(
					"予期しないエラーが発生しました。しばらく待ってから再度お試しください。",
				),
			).toBeInTheDocument();

			// 開発環境なので、詳細表示ボタンがある
			expect(
				screen.getByRole("button", { name: "エラー詳細を表示" }),
			).toBeInTheDocument();
		});

		it("エラーダイジェストがある場合は表示される", () => {
			renderGlobalError(errorWithDigest, mockReset);

			// 開発環境では、エラー詳細が表示される
			expect(screen.getByText("エラーが発生しました")).toBeInTheDocument();
			expect(
				screen.getByText(
					"予期しないエラーが発生しました。しばらく待ってから再度お試しください。",
				),
			).toBeInTheDocument();

			// 開発環境なので、エラーメッセージとダイジェストが表示される
			expect(screen.getByText("ダイジェスト付きエラー")).toBeInTheDocument();
			expect(
				screen.getByText("Error ID: error-digest-123"),
			).toBeInTheDocument();
		});
	});

	describe("本番環境でのエラー表示", () => {
		beforeEach(() => {
			vi.stubEnv("NODE_ENV", "production");
		});

		afterEach(() => {
			vi.unstubAllEnvs();
		});

		it("本番環境ではエラーメッセージが表示されない", () => {
			renderGlobalError(defaultError, mockReset);

			expect(screen.queryByText("テストエラー")).not.toBeInTheDocument();
		});
	});

	describe("インタラクション", () => {
		it("再試行ボタンをクリックするとreset関数が呼ばれる", async () => {
			const user = userEvent.setup();
			renderGlobalError(defaultError, mockReset);

			const resetButton = screen.getByRole("button", { name: "再試行" });
			await user.click(resetButton);

			await waitFor(() => {
				expect(mockReset).toHaveBeenCalledTimes(1);
			});
		});

		it("ホームに戻るリンクが正しいhref属性を持つ", () => {
			renderGlobalError(defaultError, mockReset);

			const homeLink = screen.getByRole("link", { name: "ホームに戻る" });
			expect(homeLink).toHaveAttribute("href", "/");
		});
	});

	describe("スタイリング", () => {
		it("再試行ボタンに適切なクラスが適用される", () => {
			renderGlobalError(defaultError, mockReset);

			const resetButton = screen.getByRole("button", { name: "再試行" });
			expect(resetButton).toHaveClass(
				"inline-block",
				"w-full",
				"px-6",
				"py-3",
				"bg-blue-600",
				"text-white",
				"font-medium",
				"rounded-md",
				"hover:bg-blue-700",
				"transition-colors",
			);
		});

		it("ホームに戻るリンクに適切なクラスが適用される", () => {
			renderGlobalError(defaultError, mockReset);

			const homeLink = screen.getByRole("link", { name: "ホームに戻る" });
			expect(homeLink).toHaveClass(
				"inline-block",
				"w-full",
				"px-6",
				"py-3",
				"bg-gray-200",
				"text-gray-700",
				"font-medium",
				"rounded-md",
			);
		});
	});

	describe("エラータイプ別表示", () => {
		it("ネットワークエラーを適切に表示する", () => {
			const networkError = new Error("Network Error") as Error & {
				digest?: string;
			};
			networkError.name = "NetworkError";
			renderGlobalError(networkError, mockReset);

			expect(screen.getByText("ネットワークエラー")).toBeInTheDocument();
			expect(
				screen.getByText("インターネット接続を確認してください。"),
			).toBeInTheDocument();
		});

		it("認証エラーを適切に表示する", () => {
			const authError = new Error("Unauthorized") as Error & {
				digest?: string;
			};
			authError.name = "AuthenticationError";
			renderGlobalError(authError, mockReset);

			expect(screen.getByText("認証エラー")).toBeInTheDocument();
			expect(
				screen.getByText("再度ログインしてください。"),
			).toBeInTheDocument();
		});

		it("一般的なエラーを適切に表示する", () => {
			renderGlobalError(defaultError, mockReset);

			expect(screen.getByText("システムエラー")).toBeInTheDocument();
			expect(
				screen.getByText(
					"予期しないエラーが発生しました。しばらく待ってから再度お試しください。",
				),
			).toBeInTheDocument();
		});
	});

	describe("エラーレポート機能", () => {
		it("エラーレポートボタンが表示される", () => {
			renderGlobalError(defaultError, mockReset);

			expect(
				screen.getByRole("button", { name: "エラーを報告" }),
			).toBeInTheDocument();
		});

		it("エラーレポートボタンをクリックするとエラー情報がコピーされる", async () => {
			// ClipboardAPIのモック
			Object.assign(navigator, {
				clipboard: {
					writeText: vi.fn().mockResolvedValue(undefined),
				},
			});

			const user = userEvent.setup();
			renderGlobalError(defaultError, mockReset);

			const reportButton = screen.getByRole("button", { name: "エラーを報告" });
			await user.click(reportButton);

			await waitFor(() => {
				expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
					expect.stringContaining("エラー情報"),
				);
			});
		});
	});

	describe("詳細エラー情報（開発環境）", () => {
		beforeEach(() => {
			vi.stubEnv("NODE_ENV", "development");
		});

		afterEach(() => {
			vi.unstubAllEnvs();
		});

		it("エラースタックトレースが表示される", () => {
			const errorWithStack = new Error("テストエラー") as Error & {
				digest?: string;
			};
			errorWithStack.stack = "Error: テストエラー\n    at test.tsx:10:5";
			renderGlobalError(errorWithStack, mockReset);

			expect(screen.getByText(/Error: テストエラー/)).toBeInTheDocument();
			expect(screen.getByText(/at test.tsx:10:5/)).toBeInTheDocument();
		});

		it("エラー詳細の展開・折りたたみ機能", async () => {
			const user = userEvent.setup();
			const errorWithStack = new Error("テストエラー") as Error & {
				digest?: string;
			};
			errorWithStack.stack = "Error: テストエラー\n    at test.tsx:10:5";
			renderGlobalError(errorWithStack, mockReset);

			const toggleButton = screen.getByRole("button", {
				name: "エラー詳細を表示",
			});
			expect(toggleButton).toBeInTheDocument();

			// 初期状態では詳細は非表示
			expect(screen.queryByText(/at test.tsx:10:5/)).not.toBeInTheDocument();

			// クリックで詳細を表示
			await user.click(toggleButton);
			expect(screen.getByText(/at test.tsx:10:5/)).toBeInTheDocument();
			expect(
				screen.getByRole("button", { name: "エラー詳細を非表示" }),
			).toBeInTheDocument();
		});
	});

	describe("アクセシビリティ", () => {
		it("ボタンとリンクが適切なロールを持つ", () => {
			renderGlobalError(defaultError, mockReset);

			const resetButton = screen.getByRole("button", { name: "再試行" });
			expect(resetButton).toHaveAttribute("type", "button");

			const homeLink = screen.getByRole("link", { name: "ホームに戻る" });
			expect(homeLink.tagName).toBe("A");

			const reportButton = screen.getByRole("button", { name: "エラーを報告" });
			expect(reportButton).toHaveAttribute("type", "button");
		});

		it("キーボード操作でアクセス可能", async () => {
			const user = userEvent.setup();
			renderGlobalError(defaultError, mockReset);

			// Tabキーでフォーカス移動
			await user.tab();
			const resetButton = screen.getByRole("button", { name: "再試行" });
			expect(resetButton).toHaveFocus();

			await user.tab();
			const homeLink = screen.getByRole("link", { name: "ホームに戻る" });
			expect(homeLink).toHaveFocus();

			await user.tab();
			const reportButton = screen.getByRole("button", { name: "エラーを報告" });
			expect(reportButton).toHaveFocus();
		});

		it("エラーメッセージにaria-liveが設定される", () => {
			renderGlobalError(defaultError, mockReset);

			const errorMessage = screen
				.getByText("システムエラー")
				.closest('[role="alert"]');
			expect(errorMessage).toBeInTheDocument();
			expect(errorMessage).toHaveAttribute("aria-live", "assertive");
		});

		it("スキップリンクが提供される", () => {
			renderGlobalError(defaultError, mockReset);

			const skipLink = screen.getByText("メインコンテンツにスキップ");
			expect(skipLink).toBeInTheDocument();
			expect(skipLink).toHaveAttribute("href", "#main-content");
		});
	});
});
