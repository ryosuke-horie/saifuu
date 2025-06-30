import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NewSubscriptionButton } from "./NewSubscriptionButton";

/**
 * NewSubscriptionButtonコンポーネントのテスト
 *
 * テスト内容:
 * - 基本的なレンダリング
 * - クリックイベント
 * - 無効状態
 * - アクセシビリティ
 * - カスタムプロパティ
 */

describe("NewSubscriptionButton", () => {
	beforeEach(() => {
		// 各テスト前にモックをリセット
		vi.clearAllMocks();
	});

	describe("基本的なレンダリング", () => {
		it("正常にレンダリングされること", () => {
			render(<NewSubscriptionButton />);

			const button = screen.getByRole("button", {
				name: "新しいサブスクリプションを登録",
			});
			expect(button).toBeInTheDocument();
			expect(button).toHaveTextContent("新規登録");
		});

		it("プラスアイコンが表示されること", () => {
			render(<NewSubscriptionButton />);

			const svg = document.querySelector("svg");
			expect(svg).toBeInTheDocument();
			expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
		});

		it("カスタムクラス名が適用されること", () => {
			render(<NewSubscriptionButton className="custom-class" />);

			const button = screen.getByRole("button");
			expect(button).toHaveClass("custom-class");
		});
	});

	describe("クリックイベント", () => {
		it("onClickが提供されていない場合、何も実行されない", () => {
			render(<NewSubscriptionButton />);

			const button = screen.getByRole("button");
			// エラーが発生しないことを確認
			expect(() => fireEvent.click(button)).not.toThrow();
		});

		it("カスタムクリックハンドラーが実行されること", () => {
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
			fireEvent.click(button);

			expect(mockOnClick).not.toHaveBeenCalled();
		});
	});

	describe("無効状態", () => {
		it("無効状態が正しく設定されること", () => {
			render(<NewSubscriptionButton disabled={true} />);

			const button = screen.getByRole("button");
			expect(button).toBeDisabled();
		});

		it("無効状態で適切なスタイルが適用されること", () => {
			render(<NewSubscriptionButton disabled={true} />);

			const button = screen.getByRole("button");
			expect(button).toHaveClass("disabled:opacity-50");
			expect(button).toHaveClass("disabled:cursor-not-allowed");
			expect(button).toHaveClass("disabled:hover:bg-blue-600");
		});

		it("有効状態がデフォルトであること", () => {
			render(<NewSubscriptionButton />);

			const button = screen.getByRole("button");
			expect(button).not.toBeDisabled();
		});
	});

	describe("アクセシビリティ", () => {
		it("適切なARIAラベルが設定されていること", () => {
			render(<NewSubscriptionButton />);

			const button = screen.getByRole("button");
			expect(button).toHaveAttribute(
				"aria-label",
				"新しいサブスクリプションを登録",
			);
		});

		it("ボタンタイプが正しく設定されていること", () => {
			render(<NewSubscriptionButton />);

			const button = screen.getByRole("button");
			expect(button).toHaveAttribute("type", "button");
		});

		it("SVGアイコンが支援技術から隠されていること", () => {
			render(<NewSubscriptionButton />);

			const svg = document.querySelector("svg");
			expect(svg).toHaveAttribute("aria-hidden", "true");
		});

		it("フォーカス可能であること", () => {
			render(<NewSubscriptionButton />);

			const button = screen.getByRole("button");
			button.focus();
			expect(document.activeElement).toBe(button);
		});
	});

	describe("スタイリング", () => {
		it("基本的なスタイルクラスが適用されていること", () => {
			render(<NewSubscriptionButton />);

			const button = screen.getByRole("button");
			expect(button).toHaveClass("inline-flex");
			expect(button).toHaveClass("items-center");
			expect(button).toHaveClass("bg-blue-600");
			expect(button).toHaveClass("text-white");
			expect(button).toHaveClass("rounded-md");
		});

		it("ホバー効果のクラスが適用されていること", () => {
			render(<NewSubscriptionButton />);

			const button = screen.getByRole("button");
			expect(button).toHaveClass("hover:bg-blue-700");
		});

		it("フォーカス効果のクラスが適用されていること", () => {
			render(<NewSubscriptionButton />);

			const button = screen.getByRole("button");
			expect(button).toHaveClass("focus:outline-none");
			expect(button).toHaveClass("focus:ring-2");
			expect(button).toHaveClass("focus:ring-blue-500");
		});
	});

	describe("プロパティの組み合わせ", () => {
		it("全てのプロパティが同時に正しく動作すること", () => {
			const mockOnClick = vi.fn();
			render(
				<NewSubscriptionButton
					onClick={mockOnClick}
					disabled={false}
					className="custom-test-class"
				/>,
			);

			const button = screen.getByRole("button");

			// クラス名の確認
			expect(button).toHaveClass("custom-test-class");

			// 有効状態の確認
			expect(button).not.toBeDisabled();

			// クリック機能の確認
			fireEvent.click(button);
			expect(mockOnClick).toHaveBeenCalledTimes(1);
		});

		it("無効状態とカスタムクリックハンドラーの組み合わせ", () => {
			const mockOnClick = vi.fn();
			render(<NewSubscriptionButton onClick={mockOnClick} disabled={true} />);

			const button = screen.getByRole("button");
			fireEvent.click(button);

			expect(button).toBeDisabled();
			expect(mockOnClick).not.toHaveBeenCalled();
		});
	});
});
