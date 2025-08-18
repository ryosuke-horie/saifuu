import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Category } from "../../lib/api/types";
import { SubscriptionForm } from "./SubscriptionForm";

/**
 * SubscriptionFormコンポーネントのキーボードナビゲーションテスト
 *
 * Issue #250: キーボードナビゲーションの改善
 * - フォーム内でのTabキーナビゲーション
 * - ショートカットキー（Cmd+Enter で送信）
 * - アクセシビリティ属性の確認
 */
describe("SubscriptionForm - キーボードナビゲーション", () => {
	const mockOnSubmit = vi.fn();
	const mockOnCancel = vi.fn();

	const mockCategories: Category[] = [
		{
			id: "1",
			name: "エンタメ",
			type: "expense",
			color: undefined,
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		},
		{
			id: "2",
			name: "仕事",
			type: "expense",
			color: undefined,
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		},
	];

	// 明日の日付を取得する関数（YYYY-MM-DD形式）
	const getTomorrowDate = (): string => {
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		return tomorrow.toISOString().split("T")[0];
	};

	afterEach(() => {
		mockOnSubmit.mockClear();
		mockOnCancel.mockClear();
	});

	describe("Tabキーナビゲーション", () => {
		it("すべてのフォーム要素にTabキーで順番にアクセスできる", async () => {
			const user = userEvent.setup();

			render(
				<SubscriptionForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
					categories={mockCategories}
				/>,
			);

			// 最初の要素（サービス名）にフォーカス
			const nameInput = screen.getByLabelText(/サービス名/);
			nameInput.focus();
			expect(document.activeElement).toBe(nameInput);

			// Tabキーで料金フィールドに移動
			await user.tab();
			expect(document.activeElement).toBe(screen.getByLabelText(/料金/));

			// Tabキーで請求サイクルに移動
			await user.tab();
			expect(document.activeElement).toBe(
				screen.getByLabelText(/請求サイクル/),
			);

			// Tabキーで次回請求日に移動
			await user.tab();
			expect(document.activeElement).toBe(screen.getByLabelText(/次回請求日/));

			// Tabキーでカテゴリ選択に移動
			await user.tab();
			expect(document.activeElement).toBe(screen.getByLabelText(/カテゴリ/));

			// Tabキーで説明フィールドに移動
			await user.tab();
			expect(document.activeElement).toBe(screen.getByLabelText(/説明/));

			// Tabキーでキャンセルボタンに移動
			await user.tab();
			expect(document.activeElement).toBe(
				screen.getByRole("button", { name: "キャンセル" }),
			);

			// Tabキーで登録ボタンに移動
			await user.tab();
			expect(document.activeElement).toBe(
				screen.getByRole("button", { name: "登録" }),
			);
		});
	});

	describe("ショートカットキー", () => {
		it.skip("Cmd+Enter（Mac）でフォームを送信できる", async () => {
			const user = userEvent.setup();

			render(
				<SubscriptionForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
					categories={mockCategories}
				/>,
			);

			// 必須フィールドを入力
			const tomorrowDate = getTomorrowDate();
			await user.type(screen.getByLabelText(/サービス名/), "Netflix");
			await user.type(screen.getByLabelText(/料金/), "1480");
			await user.type(screen.getByLabelText(/次回請求日/), tomorrowDate);
			await user.selectOptions(screen.getByLabelText(/カテゴリ/), "1");

			// 説明フィールドにフォーカスしてからキーボードショートカットを実行
			const descriptionField = screen.getByLabelText(/説明/);
			descriptionField.focus();

			// Mac用のショートカット (Cmd+Enter)
			await user.keyboard("{Meta>}{Enter}{/Meta}");

			// 少し待機してから検証
			await waitFor(() => {
				expect(mockOnSubmit).toHaveBeenCalled();
			});

			expect(mockOnSubmit).toHaveBeenCalledWith(
				expect.objectContaining({
					name: "Netflix",
					amount: 1480,
					nextBillingDate: tomorrowDate,
					categoryId: "1",
				}),
			);
		});

		it("Ctrl+Enter（Windows/Linux）でフォームを送信できる", async () => {
			const user = userEvent.setup();

			render(
				<SubscriptionForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
					categories={mockCategories}
				/>,
			);

			// 必須フィールドを入力
			const nameInput = screen.getByLabelText(/サービス名/);
			const tomorrowDate = getTomorrowDate();
			await user.type(nameInput, "Spotify");
			await user.type(screen.getByLabelText(/料金/), "980");
			await user.type(screen.getByLabelText(/次回請求日/), tomorrowDate);
			await user.selectOptions(screen.getByLabelText(/カテゴリ/), "2");

			// いずれかのフィールドからCtrl+Enterを実行
			// フォーカスをnameInputに維持したまま
			nameInput.focus();

			// Windows/Linux用のショートカット (Ctrl+Enter)
			await user.keyboard("{Control>}{Enter}{/Control}");

			// フォームが送信されるまで待つ
			await waitFor(() => {
				expect(mockOnSubmit).toHaveBeenCalledWith(
					expect.objectContaining({
						name: "Spotify",
						amount: 980,
						nextBillingDate: tomorrowDate,
						categoryId: "2",
					}),
				);
			});
		});

		it("任意のフィールドからCmd+Enter（Mac）でフォームを送信できる", async () => {
			const user = userEvent.setup();

			render(
				<SubscriptionForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
					categories={mockCategories}
				/>,
			);

			// 必須フィールドを入力
			const tomorrowDate = getTomorrowDate();
			await user.type(screen.getByLabelText(/サービス名/), "Amazon Prime");
			await user.type(screen.getByLabelText(/料金/), "500");
			await user.type(screen.getByLabelText(/次回請求日/), tomorrowDate);
			await user.selectOptions(screen.getByLabelText(/カテゴリ/), "1");

			// 説明フィールドにフォーカスしてからキーボードショートカットを実行
			const descriptionField = screen.getByLabelText(/説明/);
			descriptionField.focus();

			// Mac用のショートカット (Cmd+Enter)
			await user.keyboard("{Meta>}{Enter}{/Meta}");

			// フォームが送信されるまで待つ
			await waitFor(() => {
				expect(mockOnSubmit).toHaveBeenCalledWith(
					expect.objectContaining({
						name: "Amazon Prime",
						amount: 500,
						nextBillingDate: tomorrowDate,
						categoryId: "1",
					}),
				);
			});
		});

		it("Escapeキーでフォームをキャンセルできる", async () => {
			const user = userEvent.setup();

			render(
				<SubscriptionForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
					categories={mockCategories}
					onEscape={mockOnCancel}
				/>,
			);

			// 任意のフィールドでEscapeキーを押す
			const nameInput = screen.getByLabelText(/サービス名/);
			nameInput.focus();

			await user.keyboard("{Escape}");

			expect(mockOnCancel).toHaveBeenCalled();
		});
	});

	describe("アクセシビリティ", () => {
		it("すべてのフォーム要素に適切なラベルとARIA属性がある", () => {
			render(
				<SubscriptionForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
					categories={mockCategories}
				/>,
			);

			// ラベルの確認
			expect(screen.getByLabelText(/サービス名/)).toBeInTheDocument();
			expect(screen.getByLabelText(/料金/)).toBeInTheDocument();
			expect(screen.getByLabelText(/請求サイクル/)).toBeInTheDocument();
			expect(screen.getByLabelText(/次回請求日/)).toBeInTheDocument();
			expect(screen.getByLabelText(/カテゴリ/)).toBeInTheDocument();
			expect(screen.getByLabelText(/説明/)).toBeInTheDocument();

			// 必須フィールドの表示確認
			const labels = screen.getAllByText("*");
			expect(labels.length).toBeGreaterThan(0);
		});

		it("フォーカスインジケーターが適切に表示される", () => {
			render(
				<SubscriptionForm
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
					categories={mockCategories}
				/>,
			);

			// フォーカスリングのクラスが適用されていることを確認
			const nameInput = screen.getByLabelText(/サービス名/);
			expect(nameInput.className).toContain("focus:ring-2");
			expect(nameInput.className).toContain("focus:ring-blue-500");

			const submitButton = screen.getByRole("button", { name: "登録" });
			expect(submitButton.className).toContain("focus:ring-2");
			expect(submitButton.className).toContain("focus:ring-blue-500");
		});
	});
});
