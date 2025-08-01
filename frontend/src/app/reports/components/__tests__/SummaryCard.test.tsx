import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SummaryCard } from "../SummaryCard";

describe("SummaryCard", () => {
	it("タイトルと値を正しく表示する", () => {
		render(<SummaryCard title="総収入" value="¥1,000,000" />);

		expect(screen.getByText("総収入")).toBeInTheDocument();
		expect(screen.getByText("¥1,000,000")).toBeInTheDocument();
	});

	it("カスタムクラスを適用する", () => {
		render(
			<SummaryCard title="総支出" value="¥500,000" className="text-red-600" />,
		);

		const valueElement = screen.getByText("¥500,000");
		expect(valueElement).toHaveClass("text-red-600");
	});

	it("ReactNodeを値として受け取る", () => {
		const customValue = <span data-testid="custom-value">カスタム値</span>;
		render(<SummaryCard title="テスト" value={customValue} />);

		expect(screen.getByTestId("custom-value")).toBeInTheDocument();
	});
});
