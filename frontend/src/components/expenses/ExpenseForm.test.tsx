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
		categoryId: "cat-1",
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("基本的なレンダリング", () => {
		it("正常にレンダリングされること", () => {
			render(<ExpenseForm {...defaultProps} />);

			// 必要なフィールドがレンダリングされていることを確認
			expect(screen.getByLabelText(/金額（円）/)).toBeInTheDocument();
			expect(screen.getByLabelText(/種別/)).toBeInTheDocument();
			expect(screen.getByLabelText(/日付/)).toBeInTheDocument();
			expect(screen.getByLabelText(/説明/)).toBeInTheDocument();
			expect(screen.getByLabelText(/カテゴリ/)).toBeInTheDocument();
			expect(screen.getByRole("button", { name: "登録" })).toBeInTheDocument();
			expect(
				screen.getByRole("button", { name: "キャンセル" }),
			).toBeInTheDocument();
		});

		it("必須フィールドにアスタリスクが表示されること", () => {
			render(<ExpenseForm {...defaultProps} />);

			// 必須フィールドのアスタリスクが表示されていることを確認
			expect(screen.getByText(/金額（円）/)).toBeInTheDocument();
			expect(screen.getAllByText("*")).toHaveLength(3); // 3つの必須フィールド
			expect(screen.getByText(/種別/)).toBeInTheDocument();
			expect(screen.getByText(/日付/)).toBeInTheDocument();
		});

		it("初期データが設定されている場合、フォームフィールドに値が表示されること", () => {
			render(<ExpenseForm {...defaultProps} initialData={validFormData} />);

			expect(screen.getByDisplayValue("1000")).toBeInTheDocument();
			expect(screen.getByDisplayValue("2025-07-09")).toBeInTheDocument();
			expect(screen.getByDisplayValue("コンビニ弁当")).toBeInTheDocument();

			// selectフィールドの値を確認
			const typeSelect = screen.getByLabelText(
				/種別/,
			) as unknown as HTMLSelectElement;
			expect(typeSelect.value).toBe("expense");
		});
	});

	describe("フォーム入力処理", () => {
		it("金額フィールドに値を入力できること", async () => {
			const user = userEvent.setup();
			render(<ExpenseForm {...defaultProps} />);

			const amountInput = screen.getByLabelText(/金額（円）/);
			await user.clear(amountInput);
			await user.type(amountInput, "1500");

			expect(amountInput).toHaveValue(1500);
		});

		it("種別フィールドで選択できること", async () => {
			const user = userEvent.setup();
			render(<ExpenseForm {...defaultProps} />);

			const typeSelect = screen.getByLabelText(/種別/);
			await user.selectOptions(typeSelect, "income");

			expect(typeSelect).toHaveValue("income");
		});

		it("日付フィールドに値を入力できること", async () => {
			const user = userEvent.setup();
			render(<ExpenseForm {...defaultProps} />);

			const dateInput = screen.getByLabelText(/日付/);
			await user.clear(dateInput);
			await user.type(dateInput, "2025-07-10");

			expect(dateInput).toHaveValue("2025-07-10");
		});

		it("説明フィールドに値を入力できること", async () => {
			const user = userEvent.setup();
			render(<ExpenseForm {...defaultProps} />);

			const descriptionInput = screen.getByLabelText(/説明/);
			await user.clear(descriptionInput);
			await user.type(descriptionInput, "テスト説明");

			expect(descriptionInput).toHaveValue("テスト説明");
		});

		it("カテゴリフィールドで選択できること", async () => {
			const user = userEvent.setup();
			render(<ExpenseForm {...defaultProps} />);

			// 種別を選択してからカテゴリを選択
			const typeSelect = screen.getByLabelText(/種別/);
			await user.selectOptions(typeSelect, "expense");

			const categorySelect = screen.getByLabelText(/カテゴリ/);
			await user.selectOptions(categorySelect, "cat-1");

			expect(categorySelect).toHaveValue("cat-1");
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

		it("種別が選択されていない場合、エラーメッセージが表示されること", async () => {
			const user = userEvent.setup();
			render(<ExpenseForm {...defaultProps} />);

			const amountInput = screen.getByLabelText(/金額（円）/);
			await user.type(amountInput, "1000");

			const submitButton = screen.getByRole("button", { name: "登録" });
			await user.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText("種別は必須です")).toBeInTheDocument();
			});
		});

		it("日付が空の場合、エラーメッセージが表示されること", async () => {
			const user = userEvent.setup();
			render(<ExpenseForm {...defaultProps} />);

			const amountInput = screen.getByLabelText(/金額（円）/);
			await user.type(amountInput, "1000");

			const typeSelect = screen.getByLabelText(/種別/);
			await user.selectOptions(typeSelect, "expense");

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
			await user.selectOptions(screen.getByLabelText(/種別/), "expense");
			await user.type(screen.getByLabelText(/日付/), "2025-07-09");
			await user.type(screen.getByLabelText(/説明/), "テスト説明");
			await user.selectOptions(screen.getByLabelText(/カテゴリ/), "cat-1");

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
					categoryId: "cat-1",
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
			expect(screen.getByLabelText(/種別/)).toHaveAttribute(
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
		it("種別を変更した場合、選択可能なカテゴリが更新されること", async () => {
			const user = userEvent.setup();
			render(<ExpenseForm {...defaultProps} />);

			// 最初に支出を選択
			const typeSelect = screen.getByLabelText(/種別/);
			await user.selectOptions(typeSelect, "expense");

			// 支出カテゴリが選択可能であることを確認
			const categorySelect = screen.getByLabelText(/カテゴリ/);
			const expenseOptions = categorySelect.querySelectorAll(
				'option[value^="cat-"]',
			);
			expect(expenseOptions.length).toBeGreaterThan(0);

			// 収入に変更
			await user.selectOptions(typeSelect, "income");

			// カテゴリリストが更新されることを確認
			await waitFor(() => {
				const incomeOptions = categorySelect.querySelectorAll("option");
				expect(incomeOptions.length).toBeGreaterThan(0);
			});
		});

		it("種別未選択時はカテゴリが選択できないこと", () => {
			render(<ExpenseForm {...defaultProps} />);

			const categorySelect = screen.getByLabelText(/カテゴリ/);
			expect(categorySelect).toBeDisabled();
		});

		it("カテゴリが選択された状態で種別を変更した場合、カテゴリ選択がリセットされること", async () => {
			const user = userEvent.setup();
			render(<ExpenseForm {...defaultProps} />);

			// 支出とカテゴリを選択
			await user.selectOptions(screen.getByLabelText(/種別/), "expense");
			await user.selectOptions(screen.getByLabelText(/カテゴリ/), "cat-1");

			// カテゴリが選択されていることを確認
			expect(screen.getByLabelText(/カテゴリ/)).toHaveValue("cat-1");

			// 種別を収入に変更
			await user.selectOptions(screen.getByLabelText(/種別/), "income");

			// カテゴリがリセットされることを確認
			await waitFor(() => {
				expect(screen.getByLabelText(/カテゴリ/)).toHaveValue("");
			});
		});
	});

	describe("日付フィールドの詳細動作", () => {
		it("デフォルトで今日の日付が設定されること", () => {
			const today = new Date().toISOString().split("T")[0];
			render(<ExpenseForm {...defaultProps} />);

			const dateInput = screen.getByLabelText(/日付/);
			expect(dateInput).toHaveValue(today);
		});

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
		it("送信成功後にフォームがリセットされること", async () => {
			const user = userEvent.setup();
			const { rerender } = render(<ExpenseForm {...defaultProps} />);

			// フォームに入力
			await user.type(screen.getByLabelText(/金額（円）/), "1000");
			await user.selectOptions(screen.getByLabelText(/種別/), "expense");
			await user.type(screen.getByLabelText(/説明/), "テスト");
			await user.selectOptions(screen.getByLabelText(/カテゴリ/), "cat-1");

			// 送信
			await user.click(screen.getByRole("button", { name: "登録" }));

			// onSubmitが呼ばれたことを確認
			await waitFor(() => {
				expect(mockOnSubmit).toHaveBeenCalled();
			});

			// フォームをリレンダリング（リセットを想定）
			rerender(<ExpenseForm {...defaultProps} />);

			// フォームがリセットされていることを確認
			expect(screen.getByLabelText(/金額（円）/)).toHaveValue(0);
			expect(screen.getByLabelText(/種別/)).toHaveValue("");
			expect(screen.getByLabelText(/説明/)).toHaveValue("");
		});

		it("キャンセル時にフォームの入力内容が保持されること", async () => {
			const user = userEvent.setup();
			render(<ExpenseForm {...defaultProps} />);

			// フォームに入力
			await user.type(screen.getByLabelText(/金額（円）/), "1000");
			await user.selectOptions(screen.getByLabelText(/種別/), "expense");
			await user.type(screen.getByLabelText(/説明/), "テスト");

			// キャンセル
			await user.click(screen.getByRole("button", { name: "キャンセル" }));

			// onCancelが呼ばれたことを確認
			expect(mockOnCancel).toHaveBeenCalled();

			// フォームの値が保持されていることを確認（親コンポーネントが閉じない場合）
			expect(screen.getByLabelText(/金額（円）/)).toHaveValue(1000);
			expect(screen.getByLabelText(/種別/)).toHaveValue("expense");
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
			await user.selectOptions(screen.getByLabelText(/種別/), "expense");
			await user.type(screen.getByLabelText(/日付/), "2025-07-09");
			await user.type(screen.getByLabelText(/説明/), longDescription);
			await user.selectOptions(screen.getByLabelText(/カテゴリ/), "cat-1");

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
			await user.selectOptions(screen.getByLabelText(/種別/), "expense");
			await user.type(screen.getByLabelText(/日付/), "2025-07-09");
			await user.type(screen.getByLabelText(/説明/), specialDescription);
			await user.selectOptions(screen.getByLabelText(/カテゴリ/), "cat-1");

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
			await user.selectOptions(screen.getByLabelText(/種別/), "expense");
			await user.type(screen.getByLabelText(/日付/), "2025-07-09");
			await user.selectOptions(screen.getByLabelText(/カテゴリ/), "cat-1");

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
