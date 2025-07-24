import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { SubscriptionFormData } from "../../../lib/api/types";
import type { Category } from "../../../types/category";
import { SubscriptionFormWithZod } from "../SubscriptionFormWithZod";

// モックカテゴリデータ
const mockCategories: Category[] = [
	{
		id: "1",
		name: "エンタメ",
		type: "expense",
		color: "#ff0000",
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	},
	{
		id: "2",
		name: "サブスク",
		type: "expense",
		color: "#00ff00",
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	},
];

describe("SubscriptionFormWithZod", () => {
	describe("レンダリング", () => {
		it("すべてのフォームフィールドが表示される", () => {
			const mockOnSubmit = vi.fn();
			const mockOnCancel = vi.fn();

			render(
				<SubscriptionFormWithZod
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
					categories={mockCategories}
				/>,
			);

			// 各フィールドの存在確認
			expect(screen.getByLabelText(/サービス名/)).toBeInTheDocument();
			expect(screen.getByLabelText(/料金（円）/)).toBeInTheDocument();
			expect(screen.getByLabelText(/請求サイクル/)).toBeInTheDocument();
			expect(screen.getByLabelText(/次回請求日/)).toBeInTheDocument();
			expect(screen.getByLabelText(/カテゴリ/)).toBeInTheDocument();
			expect(screen.getByLabelText(/説明（任意）/)).toBeInTheDocument();

			// ボタンの存在確認
			expect(screen.getByRole("button", { name: "登録" })).toBeInTheDocument();
			expect(
				screen.getByRole("button", { name: "キャンセル" }),
			).toBeInTheDocument();
		});

		it("初期データが正しく表示される", () => {
			const mockOnSubmit = vi.fn();
			const mockOnCancel = vi.fn();
			const initialData: SubscriptionFormData = {
				name: "Netflix",
				amount: 1500,
				billingCycle: "monthly",
				nextBillingDate: "2024-02-01",
				categoryId: "1",
				isActive: true,
				description: "エンタメサブスク",
			};

			render(
				<SubscriptionFormWithZod
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
					categories={mockCategories}
					initialData={initialData}
				/>,
			);

			expect(screen.getByDisplayValue("Netflix")).toBeInTheDocument();
			expect(screen.getByDisplayValue("1500")).toBeInTheDocument();
			// セレクトボックスの選択値確認
			const billingCycleSelect = screen.getByLabelText(
				/請求サイクル/,
			) as unknown as HTMLSelectElement;
			expect(billingCycleSelect.value).toBe("monthly");
			expect(screen.getByDisplayValue("2024-02-01")).toBeInTheDocument();
			const categorySelect = screen.getByLabelText(
				/カテゴリ/,
			) as unknown as HTMLSelectElement;
			expect(categorySelect.value).toBe("1");
			expect(screen.getByDisplayValue("エンタメサブスク")).toBeInTheDocument();
		});
	});

	describe("バリデーション", () => {
		it("必須フィールドが空の場合エラーが表示される", async () => {
			const mockOnSubmit = vi.fn();
			const mockOnCancel = vi.fn();

			render(
				<SubscriptionFormWithZod
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
				expect(screen.getByText(/名前は必須です/)).toBeInTheDocument();
				expect(screen.getByText(/1円以上/)).toBeInTheDocument();
				expect(screen.getByText(/2000-01-01以降/)).toBeInTheDocument();
			});

			// 送信関数が呼ばれていないことを確認
			expect(mockOnSubmit).not.toHaveBeenCalled();
		});

		it("名前の文字数制限エラーが表示される", async () => {
			const mockOnSubmit = vi.fn();
			const mockOnCancel = vi.fn();

			render(
				<SubscriptionFormWithZod
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
					categories={mockCategories}
				/>,
			);

			const nameInput = screen.getByLabelText(/サービス名/);
			fireEvent.change(nameInput, { target: { value: "a".repeat(101) } });
			fireEvent.blur(nameInput);

			await waitFor(() => {
				expect(screen.getByText(/100文字以下/)).toBeInTheDocument();
			});
		});

		it("金額の範囲エラーが表示される", async () => {
			const mockOnSubmit = vi.fn();
			const mockOnCancel = vi.fn();

			render(
				<SubscriptionFormWithZod
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
					categories={mockCategories}
				/>,
			);

			const amountInput = screen.getByLabelText(/料金（円）/);
			fireEvent.change(amountInput, { target: { value: "10000001" } });
			fireEvent.blur(amountInput);

			await waitFor(() => {
				expect(screen.getByText(/10000000円以下/)).toBeInTheDocument();
			});
		});
	});

	describe("フォーム送信", () => {
		it("有効なデータで送信が成功する", async () => {
			const mockOnSubmit = vi.fn();
			const mockOnCancel = vi.fn();

			render(
				<SubscriptionFormWithZod
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
					categories={mockCategories}
				/>,
			);

			// フォームに値を入力
			fireEvent.change(screen.getByLabelText(/サービス名/), {
				target: { value: "Spotify" },
			});
			fireEvent.change(screen.getByLabelText(/料金（円）/), {
				target: { value: "980" },
			});
			fireEvent.change(screen.getByLabelText(/請求サイクル/), {
				target: { value: "monthly" },
			});
			fireEvent.change(screen.getByLabelText(/次回請求日/), {
				target: { value: "2024-02-15" },
			});
			fireEvent.change(screen.getByLabelText(/カテゴリ/), {
				target: { value: "1" },
			});
			fireEvent.change(screen.getByLabelText(/説明（任意）/), {
				target: { value: "音楽ストリーミング" },
			});

			// 送信
			fireEvent.click(screen.getByRole("button", { name: "登録" }));

			await waitFor(() => {
				expect(mockOnSubmit).toHaveBeenCalledWith({
					name: "Spotify",
					amount: 980,
					billingCycle: "monthly",
					nextBillingDate: "2024-02-15",
					categoryId: "1",
					isActive: true,
					description: "音楽ストリーミング",
				});
			});
		});

		it("キャンセルボタンが機能する", () => {
			const mockOnSubmit = vi.fn();
			const mockOnCancel = vi.fn();

			render(
				<SubscriptionFormWithZod
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
				<SubscriptionFormWithZod
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
					categories={mockCategories}
				/>,
			);

			const nameInput = screen.getByLabelText(/サービス名/);

			// フォーカスして離れる（タッチ）
			fireEvent.focus(nameInput);
			fireEvent.blur(nameInput);

			await waitFor(() => {
				expect(screen.getByText(/名前は必須です/)).toBeInTheDocument();
			});
		});
	});
});
