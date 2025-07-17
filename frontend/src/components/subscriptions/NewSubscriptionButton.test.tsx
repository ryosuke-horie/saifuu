import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NewSubscriptionButton } from "./NewSubscriptionButton";

/**
 * NewSubscriptionButtonコンポーネントのテスト
 *
 * 重要な動作のみをテスト:
 * - 基本的なレンダリング
 * - クリックハンドラーの動作
 * - 無効状態の動作
 * - 必須のアクセシビリティ属性
 */
describe("NewSubscriptionButton", () => {
	it("正常にレンダリングされること", () => {
		render(<NewSubscriptionButton />);

		const button = screen.getByRole("button", {
			name: "新しいサブスクリプションを登録",
		});
		expect(button).toBeInTheDocument();
		expect(button).toHaveTextContent("新規登録");
	});

	it("クリックハンドラーが実行されること", () => {
		const mockOnClick = vi.fn();
		render(<NewSubscriptionButton onClick={mockOnClick} />);

		const button = screen.getByRole("button");
		fireEvent.click(button);

		expect(mockOnClick).toHaveBeenCalledTimes(1);
	});

	it("無効状態ではクリックイベントが発火しないこと", () => {
		const mockOnClick = vi.fn();
		render(<NewSubscriptionButton onClick={mockOnClick} disabled={true} />);

		const button = screen.getByRole("button");
		expect(button).toBeDisabled();

		fireEvent.click(button);
		expect(mockOnClick).not.toHaveBeenCalled();
	});

	it("適切なアクセシビリティ属性が設定されていること", () => {
		render(<NewSubscriptionButton />);

		const button = screen.getByRole("button");
		expect(button).toHaveAttribute(
			"aria-label",
			"新しいサブスクリプションを登録",
		);
		expect(button).toHaveAttribute("type", "button");
	});
});
