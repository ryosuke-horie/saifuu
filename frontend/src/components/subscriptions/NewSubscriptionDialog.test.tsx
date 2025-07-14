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
	getCategoriesByType: vi.fn(() => [
		{
			id: "food",
			name: "食費",
			type: "expense",
			color: "#FF6B6B",
		},
		{
			id: "housing",
			name: "住居費",
			type: "expense",
			color: "#4ECDC4",
		},
		{
			id: "transportation",
			name: "交通費",
			type: "expense",
			color: "#3498DB",
		},
		{
			id: "system",
			name: "システム関係費",
			type: "expense",
			color: "#27AE60",
		},
		{
			id: "health",
			name: "健康・フィットネス",
			type: "expense",
			color: "#96CEB4",
		},
		{
			id: "books",
			name: "書籍代",
			type: "expense",
			color: "#1E8BC3",
		},
		{
			id: "business",
			name: "仕事・ビジネス",
			type: "expense",
			color: "#8E44AD",
		},
		{
			id: "shopping",
			name: "買い物",
			type: "expense",
			color: "#F39C12",
		},
		{
			id: "other_expense",
			name: "その他",
			type: "expense",
			color: "#FFEAA7",
		},
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

		it("ダイアログのクローズボタンをクリックした場合、onCloseが呼ばれる", async () => {
			const user = userEvent.setup();
			render(<NewSubscriptionDialog {...defaultProps} />);

			const closeButton = screen.getByRole("button", { name: "閉じる" });
			await user.click(closeButton);

			expect(defaultProps.onClose).toHaveBeenCalledOnce();
		});

		it("ESCキーを押した場合、onCloseが呼ばれる", async () => {
			render(<NewSubscriptionDialog {...defaultProps} />);

			fireEvent.keyDown(document, { key: "Escape" });

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

		it("次回請求日が過去の日付の場合、エラーが表示される", async () => {
			const user = userEvent.setup();
			render(<NewSubscriptionDialog {...defaultProps} />);

			const nextBillingDateInput = screen.getByLabelText(/次回請求日/);
			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);
			const yesterdayString = yesterday.toISOString().split("T")[0];

			await user.type(nextBillingDateInput, yesterdayString);
			await user.tab(); // フィールドからフォーカスを外す

			await waitFor(() => {
				expect(
					screen.getByText("次回請求日は今日以降の日付を入力してください"),
				).toBeInTheDocument();
			});
		});

		it("カテゴリが選択されていない場合、エラーが表示される", async () => {
			const user = userEvent.setup();
			render(<NewSubscriptionDialog {...defaultProps} />);

			// 全ての必須フィールドを入力（カテゴリ以外）
			await user.type(screen.getByLabelText(/サービス名/), "Netflix");
			await user.type(screen.getByLabelText(/料金/), "1490");

			const nextMonth = new Date();
			nextMonth.setMonth(nextMonth.getMonth() + 1);
			const nextMonthString = nextMonth.toISOString().split("T")[0];
			await user.type(screen.getByLabelText(/次回請求日/), nextMonthString);

			// カテゴリは選択せずに送信
			const submitButton = screen.getByRole("button", { name: "登録" });
			await user.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText("カテゴリは必須です")).toBeInTheDocument();
			});
		});
	});

	describe("アクセシビリティ", () => {
		it("ダイアログに適切なARIA属性が設定されている", () => {
			render(<NewSubscriptionDialog {...defaultProps} />);

			const dialog = screen.getByRole("dialog");
			expect(dialog).toHaveAttribute("aria-modal", "true");
			expect(dialog).toHaveAttribute("aria-labelledby");
		});

		it("フォーム要素にラベルが適切に関連付けられている", () => {
			render(<NewSubscriptionDialog {...defaultProps} />);

			// 必須フィールドの確認
			const nameInput = screen.getByLabelText(/サービス名/);
			const amountInput = screen.getByLabelText(/料金/);
			const nextBillingDateInput = screen.getByLabelText(/次回請求日/);

			expect(nameInput).toHaveAttribute("id");
			expect(amountInput).toHaveAttribute("id");
			expect(nextBillingDateInput).toHaveAttribute("id");
		});
	});

	describe("グローバルカテゴリ利用の検証", () => {
		// オーバーテストのため削除
		// カテゴリの詳細な内容検証は実装の詳細に依存しすぎるため
		// 基本的な機能は他のテストで確認されている

		it("categoriesプロパティに依存せずグローバルカテゴリを使用する", async () => {
			// Issue #176: グローバルカテゴリへの移行テスト
			const user = userEvent.setup();

			// 空のcategoriesを渡しても正常に動作することを確認
			const propsWithEmptyCategories = {
				isOpen: true,
				onClose: vi.fn(),
				onSubmit: vi.fn(),
				isSubmitting: false,
				categories: [], // 空配列を渡す
			};

			render(<NewSubscriptionDialog {...propsWithEmptyCategories} />);

			// フォームの基本情報を入力
			await user.type(screen.getByLabelText(/サービス名/), "Spotify");
			await user.type(screen.getByLabelText(/料金/), "980");

			// 次回請求日を設定
			const nextMonth = new Date();
			nextMonth.setMonth(nextMonth.getMonth() + 1);
			const nextMonthString = nextMonth.toISOString().split("T")[0];
			await user.type(screen.getByLabelText(/次回請求日/), nextMonthString);

			// グローバルカテゴリから「食費」を選択
			const categorySelect = screen.getByLabelText(/カテゴリ/);
			await user.selectOptions(categorySelect, "food"); // グローバル設定のIDを使用

			// フォーム送信
			const submitButton = screen.getByRole("button", { name: "登録" });
			await user.click(submitButton);

			// グローバルカテゴリのIDで送信されることを確認
			expect(propsWithEmptyCategories.onSubmit).toHaveBeenCalledWith({
				name: "Spotify",
				amount: 980,
				billingCycle: "monthly",
				nextBillingDate: nextMonthString,
				categoryId: "food", // グローバル設定のカテゴリID
				isActive: true,
				description: "",
			});
		});
	});
});
