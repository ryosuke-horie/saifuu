import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { vi } from "vitest";
import ErrorPage from "./error";

// Next.jsのuseRouterをモック
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: mockPush,
	}),
}));

describe("ErrorPage", () => {
	const mockReset = vi.fn();
	const defaultProps = {
		error: new Error("テストエラー"),
		reset: mockReset,
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("エラーページが正常に表示される", () => {
		render(<ErrorPage {...defaultProps} />);

		expect(screen.getByText("エラーが発生しました")).toBeInTheDocument();
		expect(
			screen.getByText("予期しないエラーが発生しました。"),
		).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "再試行" })).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "ホームに戻る" }),
		).toBeInTheDocument();
	});

	it("再試行ボタンをクリックするとreset関数が呼ばれる", async () => {
		const user = userEvent.setup();
		render(<ErrorPage {...defaultProps} />);

		const retryButton = screen.getByRole("button", { name: "再試行" });
		await user.click(retryButton);

		expect(mockReset).toHaveBeenCalledTimes(1);
	});

	it("ホームに戻るボタンをクリックするとrouterのpushが呼ばれる", async () => {
		const user = userEvent.setup();
		render(<ErrorPage {...defaultProps} />);

		const homeButton = screen.getByRole("button", { name: "ホームに戻る" });
		await user.click(homeButton);

		expect(mockPush).toHaveBeenCalledWith("/");
	});

	it("開発環境でエラーメッセージが表示される", () => {
		const originalNodeEnv = process.env.NODE_ENV;
		// @ts-expect-error: テスト環境でのNODE_ENV変更のため
		process.env.NODE_ENV = "development";

		render(<ErrorPage {...defaultProps} />);

		expect(screen.getByText("テストエラー")).toBeInTheDocument();

		// @ts-expect-error: テスト環境でのNODE_ENV復元のため
		process.env.NODE_ENV = originalNodeEnv;
	});

	it("本番環境でエラーメッセージが表示されない", () => {
		const originalNodeEnv = process.env.NODE_ENV;
		// @ts-expect-error: テスト環境でのNODE_ENV変更のため
		process.env.NODE_ENV = "production";

		render(<ErrorPage {...defaultProps} />);

		expect(screen.queryByText("テストエラー")).not.toBeInTheDocument();

		// @ts-expect-error: テスト環境でのNODE_ENV復元のため
		process.env.NODE_ENV = originalNodeEnv;
	});

	it("digestプロパティがある場合にエラーIDが表示される", () => {
		const originalNodeEnv = process.env.NODE_ENV;
		// @ts-expect-error: テスト環境でのNODE_ENV変更のため
		process.env.NODE_ENV = "development";

		const errorWithDigest = new Error("テストエラー") as Error & {
			digest?: string;
		};
		errorWithDigest.digest = "error123";

		render(<ErrorPage error={errorWithDigest} reset={mockReset} />);

		expect(screen.getByText("Error ID: error123")).toBeInTheDocument();

		// @ts-expect-error: テスト環境でのNODE_ENV復元のため
		process.env.NODE_ENV = originalNodeEnv;
	});

	it("digestプロパティがない場合にエラーIDが表示されない", () => {
		const originalNodeEnv = process.env.NODE_ENV;
		// @ts-expect-error: テスト環境でのNODE_ENV変更のため
		process.env.NODE_ENV = "development";

		render(<ErrorPage {...defaultProps} />);

		expect(screen.queryByText(/Error ID:/)).not.toBeInTheDocument();

		// @ts-expect-error: テスト環境でのNODE_ENV復元のため
		process.env.NODE_ENV = originalNodeEnv;
	});

	it("適切なアクセシビリティ属性が設定されている", () => {
		render(<ErrorPage {...defaultProps} />);

		// roleとaria-labelledbyが設定されているかチェック
		const errorContainer = screen.getByRole("alert");
		expect(errorContainer).toBeInTheDocument();

		// ボタンのアクセシビリティ
		const retryButton = screen.getByRole("button", { name: "再試行" });
		const homeButton = screen.getByRole("button", { name: "ホームに戻る" });

		expect(retryButton).toBeInTheDocument();
		expect(homeButton).toBeInTheDocument();
	});
});
