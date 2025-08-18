import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Category } from "../../types/expense";
import { ExpenseForm } from "./ExpenseForm";

/**
 * ExpenseFormコンポーネントのキーボードナビゲーションテスト
 *
 * Issue #250: キーボードナビゲーションの改善
 * - フォーム内でのTabキーナビゲーション
 * - ショートカットキー（Cmd+Enter で送信）
 * - アクセシビリティ属性の確認
 */
describe("ExpenseForm - キーボードナビゲーション", () => {
	const mockOnSubmit = vi.fn();
	const mockOnCancel = vi.fn();

	const mockCategories: Category[] = [
		{
			id: "1",
			name: "食費",
			type: "expense",
			color: null,
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		},
		{
			id: "2",
			name: "交通費",
			type: "expense",
			color: null,
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		},
	];

	afterEach(() => {
		mockOnSubmit.mockClear();
		mockOnCancel.mockClear();
	});

	describe("Tabキーナビゲーション", () => {
		it("すべてのフォーム要素にTabキーで順番にアクセスできる", async () => {
			const user = userEvent.setup();

			render(
				<ExpenseForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
					categories={mockCategories}
				/>,
			);

			// 最初の要素（金額）にフォーカス
			const amountInput = screen.getByLabelText(/金額/);
			amountInput.focus();
			expect(document.activeElement).toBe(amountInput);

			// Tabキーで日付フィールドに移動
			await user.tab();
			expect(document.activeElement).toBe(screen.getByLabelText(/日付/));

			// Tabキーで説明フィールドに移動
			await user.tab();
			expect(document.activeElement).toBe(screen.getByLabelText(/説明/));

			// Tabキーでカテゴリ選択に移動
			await user.tab();
			expect(document.activeElement).toBe(screen.getByLabelText(/カテゴリ/));

			// Tabキーでキャンセルボタンに移動
			await user.tab();
			expect(document.activeElement).toBe(
				screen.getByRole("button", { name: "キャンセル" }),
			);

			// Tabキーで登録ボタンに移動
			await user.tab();
			expect(document.activeElement).toBe(
				screen.getByRole("button", { name: "登録" }),
			);
		});

		it("Shift+Tabで逆方向にナビゲーションできる", async () => {
			const user = userEvent.setup();

			render(
				<ExpenseForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
					categories={mockCategories}
				/>,
			);

			// 登録ボタンにフォーカス
			const submitButton = screen.getByRole("button", { name: "登録" });
			submitButton.focus();
			expect(document.activeElement).toBe(submitButton);

			// Shift+Tabでキャンセルボタンに移動
			await user.tab({ shift: true });
			expect(document.activeElement).toBe(
				screen.getByRole("button", { name: "キャンセル" }),
			);

			// Shift+Tabでカテゴリ選択に移動
			await user.tab({ shift: true });
			expect(document.activeElement).toBe(screen.getByLabelText(/カテゴリ/));
		});
	});

	describe("ショートカットキー", () => {
		it("Cmd+Enter（Mac）またはCtrl+Enter（Windows）でフォームを送信できる", async () => {
			const user = userEvent.setup();

			render(
				<ExpenseForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
					categories={mockCategories}
				/>,
			);

			// 必須フィールドを入力（日付はデフォルトで設定済み）
			await user.type(screen.getByLabelText(/金額/), "1000");

			// デフォルトの日付を取得
			const dateInput = screen.getByLabelText(/日付/) as HTMLInputElement;
			const defaultDate = dateInput.value;

			// 任意のフィールドでCmd+Enterを押す
			const descriptionField = screen.getByLabelText(/説明/);
			descriptionField.focus();

			// Mac用のショートカット
			await user.keyboard("{Meta>}{Enter}{/Meta}");

			expect(mockOnSubmit).toHaveBeenCalledWith(
				expect.objectContaining({
					amount: 1000,
					date: defaultDate,
				}),
			);
		});

		it("Escapeキーでフォームをキャンセルできる", async () => {
			const user = userEvent.setup();

			render(
				<ExpenseForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
					categories={mockCategories}
					onEscape={mockOnCancel}
				/>,
			);

			// 任意のフィールドでEscapeキーを押す
			const amountInput = screen.getByLabelText(/金額/);
			amountInput.focus();

			await user.keyboard("{Escape}");

			expect(mockOnCancel).toHaveBeenCalled();
		});
	});

	describe("アクセシビリティ", () => {
		it("すべてのフォーム要素に適切なラベルとARIA属性がある", () => {
			render(
				<ExpenseForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
					categories={mockCategories}
				/>,
			);

			// ラベルの確認
			expect(screen.getByLabelText(/金額/)).toBeInTheDocument();
			expect(screen.getByLabelText(/日付/)).toBeInTheDocument();
			expect(screen.getByLabelText(/説明/)).toBeInTheDocument();
			expect(screen.getByLabelText(/カテゴリ/)).toBeInTheDocument();

			// 必須フィールドのaria-required属性
			expect(screen.getByLabelText(/金額/)).toHaveAttribute(
				"aria-required",
				"true",
			);
			expect(screen.getByLabelText(/日付/)).toHaveAttribute("required");
		});

		it("フォーカスインジケーターが適切に表示される", () => {
			render(
				<ExpenseForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
					categories={mockCategories}
				/>,
			);

			// フォーカスリングのクラスが適用されていることを確認
			const amountInput = screen.getByLabelText(/金額/);
			expect(amountInput.className).toContain("focus:ring-2");
			expect(amountInput.className).toContain("focus:ring-blue-500");

			const submitButton = screen.getByRole("button", { name: "登録" });
			expect(submitButton.className).toContain("focus:ring-2");
			expect(submitButton.className).toContain("focus:ring-blue-500");
		});
	});
});
