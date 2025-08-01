import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageLoader } from "./PageLoader";

describe("PageLoader", () => {
	it("デフォルトのローディングメッセージを表示する", () => {
		render(<PageLoader />);

		const loadingText = screen.getByText("読み込み中...");
		expect(loadingText).toBeInTheDocument();
	});

	it("カスタムメッセージを表示できる", () => {
		const customMessage = "データを取得しています";
		render(<PageLoader message={customMessage} />);

		const loadingText = screen.getByText(customMessage);
		expect(loadingText).toBeInTheDocument();
	});

	it("スピナーアニメーションを表示する", () => {
		render(<PageLoader />);

		const spinner = screen.getByTestId("page-loader-spinner");
		expect(spinner).toBeInTheDocument();
		expect(spinner).toHaveClass("animate-spin");
	});

	it("適切なaria属性を持つ", () => {
		render(<PageLoader />);

		const loader = screen.getByRole("status");
		expect(loader).toBeInTheDocument();
		expect(loader).toHaveAttribute("aria-live", "polite");
	});

	it("中央に配置される", () => {
		render(<PageLoader />);

		const container = screen.getByTestId("page-loader-container");
		expect(container).toHaveClass("flex", "items-center", "justify-center");
	});

	it("最小高さを持つ", () => {
		render(<PageLoader />);

		const container = screen.getByTestId("page-loader-container");
		expect(container).toHaveClass("min-h-[200px]");
	});
});
