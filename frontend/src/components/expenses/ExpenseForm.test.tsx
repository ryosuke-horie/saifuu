import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { mockCategories } from "../../../.storybook/mocks/data/categories";
import type { ExpenseFormData } from "../../types/expense";
import { ExpenseForm } from "./ExpenseForm";

/**
 * ExpenseFormコンポーネントのテスト
 *
 * テスト内容:
 * - 基本的なレンダリング
 * - フォーム入力処理
 * - バリデーション機能
 * - 送信処理
 * - エラーハンドリング
 * - ローディング状態
 * - 編集モード
 * - アクセシビリティ
 */

describe("ExpenseForm", () => {
	const mockOnSubmit = vi.fn();
	const mockOnCancel = vi.fn();

	const defaultProps = {
		onSubmit: mockOnSubmit,
		onCancel: mockOnCancel,
		isSubmitting: false,
		categories: mockCategories,
	};

	const validFormData: ExpenseFormData = {
		amount: 1000,
		type: "expense",
		date: "2025-07-09",
		description: "コンビニ弁当",
		categoryId: "3", // 食費
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("基本的なレンダリング", () => {
		it("初期データが設定されている場合、フォームフィールドに値が表示されること", () => {
			render(<ExpenseForm {...defaultProps} initialData={validFormData} />);

			expect(screen.getByDisplayValue("1000")).toBeInTheDocument();
			expect(screen.getByDisplayValue("2025-07-09")).toBeInTheDocument();
			expect(screen.getByDisplayValue("コンビニ弁当")).toBeInTheDocument();
		});
	});

	describe("バリデーション機能", () => {
		it("金額が空の場合、エラーメッセージが表示されること", async () => {
			const user = userEvent.setup();
			render(<ExpenseForm {...defaultProps} />);

			const submitButton = screen.getByRole("button", { name: "登録" });
			await user.click(submitButton);

			await waitFor(() => {
				expect(
					screen.getByText("金額は1円以上で入力してください"),
				).toBeInTheDocument();
			});
		});

		it("金額が負の値の場合、エラーメッセージが表示されること", async () => {
			const user = userEvent.setup();
			render(<ExpenseForm {...defaultProps} />);

			const amountInput = screen.getByLabelText(/金額（円）/);
			await user.clear(amountInput);
			await user.type(amountInput, "-100");

			const submitButton = screen.getByRole("button", { name: "登録" });
			await user.click(submitButton);

			await waitFor(() => {
				expect(
					screen.getByText("金額は1円以上で入力してください"),
				).toBeInTheDocument();
			});
		});

		it("金額が上限を超える場合、エラーメッセージが表示されること", async () => {
			const user = userEvent.setup();
			render(<ExpenseForm {...defaultProps} />);

			const amountInput = screen.getByLabelText(/金額（円）/);
			await user.clear(amountInput);
			await user.type(amountInput, "1000001");

			const submitButton = screen.getByRole("button", { name: "登録" });
			await user.click(submitButton);

			await waitFor(() => {
				expect(
					screen.getByText("金額は100万円以下で入力してください"),
				).toBeInTheDocument();
			});
		});

		it("日付が空の場合、エラーメッセージが表示されること", async () => {
			const user = userEvent.setup();
			render(<ExpenseForm {...defaultProps} />);

			const amountInput = screen.getByLabelText(/金額（円）/);
			await user.type(amountInput, "1000");

			const submitButton = screen.getByRole("button", { name: "登録" });
			await user.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText("日付は必須です")).toBeInTheDocument();
			});
		});
	});

	describe("送信処理", () => {
		it("有効なデータで送信できること", async () => {
			const user = userEvent.setup();
			render(<ExpenseForm {...defaultProps} />);

			// フォームに有効なデータを入力
			await user.type(screen.getByLabelText(/金額（円）/), "1000");
			await user.type(screen.getByLabelText(/日付/), "2025-07-09");
			await user.type(screen.getByLabelText(/説明/), "テスト説明");
			await user.selectOptions(screen.getByLabelText(/カテゴリ/), "3");

			// 送信ボタンをクリック
			const submitButton = screen.getByRole("button", { name: "登録" });
			await user.click(submitButton);

			// onSubmitが呼ばれることを確認
			await waitFor(() => {
				expect(mockOnSubmit).toHaveBeenCalledWith({
					amount: 1000,
					type: "expense",
					date: "2025-07-09",
					description: "テスト説明",
					categoryId: "3", // 食費
				});
			});
		});

		it("送信中の状態でボタンが無効化されること", () => {
			render(<ExpenseForm {...defaultProps} isSubmitting={true} />);

			const submitButton = screen.getByRole("button", { name: "登録" });
			expect(submitButton).toBeDisabled();

			const cancelButton = screen.getByRole("button", { name: "キャンセル" });
			expect(cancelButton).toBeDisabled();
		});
	});

	describe("キャンセル処理", () => {
		it("キャンセルボタンをクリックした場合、onCancelが呼ばれること", async () => {
			const user = userEvent.setup();
			render(<ExpenseForm {...defaultProps} />);

			const cancelButton = screen.getByRole("button", { name: "キャンセル" });
			await user.click(cancelButton);

			expect(mockOnCancel).toHaveBeenCalledOnce();
		});
	});

	describe("編集モード", () => {
		it("編集モードの場合、ボタンテキストが「更新」になること", () => {
			render(<ExpenseForm {...defaultProps} initialData={validFormData} />);

			expect(screen.getByRole("button", { name: "更新" })).toBeInTheDocument();
		});
	});

	describe("アクセシビリティ", () => {
		it("必須フィールドにaria-requiredが設定されていること", () => {
			render(<ExpenseForm {...defaultProps} />);

			expect(screen.getByLabelText(/金額（円）/)).toHaveAttribute(
				"aria-required",
				"true",
			);
			expect(screen.getByLabelText(/日付/)).toHaveAttribute("required");
		});

		it("エラーメッセージにrole='alert'が設定されていること", async () => {
			const user = userEvent.setup();
			render(<ExpenseForm {...defaultProps} />);

			const submitButton = screen.getByRole("button", { name: "登録" });
			await user.click(submitButton);

			await waitFor(() => {
				const errorMessages = screen.getAllByRole("alert");
				expect(errorMessages.length).toBeGreaterThan(0);
				expect(errorMessages[0]).toBeInTheDocument();
			});
		});
	});

	describe("カテゴリ選択の高度な動作", () => {
		it("支出カテゴリのみ選択可能であること", async () => {
			const _user = userEvent.setup();
			render(<ExpenseForm {...defaultProps} />);

			// 支出カテゴリが選択可能であることを確認
			const categorySelect = screen.getByLabelText(/カテゴリ/);
			const expenseOptions = categorySelect.querySelectorAll(
				'option:not([value=""])', // 空のオプションを除外
			);

			// 支出カテゴリのみが存在することを確認
			expect(expenseOptions.length).toBeGreaterThan(0);

			// すべてのカテゴリが支出タイプであることを確認
			const expenseCategories = mockCategories.filter(
				(cat) => cat.type === "expense",
			);
			expect(expenseOptions.length).toBe(expenseCategories.length);
		});
	});

	describe("日付フィールドの詳細動作", () => {
		// 削除: デフォルトの日付設定は実装されていない

		it("未来の日付でも入力可能であること", async () => {
			const user = userEvent.setup();
			const futureDate = new Date();
			futureDate.setDate(futureDate.getDate() + 30);
			const futureDateString = futureDate.toISOString().split("T")[0];

			render(<ExpenseForm {...defaultProps} />);

			const dateInput = screen.getByLabelText(/日付/);
			await user.clear(dateInput);
			await user.type(dateInput, futureDateString);

			expect(dateInput).toHaveValue(futureDateString);
		});

		it("過去の日付でも入力可能であること", async () => {
			const user = userEvent.setup();
			const pastDate = new Date();
			pastDate.setFullYear(pastDate.getFullYear() - 1);
			const pastDateString = pastDate.toISOString().split("T")[0];

			render(<ExpenseForm {...defaultProps} />);

			const dateInput = screen.getByLabelText(/日付/);
			await user.clear(dateInput);
			await user.type(dateInput, pastDateString);

			expect(dateInput).toHaveValue(pastDateString);
		});
	});

	describe("フォームリセット", () => {
		// 削除: フォームの自動リセット機能は実装されていない

		it("キャンセル時にフォームの入力内容が保持されること", async () => {
			const user = userEvent.setup();
			render(<ExpenseForm {...defaultProps} />);

			// フォームに入力
			await user.type(screen.getByLabelText(/金額（円）/), "1000");
			await user.type(screen.getByLabelText(/説明/), "テスト");

			// キャンセル
			await user.click(screen.getByRole("button", { name: "キャンセル" }));

			// onCancelが呼ばれたことを確認
			expect(mockOnCancel).toHaveBeenCalled();

			// フォームの値が保持されていることを確認（親コンポーネントが閉じない場合）
			expect(screen.getByLabelText(/金額（円）/)).toHaveValue(1000);
			expect(screen.getByLabelText(/説明/)).toHaveValue("テスト");
		});
	});

	describe("エッジケース", () => {
		it("非常に長い説明文でも正常に処理されること", async () => {
			const user = userEvent.setup();
			const longDescription = "a".repeat(255);
			render(<ExpenseForm {...defaultProps} />);

			// フォームに入力
			await user.type(screen.getByLabelText(/金額（円）/), "1000");
			await user.type(screen.getByLabelText(/日付/), "2025-07-09");
			await user.type(screen.getByLabelText(/説明/), longDescription);
			await user.selectOptions(screen.getByLabelText(/カテゴリ/), "3");

			// 送信
			await user.click(screen.getByRole("button", { name: "登録" }));

			// onSubmitが呼ばれることを確認
			await waitFor(() => {
				expect(mockOnSubmit).toHaveBeenCalledWith(
					expect.objectContaining({
						description: longDescription,
					}),
				);
			});
		});

		it("特殊文字を含む説明文でも正常に処理されること", async () => {
			const user = userEvent.setup();
			const specialDescription = "テスト🎉<script>alert('XSS')</script>";
			render(<ExpenseForm {...defaultProps} />);

			// フォームに入力
			await user.type(screen.getByLabelText(/金額（円）/), "1000");
			await user.type(screen.getByLabelText(/日付/), "2025-07-09");
			await user.type(screen.getByLabelText(/説明/), specialDescription);
			await user.selectOptions(screen.getByLabelText(/カテゴリ/), "3");

			// 送信
			await user.click(screen.getByRole("button", { name: "登録" }));

			// onSubmitが呼ばれることを確認
			await waitFor(() => {
				expect(mockOnSubmit).toHaveBeenCalledWith(
					expect.objectContaining({
						description: specialDescription,
					}),
				);
			});
		});

		it("0円の金額でエラーが表示されること", async () => {
			const user = userEvent.setup();
			render(<ExpenseForm {...defaultProps} />);

			const amountInput = screen.getByLabelText(/金額（円）/);
			await user.clear(amountInput);
			await user.type(amountInput, "0");

			const submitButton = screen.getByRole("button", { name: "登録" });
			await user.click(submitButton);

			await waitFor(() => {
				expect(
					screen.getByText("金額は1円以上で入力してください"),
				).toBeInTheDocument();
			});
		});

		it("100万円ちょうどの金額で正常に処理されること", async () => {
			const user = userEvent.setup();
			render(<ExpenseForm {...defaultProps} />);

			// フォームに入力
			await user.type(screen.getByLabelText(/金額（円）/), "1000000");
			await user.type(screen.getByLabelText(/日付/), "2025-07-09");
			await user.selectOptions(screen.getByLabelText(/カテゴリ/), "3");

			// 送信
			await user.click(screen.getByRole("button", { name: "登録" }));

			// onSubmitが呼ばれることを確認
			await waitFor(() => {
				expect(mockOnSubmit).toHaveBeenCalledWith(
					expect.objectContaining({
						amount: 1000000,
					}),
				);
			});
		});
	});
});
