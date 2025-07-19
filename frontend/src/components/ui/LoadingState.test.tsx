import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LoadingState } from "./LoadingState";

describe("LoadingState", () => {
	// メッセージのテスト
	it("デフォルトメッセージが表示される", () => {
		render(<LoadingState />);
		expect(screen.getByText("読み込み中...")).toBeInTheDocument();
	});

	it("カスタムメッセージを表示できる", () => {
		render(<LoadingState message="データを取得しています" />);
		expect(screen.getByText("データを取得しています")).toBeInTheDocument();
	});

	// レイアウトバリエーションのテスト
	it("inlineレイアウトの場合、適切なクラスが適用される", () => {
		const { container } = render(<LoadingState layout="inline" />);
		const wrapper = container.firstChild;
		expect(wrapper).toHaveClass("inline-flex", "items-center", "space-x-2");
	});

	it("blockレイアウトの場合、適切なクラスが適用される", () => {
		const { container } = render(<LoadingState layout="block" />);
		const wrapper = container.firstChild;
		expect(wrapper).toHaveClass(
			"flex",
			"items-center",
			"justify-center",
			"space-x-2",
			"py-8",
		);
	});

	it("fullpageレイアウトの場合、画面全体のスタイルが適用される", () => {
		const { container } = render(<LoadingState layout="fullpage" />);
		const wrapper = container.firstChild;
		expect(wrapper).toHaveClass(
			"fixed",
			"inset-0",
			"bg-white",
			"bg-opacity-75",
			"z-50",
		);
	});

	// サイズの継承テスト
	it("Spinnerコンポーネントにサイズが渡される", () => {
		const { container } = render(<LoadingState size="lg" />);
		const spinner = container.querySelector('[role="status"]');
		expect(spinner).toHaveClass("h-8", "w-8");
	});

	// testIdのテスト
	it("デフォルトのtestIdが設定される", () => {
		render(<LoadingState />);
		expect(screen.getByTestId("loading-state")).toBeInTheDocument();
	});

	it("カスタムtestIdを設定できる", () => {
		render(<LoadingState testId="custom-loading" />);
		expect(screen.getByTestId("custom-loading")).toBeInTheDocument();
	});

	// デフォルト値のテスト
	it("デフォルトではblockレイアウトが適用される", () => {
		const { container } = render(<LoadingState />);
		const wrapper = container.firstChild;
		expect(wrapper).toHaveClass("flex", "items-center", "justify-center");
	});

	// テキストカラーのテスト
	it("テキストにグレーカラーが適用される", () => {
		render(<LoadingState />);
		const text = screen.getByText("読み込み中...");
		expect(text).toHaveClass("text-gray-600");
	});
});
