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
 * - バリデーション機能（重点）
 * - 送信処理とエラーハンドリング
 * - 編集モードのデータ処理
 * - アクセシビリティ要素
 * - エッジケース処理
 *
 * 注: UI表示・インタラクションテストはStorybookに移行
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

	describe("編集モード", () => {
		it("初期データが正しく処理されること", () => {
			render(<ExpenseForm {...defaultProps} initialData={validFormData} />);

			expect(screen.getByDisplayValue("1000")).toBeInTheDocument();
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
		});
	});
});
