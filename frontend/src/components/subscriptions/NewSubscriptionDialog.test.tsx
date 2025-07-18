import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockCategories } from "../../../.storybook/mocks/data/categories";
import type { NewSubscriptionDialogProps } from "../../lib/api/types";
import { NewSubscriptionDialog } from "./NewSubscriptionDialog";

// createPortalのモック
vi.mock("react-dom", async () => {
	const actual = await vi.importActual("react-dom");
	return {
		...actual,
		createPortal: (children: React.ReactNode) => children,
	};
});

// グローバルカテゴリ設定をモック
vi.mock("@shared/config/categories", () => ({
	EXPENSE_CATEGORIES: [
		{
			id: "food",
			numericId: 3,
			name: "食費",
			type: "expense",
			color: "#FF6B6B",
			description: "食材、外食、飲食代",
		},
		{
			id: "system",
			numericId: 6,
			name: "システム関係費",
			type: "expense",
			color: "#27AE60",
			description: "システム利用料、サブスクリプション費用",
		},
	],
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
			id: "system",
			numericId: 6,
			name: "システム関係費",
			type: "expense",
			color: "#27AE60",
			description: "システム利用料、サブスクリプション費用",
		},
	],
	getCategoriesByType: vi.fn(() => [
		{ id: "food", name: "食費", type: "expense", color: "#FF6B6B" },
		{ id: "system", name: "システム関係費", type: "expense", color: "#27AE60" },
	]),
}));

