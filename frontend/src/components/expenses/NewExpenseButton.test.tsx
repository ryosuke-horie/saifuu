/**
 * NewExpenseButtonコンポーネントのテスト
 *
 * 関連Issue: #93 支出管理メインページ実装
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NewExpenseButton } from "./NewExpenseButton";

describe("NewExpenseButton", () => {
	it("ボタンが正しくレンダリングされる", () => {
		render(<NewExpenseButton />);

		const button = screen.getByRole("button", { name: "新しい支出を登録" });
		expect(button).toBeInTheDocument();
		expect(button).toHaveTextContent("新規登録");
	});

	it("プラスアイコンが表示される", () => {
		render(<NewExpenseButton />);

		const svg = screen.getByRole("button").querySelector("svg");
		expect(svg).toBeInTheDocument();
		expect(svg).toHaveAttribute("aria-hidden", "true");
	});

	it("クリックイベントが正しく発火する", () => {
		const handleClick = vi.fn();
		render(<NewExpenseButton onClick={handleClick} />);

		const button = screen.getByRole("button");
		fireEvent.click(button);

		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it("disabledプロパティが正しく機能する", () => {
		const handleClick = vi.fn();
		render(<NewExpenseButton onClick={handleClick} disabled />);

		const button = screen.getByRole("button");
		expect(button).toBeDisabled();

		fireEvent.click(button);
		expect(handleClick).not.toHaveBeenCalled();
	});

	it("カスタムクラス名が適用される", () => {
		const customClass = "custom-button-class";
		render(<NewExpenseButton className={customClass} />);

		const button = screen.getByRole("button");
		expect(button.className).toContain(customClass);
	});

	it("onClickが未定義でもエラーにならない", () => {
		render(<NewExpenseButton />);

		const button = screen.getByRole("button");
		// エラーが発生しないことを確認
		expect(() => fireEvent.click(button)).not.toThrow();
	});

	it("デフォルトのスタイルクラスが適用される", () => {
		render(<NewExpenseButton />);

		const button = screen.getByRole("button");
		expect(button.className).toContain("bg-blue-600");
		expect(button.className).toContain("text-white");
		expect(button.className).toContain("rounded-md");
		expect(button.className).toContain("shadow-sm");
	});

	it("disabled状態のスタイルクラスが適用される", () => {
		render(<NewExpenseButton disabled />);

		const button = screen.getByRole("button");
		expect(button.className).toContain("disabled:opacity-50");
		expect(button.className).toContain("disabled:cursor-not-allowed");
	});

	it("アクセシビリティ属性が正しく設定される", () => {
		render(<NewExpenseButton />);

		const button = screen.getByRole("button");
		expect(button).toHaveAttribute("type", "button");
		expect(button).toHaveAttribute("aria-label", "新しい支出を登録");
	});
});
