/**
 * NewExpenseDialogコンポーネントのテスト
 *
 * テスト内容:
 * - 送信処理とエラーハンドリング（重点）
 * - カテゴリデータのインテグレーション
 * - 送信中の状態管理
 *
 * 注: UI表示・インタラクションテストはStorybookに移行済み
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Category } from "../../lib/api/types";
import { NewExpenseDialog } from "./NewExpenseDialog";

// グローバルカテゴリ設定のモック
vi.mock("@shared/config/categories", () => ({
	getCategoriesByType: vi.fn(() => [
		{ id: "food", name: "食費", type: "expense", color: "#FF6B6B" },
		{ id: "transportation", name: "交通費", type: "expense", color: "#3498DB" },
	]),
	ALL_CATEGORIES: [
		{
			id: "food",
			numericId: 3,
			name: "食費",
			type: "expense",
			color: "#FF6B6B",
			description: "食材、外食、飲食代",
		},
		{
			id: "transportation",
			numericId: 4,
			name: "交通費",
			type: "expense",
			color: "#3498DB",
			description: "電車、バス、タクシー、ガソリン代",
		},
	],
}));

// UIコンポーネントのモック
vi.mock("../ui/Dialog", () => ({
	Dialog: vi.fn(({ isOpen, children }) => {
		if (!isOpen) return null;
		return <div data-testid="dialog">{children}</div>;
	}),
}));

// ExpenseFormコンポーネントのモック
vi.mock("./ExpenseForm", () => ({
	ExpenseForm: vi.fn(({ onSubmit, categories }) => (
		<form data-testid="expense-form">
			<div data-testid="categories-count">{categories?.length || 0}</div>
			<button
				type="button"
				onClick={() =>
					onSubmit({
						amount: 1000,
						description: "テスト支出",
						date: "2024-01-01",
						categoryId: "category-1",
					})
				}
				data-testid="submit-button"
			>
				送信
			</button>
		</form>
	)),
}));

describe("NewExpenseDialog", () => {
	const mockOnClose = vi.fn();
	const mockOnSubmit = vi.fn();

	const mockCategories: Category[] = [
		{
			id: "category-1",
			name: "食費",
			type: "expense",
			color: "#FF0000",
			createdAt: "2024-01-01T00:00:00.000Z",
			updatedAt: "2024-01-01T00:00:00.000Z",
		},
		{
			id: "category-2",
			name: "交通費",
			type: "expense",
			color: "#00FF00",
			createdAt: "2024-01-01T00:00:00.000Z",
			updatedAt: "2024-01-01T00:00:00.000Z",
		},
	];

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("カテゴリの処理", () => {
		it("propsとグローバル設定のカテゴリ使用が正しく動作する", () => {
			// propsでカテゴリが提供された場合
			const { rerender } = render(
				<NewExpenseDialog
					isOpen={true}
					onClose={mockOnClose}
					onSubmit={mockOnSubmit}
					categories={mockCategories}
				/>,
			);

			expect(screen.getByTestId("categories-count")).toHaveTextContent("2");

			// propsでカテゴリが提供されない場合
			rerender(
				<NewExpenseDialog
					isOpen={true}
					onClose={mockOnClose}
					onSubmit={mockOnSubmit}
				/>,
			);

			expect(screen.getByTestId("categories-count")).toHaveTextContent("2");
		});
	});

	describe("フォーム送信", () => {
		it("フォーム送信成功時のフローが正しく動作する", async () => {
			mockOnSubmit.mockResolvedValueOnce(undefined);

			render(
				<NewExpenseDialog
					isOpen={true}
					onClose={mockOnClose}
					onSubmit={mockOnSubmit}
				/>,
			);

			const submitButton = screen.getByTestId("submit-button");
			fireEvent.click(submitButton);

			await waitFor(() => {
				expect(mockOnSubmit).toHaveBeenCalledWith({
					amount: 1000,
					description: "テスト支出",
					date: "2024-01-01",
					categoryId: "category-1",
				});
				expect(mockOnClose).toHaveBeenCalled();
			});
		});

		it("フォーム送信エラー時、エラーメッセージが表示される", async () => {
			const errorMessage = "サーバーエラーが発生しました";
			mockOnSubmit.mockRejectedValueOnce(new Error(errorMessage));

			render(
				<NewExpenseDialog
					isOpen={true}
					onClose={mockOnClose}
					onSubmit={mockOnSubmit}
				/>,
			);

			const submitButton = screen.getByTestId("submit-button");
			fireEvent.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText("登録に失敗しました")).toBeInTheDocument();
				expect(screen.getByText(errorMessage)).toBeInTheDocument();
				expect(mockOnClose).not.toHaveBeenCalled();
			});
		});
	});
});