describe("NewSubscriptionDialog", () => {
	const defaultProps: NewSubscriptionDialogProps = {
		isOpen: true,
		onClose: vi.fn(),
		onSubmit: vi.fn(),
		isSubmitting: false,
		categories: mockCategories,
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("基本的な表示", () => {
		it("ダイアログが開いている場合、適切に表示される", () => {
			render(<NewSubscriptionDialog {...defaultProps} />);

			// ダイアログが表示されていることを確認
			expect(screen.getByRole("dialog")).toBeInTheDocument();
			expect(
				screen.getByText("新規サブスクリプション登録"),
			).toBeInTheDocument();
		});

		it("ダイアログが閉じている場合、何も表示されない", () => {
			render(<NewSubscriptionDialog {...defaultProps} isOpen={false} />);

			// ダイアログが表示されていないことを確認
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
		});

		it("フォームの各要素が正しく表示される", () => {
			render(<NewSubscriptionDialog {...defaultProps} />);

			// フォーム要素の存在確認
			expect(screen.getByLabelText(/サービス名/)).toBeInTheDocument();
			expect(screen.getByLabelText(/料金/)).toBeInTheDocument();
			expect(screen.getByLabelText(/請求サイクル/)).toBeInTheDocument();
			expect(screen.getByLabelText(/次回請求日/)).toBeInTheDocument();
			expect(screen.getByLabelText(/カテゴリ/)).toBeInTheDocument();
			expect(screen.getByLabelText(/説明/)).toBeInTheDocument();

			// ボタンの存在確認
			expect(
				screen.getByRole("button", { name: "キャンセル" }),
			).toBeInTheDocument();
			expect(screen.getByRole("button", { name: "登録" })).toBeInTheDocument();
			expect(
				screen.getByRole("button", { name: "閉じる" }),
			).toBeInTheDocument();
		});
	});

	describe("送信状態の処理", () => {
		it("isSubmitting=trueの場合、送信中の状態が表示される", () => {
			render(<NewSubscriptionDialog {...defaultProps} isSubmitting={true} />);

			// 送信ボタンが無効化されていることを確認
			const submitButton = screen.getByRole("button", { name: "登録" });
			expect(submitButton).toBeDisabled();

			// ローディングアイコンが表示されることを確認
			expect(submitButton.querySelector(".animate-spin")).toBeInTheDocument();
		});

		it("isSubmitting=falseの場合、通常の状態が表示される", () => {
			render(<NewSubscriptionDialog {...defaultProps} isSubmitting={false} />);

			// 送信ボタンが有効化されていることを確認
			const submitButton = screen.getByRole("button", { name: "登録" });
			expect(submitButton).not.toBeDisabled();

			// ローディングアイコンが表示されないことを確認
			expect(
				submitButton.querySelector(".animate-spin"),
			).not.toBeInTheDocument();
		});
	});

	describe("ダイアログのクローズ処理", () => {
		it("キャンセルボタンをクリックした場合、onCloseが呼ばれる", async () => {
			const user = userEvent.setup();
			render(<NewSubscriptionDialog {...defaultProps} />);

			const cancelButton = screen.getByRole("button", { name: "キャンセル" });
			await user.click(cancelButton);

			expect(defaultProps.onClose).toHaveBeenCalledOnce();
		});

		it("送信中の場合、ESCキーでクローズできない", async () => {
			render(<NewSubscriptionDialog {...defaultProps} isSubmitting={true} />);

			fireEvent.keyDown(document, { key: "Escape" });

			expect(defaultProps.onClose).not.toHaveBeenCalled();
		});
	});

	describe("フォーム送信処理", () => {
		it("有効なデータでフォームを送信した場合、onSubmitとonCloseが呼ばれる", async () => {
			const user = userEvent.setup();
			render(<NewSubscriptionDialog {...defaultProps} />);

			// フォームに値を入力
			await user.type(screen.getByLabelText(/サービス名/), "Netflix");
			await user.type(screen.getByLabelText(/料金/), "1490");

			// 次回請求日を設定
			const nextMonth = new Date();
			nextMonth.setMonth(nextMonth.getMonth() + 1);
			const nextMonthString = nextMonth.toISOString().split("T")[0];
			await user.type(screen.getByLabelText(/次回請求日/), nextMonthString);

			// カテゴリを選択
			await user.selectOptions(screen.getByLabelText(/カテゴリ/), "3");

			// 登録ボタンをクリック
			const submitButton = screen.getByRole("button", { name: "登録" });
			await user.click(submitButton);

			// onSubmitが正しいデータで呼ばれることを確認
			expect(defaultProps.onSubmit).toHaveBeenCalledWith({
				name: "Netflix",
				amount: 1490,
				billingCycle: "monthly",
				nextBillingDate: nextMonthString,
				categoryId: "3",
				isActive: true,
				description: "",
			});

			// onCloseも呼ばれることを確認（送信成功後の自動クローズ）
			expect(defaultProps.onClose).toHaveBeenCalledOnce();
		});

		it("無効なデータでフォームを送信した場合、onSubmitは呼ばれない", async () => {
			const user = userEvent.setup();
			render(<NewSubscriptionDialog {...defaultProps} />);

			// 空のフォームで送信ボタンをクリック
			const submitButton = screen.getByRole("button", { name: "登録" });
			await user.click(submitButton);

			// バリデーションエラーが表示されることを確認
			await waitFor(() => {
				expect(screen.getByText("サービス名は必須です")).toBeInTheDocument();
			});

			// onSubmitは呼ばれないことを確認
			expect(defaultProps.onSubmit).not.toHaveBeenCalled();
			expect(defaultProps.onClose).not.toHaveBeenCalled();
		});
	});

	describe("フォームの入力バリデーション", () => {
		it("サービス名が空の場合、エラーが表示される", async () => {
			const user = userEvent.setup();
			render(<NewSubscriptionDialog {...defaultProps} />);

			const nameInput = screen.getByLabelText(/サービス名/);
			await user.click(nameInput);
			await user.tab(); // フィールドからフォーカスを外す

			await waitFor(() => {
				expect(screen.getByText("サービス名は必須です")).toBeInTheDocument();
			});
		});

		it("料金が0以下の場合、エラーが表示される", async () => {
			const user = userEvent.setup();
			render(<NewSubscriptionDialog {...defaultProps} />);

			const amountInput = screen.getByLabelText(/料金/);
			await user.type(amountInput, "0");
			await user.tab(); // フィールドからフォーカスを外す

			await waitFor(() => {
				expect(
					screen.getByText("料金は1円以上で入力してください"),
				).toBeInTheDocument();
			});
		});
	});

	describe("アクセシビリティ", () => {
		it("ダイアログに適切なARIA属性が設定されている", () => {
			render(<NewSubscriptionDialog {...defaultProps} />);

			const dialog = screen.getByRole("dialog");
			expect(dialog).toHaveAttribute("aria-modal", "true");
		});
	});
});
