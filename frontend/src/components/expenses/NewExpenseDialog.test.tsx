/**
 * NewExpenseDialogコンポーネントのテスト
 * 
 * 関連Issue: #93 支出管理メインページ実装
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { NewExpenseDialog } from "./NewExpenseDialog";
import type { Category } from "../../lib/api/types";

// グローバルカテゴリ設定のモック
vi.mock("../../../../shared/config/categories", () => ({
	getCategoriesByType: vi.fn(() => [
		{
			id: "global-category-1",
			name: "グローバル食費",
			type: "expense",
			color: "#FF0000",
		},
		{
			id: "global-category-2",
			name: "グローバル交通費",
			type: "expense",
			color: "#00FF00",
		},
	]),
}));

// UIコンポーネントのモック
vi.mock("../ui/Dialog", () => ({
	Dialog: vi.fn(({ isOpen, onClose, title, children, closeOnOverlayClick, closeOnEsc }) => {
		if (!isOpen) return null;
		return (
			<div data-testid="dialog" data-close-on-overlay={closeOnOverlayClick} data-close-on-esc={closeOnEsc}>
				<h2>{title}</h2>
				<button onClick={onClose} aria-label="閉じる">×</button>
				{children}
			</div>
		);
	}),
}));

// ExpenseFormコンポーネントのモック
vi.mock("./ExpenseForm", () => ({
	ExpenseForm: vi.fn(({ onSubmit, onCancel, isSubmitting, categories }) => (
		<form data-testid="expense-form">
			<div data-testid="categories-count">{categories?.length || 0}</div>
			<button
				type="button"
				onClick={() => onSubmit({
					amount: 1000,
					description: "テスト支出",
					date: "2024-01-01",
					categoryId: "category-1",
				})}
				disabled={isSubmitting}
				data-testid="submit-button"
			>
				{isSubmitting ? "送信中..." : "送信"}
			</button>
			<button
				type="button"
				onClick={onCancel}
				data-testid="cancel-button"
			>
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
				/>
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
				/>
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
				/>
			);
			
			expect(screen.getByTestId("categories-count")).toHaveTextContent("2");
		});

		it("propsでカテゴリが提供されない場合、グローバル設定を使用する", () => {
			render(
				<NewExpenseDialog
					isOpen={true}
					onClose={mockOnClose}
					onSubmit={mockOnSubmit}
				/>
			);
			
			expect(screen.getByTestId("categories-count")).toHaveTextContent("2");
		});

		it("空のカテゴリ配列が提供された場合、グローバル設定を使用する", () => {
			render(
				<NewExpenseDialog
					isOpen={true}
					onClose={mockOnClose}
					onSubmit={mockOnSubmit}
					categories={[]}
				/>
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
				/>
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
				/>
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
				/>
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
				/>
			);
			
			const cancelButton = screen.getByTestId("cancel-button");
			fireEvent.click(cancelButton);
			
			expect(mockOnClose).toHaveBeenCalled();
		});

		it("ダイアログの×ボタンクリックで閉じる", () => {
			render(
				<NewExpenseDialog
					isOpen={true}
					onClose={mockOnClose}
					onSubmit={mockOnSubmit}
				/>
			);
			
			const closeButton = screen.getByLabelText("閉じる");
			fireEvent.click(closeButton);
			
			expect(mockOnClose).toHaveBeenCalled();
		});

		it("送信中はオーバーレイクリックで閉じない", () => {
			render(
				<NewExpenseDialog
					isOpen={true}
					onClose={mockOnClose}
					onSubmit={mockOnSubmit}
					isSubmitting={true}
				/>
			);
			
			const dialog = screen.getByTestId("dialog");
			expect(dialog).toHaveAttribute("data-close-on-overlay", "false");
			expect(dialog).toHaveAttribute("data-close-on-esc", "false");
		});

		it("送信中でない場合はオーバーレイクリックで閉じる", () => {
			render(
				<NewExpenseDialog
					isOpen={true}
					onClose={mockOnClose}
					onSubmit={mockOnSubmit}
					isSubmitting={false}
				/>
			);
			
			const dialog = screen.getByTestId("dialog");
			expect(dialog).toHaveAttribute("data-close-on-overlay", "true");
			expect(dialog).toHaveAttribute("data-close-on-esc", "true");
		});
	});

	describe("エラー処理", () => {
		it("エラーメッセージがクリアされる（ダイアログクローズ時）", async () => {
			const errorMessage = "エラーが発生しました";
			mockOnSubmit.mockRejectedValueOnce(new Error(errorMessage));
			
			const { rerender } = render(
				<NewExpenseDialog
					isOpen={true}
					onClose={mockOnClose}
					onSubmit={mockOnSubmit}
				/>
			);
			
			// エラーを発生させる
			fireEvent.click(screen.getByTestId("submit-button"));
			
			await waitFor(() => {
				expect(screen.getByText(errorMessage)).toBeInTheDocument();
			});
			
			// ダイアログを閉じて再度開く
			rerender(
				<NewExpenseDialog
					isOpen={false}
					onClose={mockOnClose}
					onSubmit={mockOnSubmit}
				/>
			);
			
			rerender(
				<NewExpenseDialog
					isOpen={true}
					onClose={mockOnClose}
					onSubmit={mockOnSubmit}
				/>
			);
			
			// エラーメッセージが表示されていないことを確認
			expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
		});

		it("エラーがオブジェクトでない場合のフォールバック", async () => {
			mockOnSubmit.mockRejectedValueOnce("文字列エラー");
			
			render(
				<NewExpenseDialog
					isOpen={true}
					onClose={mockOnClose}
					onSubmit={mockOnSubmit}
				/>
			);
			
			fireEvent.click(screen.getByTestId("submit-button"));
			
			await waitFor(() => {
				expect(screen.getByText("取引の作成に失敗しました")).toBeInTheDocument();
			});
		});
	});
});