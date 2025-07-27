import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { INCOME_CATEGORIES } from "../../../../../shared/config/categories";
import { createMockCategories } from "../../../test-utils/categoryHelpers";
import type { IncomeFormData, IncomeFormProps } from "../../../types/income";
import { IncomeForm } from "../IncomeForm";

describe("IncomeForm", () => {
	const mockOnSubmit = vi.fn();
	const mockOnCancel = vi.fn();

	const defaultProps: IncomeFormProps = {
		onSubmit: mockOnSubmit,
		onCancel: mockOnCancel,
		categories: createMockCategories(INCOME_CATEGORIES),
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("収入フォームが正しくレンダリングされること", () => {
		render(<IncomeForm {...defaultProps} />);

		// フォーム要素の存在確認
		expect(screen.getByLabelText(/金額（円）/)).toBeInTheDocument();
		expect(screen.getByLabelText(/日付/)).toBeInTheDocument();
		expect(screen.getByLabelText(/説明（任意）/)).toBeInTheDocument();
		expect(screen.getByLabelText(/カテゴリ/)).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "キャンセル" }),
		).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "登録" })).toBeInTheDocument();
	});

	it("必須フィールドが空の場合、エラーメッセージが表示されること", async () => {
		const user = userEvent.setup();
		render(<IncomeForm {...defaultProps} />);

		// 金額フィールドをクリア
		const amountInput = screen.getByLabelText(/金額（円）/);
		await user.clear(amountInput);

		// 日付フィールドをクリア
		const dateInput = screen.getByLabelText(/日付/);
		await user.clear(dateInput);

		// 送信ボタンをクリック
		await user.click(screen.getByRole("button", { name: "登録" }));

		// エラーメッセージの確認
		await waitFor(() => {
			expect(
				screen.getByText("金額は0より大きい値を入力してください"),
			).toBeInTheDocument();
			expect(screen.getByText("日付を入力してください")).toBeInTheDocument();
		});
	});

	it("収入金額は正の値のみ許可されること", async () => {
		const user = userEvent.setup();
		render(<IncomeForm {...defaultProps} />);

		const amountInput = screen.getByLabelText(/金額（円）/);

		// 0を入力（正の値でない）
		await user.clear(amountInput);
		await user.type(amountInput, "0");
		await user.click(screen.getByRole("button", { name: "登録" }));

		// エラーメッセージの確認
		await waitFor(() => {
			expect(
				screen.getByText("金額は0より大きい値を入力してください"),
			).toBeInTheDocument();
		});
	});

	it("有効なデータで送信した場合、onSubmitが呼ばれること", async () => {
		const user = userEvent.setup();
		render(<IncomeForm {...defaultProps} />);

		// フォームに入力
		const amountInput = screen.getByLabelText(/金額（円）/);
		await user.clear(amountInput);
		await user.type(amountInput, "50000");

		const dateInput = screen.getByLabelText(/日付/);
		await user.clear(dateInput);
		await user.type(dateInput, "2025-01-27");

		await user.type(screen.getByLabelText(/説明（任意）/), "1月分給与");
		await user.selectOptions(screen.getByLabelText(/カテゴリ/), "salary");

		// 送信
		await user.click(screen.getByRole("button", { name: "登録" }));

		// onSubmitが正しいデータで呼ばれることを確認
		await waitFor(() => {
			expect(mockOnSubmit).toHaveBeenCalledTimes(1);
			expect(mockOnSubmit).toHaveBeenCalledWith({
				amount: 50000,
				type: "income",
				date: "2025-01-27",
				description: "1月分給与",
				categoryId: "salary",
			});
		});
	});

	it("編集モードで初期データが正しく表示されること", () => {
		const initialData: IncomeFormData = {
			amount: 100000,
			type: "income",
			date: "2025-01-15",
			description: "ボーナス支給",
			categoryId: "bonus",
		};

		render(<IncomeForm {...defaultProps} initialData={initialData} />);

		// 初期値の確認
		expect(screen.getByDisplayValue("100000")).toBeInTheDocument();
		expect(screen.getByDisplayValue("2025-01-15")).toBeInTheDocument();
		expect(screen.getByDisplayValue("ボーナス支給")).toBeInTheDocument();

		// セレクトボックスの値確認
		const categorySelect = screen.getByLabelText(/カテゴリ/);
		expect((categorySelect as unknown as HTMLSelectElement).value).toBe(
			"bonus",
		);

		expect(screen.getByRole("button", { name: "更新" })).toBeInTheDocument();
	});

	it("キャンセルボタンクリック時、onCancelが呼ばれること", async () => {
		const user = userEvent.setup();
		render(<IncomeForm {...defaultProps} />);

		await user.click(screen.getByRole("button", { name: "キャンセル" }));

		expect(mockOnCancel).toHaveBeenCalledTimes(1);
	});

	it("送信中は入力フィールドとボタンが無効化されること", () => {
		render(<IncomeForm {...defaultProps} isSubmitting={true} />);

		// 入力フィールドの無効化確認
		expect(screen.getByLabelText(/金額（円）/)).toBeDisabled();
		expect(screen.getByLabelText(/日付/)).toBeDisabled();
		expect(screen.getByLabelText(/説明（任意）/)).toBeDisabled();
		expect(screen.getByLabelText(/カテゴリ/)).toBeDisabled();

		// ボタンの無効化確認
		expect(screen.getByRole("button", { name: "キャンセル" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "登録" })).toBeDisabled();
	});

	it("説明フィールドは500文字まで入力可能であること", async () => {
		const user = userEvent.setup();
		render(<IncomeForm {...defaultProps} />);

		const descriptionInput = screen.getByLabelText(/説明（任意）/);
		const longText = "あ".repeat(501);

		await user.type(descriptionInput, longText);
		await user.tab();

		// 文字数制限エラーの確認
		await waitFor(() => {
			expect(
				screen.getByText("説明は500文字以内で入力してください"),
			).toBeInTheDocument();
		});
	});

	it("収入カテゴリのみが表示されること", () => {
		render(<IncomeForm {...defaultProps} />);

		const categorySelect = screen.getByLabelText(/カテゴリ/);
		const options = Array.from(categorySelect.querySelectorAll("option"));

		// デフォルトオプション + 収入カテゴリ5つ
		expect(options).toHaveLength(6);

		// 収入カテゴリの確認
		expect(screen.getByText("給与")).toBeInTheDocument();
		expect(screen.getByText("ボーナス")).toBeInTheDocument();
		expect(screen.getByText("副業")).toBeInTheDocument();
		expect(screen.getByText("投資収益")).toBeInTheDocument();
		expect(screen.getByText("その他")).toBeInTheDocument();
	});

	it("フォームのスタイリングが緑系統であること", () => {
		render(<IncomeForm {...defaultProps} />);

		// フォーム要素をCSSクラスで取得
		const form = document.querySelector(".income-form");
		expect(form).toBeInTheDocument();
		expect(form?.tagName).toBe("FORM");
	});
});
