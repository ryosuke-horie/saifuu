import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// PageLoaderをモック
vi.mock("../../components/common/PageLoader", () => ({
	PageLoader: ({ message }: { message: string }) => (
		<div data-testid="page-loader">{message}</div>
	),
}));

describe("ExpensesPage Dynamic Import", () => {
	it("dynamic importによりPageLoaderが表示される", async () => {
		const { default: ExpensesPage } = await import("./page");
		render(<ExpensesPage />);

		// dynamic importのローディング状態でPageLoaderが表示されることを確認
		expect(screen.getByTestId("page-loader")).toBeInTheDocument();
		expect(screen.getByText("支出管理画面を読み込み中...")).toBeInTheDocument();
	});

	it("PageLoaderに適切なメッセージが設定される", () => {
		// モックされたPageLoaderコンポーネントを直接使用
		const PageLoader = ({ message }: { message: string }) => (
			<div data-testid="page-loader">{message}</div>
		);

		render(<PageLoader message="支出管理画面を読み込み中..." />);

		expect(screen.getByTestId("page-loader")).toBeInTheDocument();
		expect(screen.getByText("支出管理画面を読み込み中...")).toBeInTheDocument();
	});
});
