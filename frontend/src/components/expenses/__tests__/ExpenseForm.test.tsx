import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Category } from "../../../types/category";
import type { ExpenseFormData } from "../../../types/expense";
import { ExpenseForm } from "../ExpenseForm";

// モックカテゴリデータ
const mockCategories: Category[] = [
	{
		id: "1",
		name: "食費",
		type: "expense",
		color: "#ff0000",
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	},
	{
		id: "2",
		name: "交通費",
		type: "expense",
		color: "#00ff00",
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	},
];

describe("ExpenseForm", () => {
	describe("レンダリング", () => {
		it("すべてのフォームフィールドが表示される", () => {
			const mockOnSubmit = vi.fn();
			const mockOnCancel = vi.fn();

			render(
				<ExpenseForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
					categories={mockCategories}
				/>,
			);

			// 各フィールドの存在確認
			expect(screen.getByLabelText(/金額（円）/)).toBeInTheDocument();
			expect(screen.getByLabelText(/日付/)).toBeInTheDocument();
			expect(screen.getByLabelText(/説明（任意）/)).toBeInTheDocument();
			expect(screen.getByLabelText(/カテゴリ/)).toBeInTheDocument();

			// ボタンの存在確認
			expect(screen.getByRole("button", { name: "登録" })).toBeInTheDocument();
			expect(
				screen.getByRole("button", { name: "キャンセル" }),
			).toBeInTheDocument();
		});

		it("初期データが正しく表示される", () => {
			const mockOnSubmit = vi.fn();
			const mockOnCancel = vi.fn();
			const initialData: ExpenseFormData = {
				amount: 1000,
				type: "expense",
				date: "2024-01-01",
				description: "テスト支出",
				categoryId: "1",
			};

			render(
				<ExpenseForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
					categories={mockCategories}
					initialData={initialData}
				/>,
			);

			expect(screen.getByDisplayValue("1000")).toBeInTheDocument();
			expect(screen.getByDisplayValue("2024-01-01")).toBeInTheDocument();
			expect(screen.getByDisplayValue("テスト支出")).toBeInTheDocument();
			// セレクトボックスの選択値確認
			const categorySelect = screen.getByLabelText(
				/カテゴリ/,
			) as unknown as HTMLSelectElement;
			expect(categorySelect.value).toBe("1");
		});
	});

	describe("バリデーション", () => {
		it("必須フィールドが空の場合エラーが表示される", async () => {
			const mockOnSubmit = vi.fn();
			const mockOnCancel = vi.fn();

			render(
				<ExpenseForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
					categories={mockCategories}
				/>,
			);

			// フォーム送信
			const submitButton = screen.getByRole("button", { name: "登録" });
			fireEvent.click(submitButton);

			// エラーメッセージの確認
			await waitFor(() => {
				expect(screen.getByText(/1円以上/)).toBeInTheDocument();
				expect(screen.getByText(/2000-01-01以降/)).toBeInTheDocument();
			});

			// 送信関数が呼ばれていないことを確認
			expect(mockOnSubmit).not.toHaveBeenCalled();
		});

		it("金額の範囲エラーが表示される", async () => {
			const mockOnSubmit = vi.fn();
			const mockOnCancel = vi.fn();

			render(
				<ExpenseForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
					categories={mockCategories}
				/>,
			);

			const amountInput = screen.getByLabelText(/金額（円）/);
			fireEvent.change(amountInput, { target: { value: "10000001" } });
			fireEvent.blur(amountInput);

			await waitFor(() => {
				expect(screen.getByText(/10000000円以下/)).toBeInTheDocument();
			});
		});

		it("説明の文字数制限エラーが表示される", async () => {
			const mockOnSubmit = vi.fn();
			const mockOnCancel = vi.fn();

			render(
				<ExpenseForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
					categories={mockCategories}
				/>,
			);

			const descriptionInput = screen.getByLabelText(/説明（任意）/);
			fireEvent.change(descriptionInput, {
				target: { value: "a".repeat(501) },
			});
			fireEvent.blur(descriptionInput);

			await waitFor(() => {
				expect(screen.getByText(/500文字以下/)).toBeInTheDocument();
			});
		});
	});

	describe("フォーム送信", () => {
		it("有効なデータで送信が成功する", async () => {
			const mockOnSubmit = vi.fn();
			const mockOnCancel = vi.fn();

			render(
				<ExpenseForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
					categories={mockCategories}
				/>,
			);

			// フォームに値を入力
			fireEvent.change(screen.getByLabelText(/金額（円）/), {
				target: { value: "1500" },
			});
			fireEvent.change(screen.getByLabelText(/日付/), {
				target: { value: "2024-01-15" },
			});
			fireEvent.change(screen.getByLabelText(/説明（任意）/), {
				target: { value: "ランチ代" },
			});
			fireEvent.change(screen.getByLabelText(/カテゴリ/), {
				target: { value: "1" },
			});

			// 送信
			fireEvent.click(screen.getByRole("button", { name: "登録" }));

			await waitFor(() => {
				expect(mockOnSubmit).toHaveBeenCalledWith({
					amount: 1500,
					type: "expense",
					date: "2024-01-15",
					description: "ランチ代",
					categoryId: "1",
				});
			});
		});

		it("キャンセルボタンが機能する", () => {
			const mockOnSubmit = vi.fn();
			const mockOnCancel = vi.fn();

			render(
				<ExpenseForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
					categories={mockCategories}
				/>,
			);

			fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));
			expect(mockOnCancel).toHaveBeenCalled();
		});
	});

	describe("リアルタイムバリデーション", () => {
		it("フィールドがタッチされた後にエラーが表示される", async () => {
			const mockOnSubmit = vi.fn();
			const mockOnCancel = vi.fn();

			render(
				<ExpenseForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
					categories={mockCategories}
				/>,
			);

			const amountInput = screen.getByLabelText(/金額（円）/);

			// フォーカスして離れる（タッチ）
			fireEvent.focus(amountInput);
			fireEvent.blur(amountInput);

			await waitFor(() => {
				expect(screen.getByText(/1円以上/)).toBeInTheDocument();
			});
		});
	});
});
