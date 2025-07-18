/**
 * NewExpenseDialogコンポーネントのテスト
 *
 * 関連Issue: #93 支出管理メインページ実装
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
}));

// UIコンポーネントのモック
vi.mock("../ui/Dialog", () => ({
	Dialog: vi.fn(
		({ isOpen, onClose, title, children, closeOnOverlayClick, closeOnEsc }) => {
			if (!isOpen) return null;
			return (
				<div
					data-testid="dialog"
					data-close-on-overlay={closeOnOverlayClick}
					data-close-on-esc={closeOnEsc}
				>
					<h2>{title}</h2>
					<button type="button" onClick={onClose} aria-label="閉じる">
						×
					</button>
					{children}
				</div>
			);
		},
	),
}));

// ExpenseFormコンポーネントのモック
vi.mock("./ExpenseForm", () => ({
	ExpenseForm: vi.fn(({ onSubmit, onCancel, isSubmitting, categories }) => (
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
				disabled={isSubmitting}
				data-testid="submit-button"
			>
				{isSubmitting ? "送信中..." : "送信"}
			</button>
			<button type="button" onClick={onCancel} data-testid="cancel-button">
				キャンセル
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

	describe("ダイアログの表示制御", () => {
		it("isOpenがtrueの時、ダイアログが表示される", () => {
			render(
				<NewExpenseDialog
					isOpen={true}
					onClose={mockOnClose}
					onSubmit={mockOnSubmit}
				/>,
			);

			expect(screen.getByTestId("dialog")).toBeInTheDocument();
			expect(screen.getByText("新規取引登録")).toBeInTheDocument();
		});

		it("isOpenがfalseの時、ダイアログが表示されない", () => {
			render(
				<NewExpenseDialog
					isOpen={false}
					onClose={mockOnClose}
					onSubmit={mockOnSubmit}
				/>,
			);

			expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
		});
	});

	describe("カテゴリの処理", () => {
		it("propsでカテゴリが提供された場合、それを使用する", () => {
			render(
				<NewExpenseDialog
					isOpen={true}
					onClose={mockOnClose}
					onSubmit={mockOnSubmit}
					categories={mockCategories}
				/>,
			);

			expect(screen.getByTestId("categories-count")).toHaveTextContent("2");
		});

		it("propsでカテゴリが提供されない場合、グローバル設定を使用する", () => {
			render(
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
		it("フォーム送信成功時、onSubmitが呼ばれてダイアログが閉じる", async () => {
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

		it("送信中はボタンが無効化される", () => {
			render(
				<NewExpenseDialog
					isOpen={true}
					onClose={mockOnClose}
					onSubmit={mockOnSubmit}
					isSubmitting={true}
				/>,
			);

			const submitButton = screen.getByTestId("submit-button");
			expect(submitButton).toBeDisabled();
			expect(submitButton).toHaveTextContent("送信中...");
		});
	});

	describe("ダイアログのクローズ処理", () => {
		it("キャンセルボタンクリックでダイアログが閉じる", () => {
			render(
				<NewExpenseDialog
					isOpen={true}
					onClose={mockOnClose}
					onSubmit={mockOnSubmit}
				/>,
			);

			const cancelButton = screen.getByTestId("cancel-button");
			fireEvent.click(cancelButton);

			expect(mockOnClose).toHaveBeenCalled();
		});

		it("送信中はオーバーレイクリックで閉じない", () => {
			render(
				<NewExpenseDialog
					isOpen={true}
					onClose={mockOnClose}
					onSubmit={mockOnSubmit}
					isSubmitting={true}
				/>,
			);

			const dialog = screen.getByTestId("dialog");
			expect(dialog).toHaveAttribute("data-close-on-overlay", "false");
		});
	});
});
