// global-error.tsx のテスト
// グローバルエラーハンドラの表示とインタラクションを検証

import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@/test-utils";
import GlobalError from "./global-error";

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
	});

	describe("基本レンダリング", () => {
		it("エラーページの基本要素が表示される", () => {
			render(<GlobalError error={defaultError} reset={mockReset} />);

			// タイトル
			expect(screen.getByText("エラーが発生しました")).toBeInTheDocument();

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
			const { container } = render(
				<GlobalError error={defaultError} reset={mockReset} />,
			);

			// テスト環境では、htmlタグはアクセスできないため、
			// メインコンテナの構造を確認
			const mainContainer = container.querySelector(".min-h-screen");
			expect(mainContainer).toBeInTheDocument();
			expect(mainContainer).toHaveClass(
				"min-h-screen",
				"flex",
				"items-center",
				"justify-center",
				"bg-gray-50",
			);
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
			render(<GlobalError error={defaultError} reset={mockReset} />);

			// 開発環境では、エラー詳細が表示される
			expect(screen.getByText("エラーが発生しました")).toBeInTheDocument();
			expect(
				screen.getByText(
					"予期しないエラーが発生しました。しばらく待ってから再度お試しください。",
				),
			).toBeInTheDocument();

			// 開発環境なので、エラーメッセージが表示される
			expect(screen.getByText("テストエラー")).toBeInTheDocument();
		});

		it("エラーダイジェストがある場合は表示される", () => {
			render(<GlobalError error={errorWithDigest} reset={mockReset} />);

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
			render(<GlobalError error={defaultError} reset={mockReset} />);

			expect(screen.queryByText("テストエラー")).not.toBeInTheDocument();
		});
	});

	describe("インタラクション", () => {
		it("再試行ボタンをクリックするとreset関数が呼ばれる", async () => {
			const user = userEvent.setup();
			render(<GlobalError error={defaultError} reset={mockReset} />);

			const resetButton = screen.getByRole("button", { name: "再試行" });
			await user.click(resetButton);

			await waitFor(() => {
				expect(mockReset).toHaveBeenCalledTimes(1);
			});
		});

		it("ホームに戻るリンクが正しいhref属性を持つ", () => {
			render(<GlobalError error={defaultError} reset={mockReset} />);

			const homeLink = screen.getByRole("link", { name: "ホームに戻る" });
			expect(homeLink).toHaveAttribute("href", "/");
		});
	});

	describe("スタイリング", () => {
		it("再試行ボタンに適切なクラスが適用される", () => {
			render(<GlobalError error={defaultError} reset={mockReset} />);

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
			render(<GlobalError error={defaultError} reset={mockReset} />);

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

	describe("アクセシビリティ", () => {
		it("ボタンとリンクが適切なロールを持つ", () => {
			render(<GlobalError error={defaultError} reset={mockReset} />);

			const resetButton = screen.getByRole("button", { name: "再試行" });
			expect(resetButton).toHaveAttribute("type", "button");

			const homeLink = screen.getByRole("link", { name: "ホームに戻る" });
			expect(homeLink.tagName).toBe("A");
		});

		it("キーボード操作でアクセス可能", async () => {
			const user = userEvent.setup();
			render(<GlobalError error={defaultError} reset={mockReset} />);

			// Tabキーでフォーカス移動
			await user.tab();
			const resetButton = screen.getByRole("button", { name: "再試行" });
			expect(resetButton).toHaveFocus();

			await user.tab();
			const homeLink = screen.getByRole("link", { name: "ホームに戻る" });
			expect(homeLink).toHaveFocus();
		});
	});
});
