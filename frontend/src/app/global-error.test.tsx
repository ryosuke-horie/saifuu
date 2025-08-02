// global-error.tsx のテスト
// グローバルエラーハンドラの表示とインタラクションを検証

import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorType } from "@/components/common/ErrorBoundary";
import { render, screen, waitFor } from "@/test-utils";
import GlobalError from "./global-error";

// classifyError関数のモック
vi.mock("@/components/common/ErrorBoundary", () => ({
	ErrorType: {
		NETWORK: "NETWORK",
		VALIDATION: "VALIDATION",
		SERVER: "SERVER",
		UNKNOWN: "UNKNOWN",
	},
	classifyError: vi.fn(() => "UNKNOWN"),
}));

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
		// alert関数をモック
		global.alert = vi.fn();
	});

	afterEach(() => {
		vi.clearAllMocks();
		// クリーンアップ：レンダリングされた要素を削除
		document.body.innerHTML = "";
	});

	describe("基本レンダリング", () => {
		it("エラーページの基本要素が表示される", () => {
			renderGlobalError(defaultError, mockReset);

			// タイトル（デフォルトはUNKNOWNエラー）
			expect(screen.getByText("予期しないエラー")).toBeInTheDocument();

			// 説明文
			expect(
				screen.getByText(/申し訳ございません。予期しないエラーが発生しました/),
			).toBeInTheDocument();

			// アイコン
			expect(screen.getByLabelText("Error icon")).toBeInTheDocument();

			// ボタン
			expect(
				screen.getByRole("button", { name: /再試行/ }),
			).toBeInTheDocument();
			expect(
				screen.getByRole("link", { name: "ホームに戻る" }),
			).toBeInTheDocument();
		});

		it("メインコンテナの構造が正しく設定される", () => {
			const { unmount } = renderGlobalError(defaultError, mockReset);

			// グラデーション背景を持つコンテナの構造を確認
			const mainContainer = document.querySelector(".min-h-screen");
			expect(mainContainer).toBeInTheDocument();
			expect(mainContainer).toHaveClass(
				"min-h-screen",
				"flex",
				"items-center",
				"justify-center",
			);

			// カード要素の確認
			const card = document.querySelector(".max-w-lg");
			expect(card).toBeInTheDocument();
			expect(card).toHaveClass("bg-white", "rounded-xl", "shadow-lg");

			// クリーンアップ
			unmount();
		});
	});

	describe("エラータイプ別表示", () => {
		it("ネットワークエラーの場合の表示", async () => {
			const { classifyError } = await import(
				"@/components/common/ErrorBoundary"
			);
			(classifyError as any).mockReturnValueOnce(ErrorType.NETWORK);

			renderGlobalError(defaultError, mockReset);

			expect(screen.getByText("ネットワークエラー")).toBeInTheDocument();
			expect(
				screen.getByText(/インターネット接続を確認してください/),
			).toBeInTheDocument();
			expect(screen.getByText("📡")).toBeInTheDocument();
		});

		it("検証エラーの場合の表示", async () => {
			const { classifyError } = await import(
				"@/components/common/ErrorBoundary"
			);
			(classifyError as any).mockReturnValueOnce(ErrorType.VALIDATION);

			renderGlobalError(defaultError, mockReset);

			expect(screen.getByText("入力エラー")).toBeInTheDocument();
			expect(screen.getByText(/入力内容に問題があります/)).toBeInTheDocument();
			expect(screen.getByText("📝")).toBeInTheDocument();
		});

		it("サーバーエラーの場合の表示", async () => {
			const { classifyError } = await import(
				"@/components/common/ErrorBoundary"
			);
			(classifyError as any).mockReturnValueOnce(ErrorType.SERVER);

			renderGlobalError(defaultError, mockReset);

			expect(screen.getByText("サーバーエラー")).toBeInTheDocument();
			expect(
				screen.getByText(/サーバーで問題が発生しました/),
			).toBeInTheDocument();
			expect(screen.getByText("🖥️")).toBeInTheDocument();
		});
	});

	describe("開発環境でのエラー表示", () => {
		beforeEach(() => {
			vi.stubEnv("NODE_ENV", "development");
		});

		afterEach(() => {
			vi.unstubAllEnvs();
		});

		it("開発環境ではエラー詳細ボタンが表示される", () => {
			renderGlobalError(defaultError, mockReset);

			// エラー詳細ボタンの確認
			const detailsButton = screen.getByRole("button", { name: /エラー詳細/ });
			expect(detailsButton).toBeInTheDocument();
		});

		it("エラー詳細を展開するとエラー情報が表示される", async () => {
			const user = userEvent.setup();
			renderGlobalError(errorWithDigest, mockReset);

			// エラー詳細ボタンをクリック
			const detailsButton = screen.getByRole("button", { name: /エラー詳細/ });
			await user.click(detailsButton);

			// エラータイプ
			expect(screen.getByText("Error Type")).toBeInTheDocument();
			expect(screen.getByText("UNKNOWN")).toBeInTheDocument();

			// エラーメッセージ
			expect(screen.getByText("Error Message")).toBeInTheDocument();
			expect(screen.getByText("ダイジェスト付きエラー")).toBeInTheDocument();

			// エラーダイジェスト
			expect(screen.getByText("Error Digest")).toBeInTheDocument();
			expect(screen.getByText("error-digest-123")).toBeInTheDocument();

			// タイムスタンプ
			expect(screen.getByText("Timestamp")).toBeInTheDocument();
		});

		it("エラー報告ボタンが表示される", () => {
			renderGlobalError(defaultError, mockReset);

			const reportButton = screen.getByRole("button", { name: "エラーを報告" });
			expect(reportButton).toBeInTheDocument();
		});

		it("エラー報告ボタンをクリックすると報告処理が実行される", async () => {
			const user = userEvent.setup();
			const consoleSpy = vi.spyOn(console, "log");

			renderGlobalError(defaultError, mockReset);

			const reportButton = screen.getByRole("button", { name: "エラーを報告" });
			await user.click(reportButton);

			// 送信中の表示確認
			expect(screen.getByText("送信中...")).toBeInTheDocument();

			// 報告完了を待つ
			await waitFor(() => {
				expect(global.alert).toHaveBeenCalledWith(
					"エラーレポートを送信しました。ご協力ありがとうございます。",
				);
			});

			// console.logが呼ばれたことを確認
			expect(consoleSpy).toHaveBeenCalled();
		});
	});

	describe("本番環境でのエラー表示", () => {
		beforeEach(() => {
			vi.stubEnv("NODE_ENV", "production");
		});

		afterEach(() => {
			vi.unstubAllEnvs();
		});

		it("本番環境ではエラー詳細ボタンが表示されない", () => {
			renderGlobalError(defaultError, mockReset);

			expect(
				screen.queryByRole("button", { name: /エラー詳細/ }),
			).not.toBeInTheDocument();
		});

		it("本番環境ではエラー報告ボタンが表示されない", () => {
			renderGlobalError(defaultError, mockReset);

			expect(
				screen.queryByRole("button", { name: "エラーを報告" }),
			).not.toBeInTheDocument();
		});
	});

	describe("再試行機能", () => {
		it("再試行ボタンをクリックするとreset関数が呼ばれる", async () => {
			const user = userEvent.setup();
			renderGlobalError(defaultError, mockReset);

			const resetButton = screen.getByRole("button", { name: /再試行/ });
			await user.click(resetButton);

			await waitFor(() => {
				expect(mockReset).toHaveBeenCalledTimes(1);
			});
		});

		it("再試行回数が表示される", async () => {
			const user = userEvent.setup();
			renderGlobalError(defaultError, mockReset);

			const resetButton = screen.getByRole("button", { name: /再試行/ });

			// 1回目の再試行
			await user.click(resetButton);
			await waitFor(() => {
				expect(screen.getByText("再試行回数: 1/3")).toBeInTheDocument();
			});

			// 2回目の再試行
			await user.click(resetButton);
			await waitFor(() => {
				expect(screen.getByText("再試行回数: 2/3")).toBeInTheDocument();
			});

			// 3回目の再試行
			await user.click(resetButton);
			await waitFor(() => {
				expect(screen.getByText("再試行回数: 3/3")).toBeInTheDocument();
			});
		});

		it("再試行上限に達するとボタンが無効化される", async () => {
			const user = userEvent.setup();
			renderGlobalError(defaultError, mockReset);

			const resetButton = screen.getByRole("button", { name: /再試行/ });

			// 3回クリック
			await user.click(resetButton);
			await user.click(resetButton);
			await user.click(resetButton);

			// 3回目のクリック後、ボタンが無効化されて表示が変わる
			await waitFor(() => {
				expect(screen.getByText("再試行回数: 3/3")).toBeInTheDocument();
			});

			// ボタンが無効化されている
			expect(screen.getByText("再試行の上限に達しました")).toBeInTheDocument();
			expect(resetButton).toBeDisabled();

			// reset関数が3回呼ばれたことを確認
			expect(mockReset).toHaveBeenCalledTimes(3);
		});
	});

	describe("インタラクション", () => {
		it("ホームに戻るリンクが正しいhref属性を持つ", () => {
			renderGlobalError(defaultError, mockReset);

			const homeLink = screen.getByRole("link", { name: "ホームに戻る" });
			expect(homeLink).toHaveAttribute("href", "/");
		});
	});

	describe("スタイリング", () => {
		it("再試行ボタンに適切なクラスが適用される", () => {
			renderGlobalError(defaultError, mockReset);

			const resetButton = screen.getByRole("button", { name: /再試行/ });
			expect(resetButton).toHaveClass(
				"w-full",
				"px-6",
				"py-3",
				"bg-blue-600",
				"text-white",
				"font-medium",
				"rounded-lg",
			);
		});

		it("ホームに戻るリンクに適切なクラスが適用される", () => {
			renderGlobalError(defaultError, mockReset);

			const homeLink = screen.getByRole("link", { name: "ホームに戻る" });
			expect(homeLink).toHaveClass(
				"block",
				"w-full",
				"px-6",
				"py-3",
				"bg-gray-100",
				"text-gray-700",
				"font-medium",
				"rounded-lg",
			);
		});

		it("エラータイプに応じて適切な色のヘッダーが表示される", async () => {
			const { classifyError } = await import(
				"@/components/common/ErrorBoundary"
			);

			// ネットワークエラー（オレンジ）
			(classifyError as any).mockReturnValueOnce(ErrorType.NETWORK);
			const { unmount: unmount1 } = renderGlobalError(defaultError, mockReset);
			let header = document.querySelector(".border-b-4");
			expect(header).toHaveClass("bg-orange-100", "text-orange-600");
			unmount1();

			// サーバーエラー（赤）
			(classifyError as any).mockReturnValueOnce(ErrorType.SERVER);
			const { unmount: unmount2 } = renderGlobalError(defaultError, mockReset);
			header = document.querySelector(".border-b-4");
			expect(header).toHaveClass("bg-red-100", "text-red-600");
			unmount2();

			// 検証エラー（黄色）
			(classifyError as any).mockReturnValueOnce(ErrorType.VALIDATION);
			renderGlobalError(defaultError, mockReset);
			header = document.querySelector(".border-b-4");
			expect(header).toHaveClass("bg-yellow-100", "text-yellow-600");
		});
	});

	describe("アクセシビリティ", () => {
		it("ボタンとリンクが適切なロールを持つ", () => {
			renderGlobalError(defaultError, mockReset);

			const resetButton = screen.getByRole("button", { name: /再試行/ });
			expect(resetButton).toHaveAttribute("type", "button");

			const homeLink = screen.getByRole("link", { name: "ホームに戻る" });
			expect(homeLink.tagName).toBe("A");
		});

		it("キーボード操作でアクセス可能", async () => {
			const user = userEvent.setup();
			renderGlobalError(defaultError, mockReset);

			// Tabキーでフォーカス移動
			await user.tab();
			const resetButton = screen.getByRole("button", { name: /再試行/ });
			expect(resetButton).toHaveFocus();

			await user.tab();
			const homeLink = screen.getByRole("link", { name: "ホームに戻る" });
			expect(homeLink).toHaveFocus();
		});

		it("アイコンに適切なaria-labelが設定される", () => {
			renderGlobalError(defaultError, mockReset);

			const icon = screen.getByLabelText("Error icon");
			expect(icon).toHaveAttribute("role", "img");
			expect(icon).toHaveAttribute("aria-label", "Error icon");
		});
	});
});
