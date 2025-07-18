import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { mockCategories } from "../../../.storybook/mocks/data/categories";
import type { SubscriptionFormData } from "../../lib/api/types";
import { SubscriptionForm } from "./SubscriptionForm";

/**
 * SubscriptionFormコンポーネントのテスト
 *
 * テスト内容:
 * - バリデーション機能（重点）
 * - 送信処理とエラーハンドリング
 * - 編集モードのデータ処理
 * - アクセシビリティ要素
 *
 * 注: UI表示・インタラクションテストはStorybookに移行
 */

describe("SubscriptionForm", () => {
	const mockOnSubmit = vi.fn();
	const mockOnCancel = vi.fn();

	const defaultProps = {
		onSubmit: mockOnSubmit,
		onCancel: mockOnCancel,
		isSubmitting: false,
		categories: mockCategories,
	};

	const validFormData: SubscriptionFormData = {
		name: "Netflix",
		amount: 1480,
		billingCycle: "monthly" as const,
		nextBillingDate: "2025-12-01",
		categoryId: "3", // 食費
		isActive: true,
		description: "動画配信サービス",
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("バリデーション機能", () => {
		describe("サービス名のバリデーション", () => {
			it("空の場合エラーが表示されること", async () => {
				const user = userEvent.setup();
				render(<SubscriptionForm {...defaultProps} />);

				const nameInput = screen.getByLabelText(/サービス名/);
				await user.click(nameInput);
				await user.tab(); // blur trigger

				await waitFor(() => {
					expect(screen.getByText("サービス名は必須です")).toBeInTheDocument();
				});
			});

			it("100文字を超える場合エラーが表示されること", async () => {
				const user = userEvent.setup();
				render(<SubscriptionForm {...defaultProps} />);

				const longName = "a".repeat(101);
				const nameInput = screen.getByLabelText(/サービス名/);
				await user.type(nameInput, longName);
				await user.tab();

				await waitFor(() => {
					expect(
						screen.getByText("サービス名は100文字以内で入力してください"),
					).toBeInTheDocument();
				});
			});
		});

		describe("料金のバリデーション", () => {
			it("0以下の場合エラーが表示されること", async () => {
				const user = userEvent.setup();
				render(<SubscriptionForm {...defaultProps} />);

				const amountInput = screen.getByLabelText(/料金（円）/);
				await user.type(amountInput, "0");
				await user.tab();

				await waitFor(() => {
					expect(
						screen.getByText("料金は1円以上で入力してください"),
					).toBeInTheDocument();
				});
			});

			it("100万円を超える場合エラーが表示されること", async () => {
				const user = userEvent.setup();
				render(<SubscriptionForm {...defaultProps} />);

				const amountInput = screen.getByLabelText(/料金（円）/);
				await user.type(amountInput, "1000001");
				await user.tab();

				await waitFor(() => {
					expect(
						screen.getByText("料金は100万円以下で入力してください"),
					).toBeInTheDocument();
				});
			});
		});

		describe("次回請求日のバリデーション", () => {
			it("空の場合エラーが表示されること", async () => {
				const user = userEvent.setup();
				render(<SubscriptionForm {...defaultProps} />);

				const dateInput = screen.getByLabelText(/次回請求日/);
				await user.click(dateInput);
				await user.tab();

				await waitFor(() => {
					expect(screen.getByText("次回請求日は必須です")).toBeInTheDocument();
				});
			});

			it("過去の日付の場合エラーが表示されること", async () => {
				const user = userEvent.setup();
				render(<SubscriptionForm {...defaultProps} />);

				const dateInput = screen.getByLabelText(/次回請求日/);
				await user.type(dateInput, "2020-01-01");
				await user.tab();

				await waitFor(() => {
					expect(
						screen.getByText("次回請求日は今日以降の日付を入力してください"),
					).toBeInTheDocument();
				});
			});
		});

		describe("説明のバリデーション", () => {
			it("maxLength属性が設定されていること", () => {
				render(<SubscriptionForm {...defaultProps} />);

				const descriptionInput = screen.getByLabelText(/説明（任意）/);
				expect(descriptionInput).toHaveAttribute("maxLength", "500");
			});
		});
	});

	describe("送信処理", () => {
		it("有効なデータでフォーム送信が実行されること", async () => {
			const user = userEvent.setup();
			render(<SubscriptionForm {...defaultProps} />);

			// フォームに入力
			await user.type(screen.getByLabelText(/サービス名/), validFormData.name);
			await user.type(
				screen.getByLabelText(/料金（円）/),
				validFormData.amount.toString(),
			);
			await user.selectOptions(
				screen.getByLabelText(/請求サイクル/),
				validFormData.billingCycle,
			);
			await user.type(
				screen.getByLabelText(/次回請求日/),
				validFormData.nextBillingDate,
			);
			await user.selectOptions(
				screen.getByLabelText(/カテゴリ/),
				validFormData.categoryId,
			);
			await user.type(
				screen.getByLabelText(/説明（任意）/),
				validFormData.description || "",
			);

			// 送信
			await user.click(screen.getByRole("button", { name: "登録" }));

			await waitFor(() => {
				expect(mockOnSubmit).toHaveBeenCalledWith(validFormData);
			});
		});

		it("無効なデータで送信が阻止されること", async () => {
			const user = userEvent.setup();
			render(<SubscriptionForm {...defaultProps} />);

			// 無効なデータ（空のサービス名）で送信
			await user.click(screen.getByRole("button", { name: "登録" }));

			await waitFor(() => {
				expect(screen.getByText("サービス名は必須です")).toBeInTheDocument();
				expect(mockOnSubmit).not.toHaveBeenCalled();
			});
		});

		it("キャンセルボタンでonCancelが呼ばれること", async () => {
			const user = userEvent.setup();
			render(<SubscriptionForm {...defaultProps} />);

			await user.click(screen.getByRole("button", { name: "キャンセル" }));

			expect(mockOnCancel).toHaveBeenCalled();
		});
	});

	describe("ローディング状態", () => {
		it("送信中はフォーム入力が無効化されること", () => {
			render(<SubscriptionForm {...defaultProps} isSubmitting={true} />);

			expect(screen.getByLabelText(/サービス名/)).toBeDisabled();
			expect(screen.getByLabelText(/料金（円）/)).toBeDisabled();
			expect(screen.getByLabelText(/請求サイクル/)).toBeDisabled();
			expect(screen.getByLabelText(/次回請求日/)).toBeDisabled();
			expect(screen.getByLabelText(/カテゴリ/)).toBeDisabled();
			expect(screen.getByLabelText(/説明（任意）/)).toBeDisabled();
			expect(screen.getByRole("button", { name: /登録/ })).toBeDisabled();
			expect(screen.getByRole("button", { name: "キャンセル" })).toBeDisabled();
		});
	});

	describe("編集モード", () => {
		it("初期データが正しく処理されること", () => {
			render(
				<SubscriptionForm {...defaultProps} initialData={validFormData} />,
			);

			expect(screen.getByDisplayValue(validFormData.name)).toBeInTheDocument();
			expect(
				screen.getByDisplayValue(validFormData.amount.toString()),
			).toBeInTheDocument();
			expect(
				screen.getByDisplayValue(validFormData.nextBillingDate),
			).toBeInTheDocument();
			expect(
				screen.getByDisplayValue(validFormData.description || ""),
			).toBeInTheDocument();
			expect(screen.getByRole("button", { name: "更新" })).toBeInTheDocument();
		});

		it("初期データが変更された場合に更新されること", () => {
			const { rerender } = render(<SubscriptionForm {...defaultProps} />);

			// 初期データなしで開始
			expect(screen.getByLabelText(/サービス名/)).toHaveValue("");

			// 初期データありで再レンダリング
			rerender(
				<SubscriptionForm {...defaultProps} initialData={validFormData} />,
			);
			expect(screen.getByLabelText(/サービス名/)).toHaveValue(
				validFormData.name,
			);
		});
	});

	describe("アクセシビリティ", () => {
		it("エラー時に適切なARIA属性が設定されること", async () => {
			const user = userEvent.setup();
			render(<SubscriptionForm {...defaultProps} />);

			const nameInput = screen.getByLabelText(/サービス名/);
			await user.click(nameInput);
			await user.tab();

			await waitFor(() => {
				expect(nameInput).toHaveAttribute("aria-invalid", "true");
				expect(nameInput).toHaveAttribute("aria-describedby", "name-error");
			});
		});

		it('エラーメッセージにrole="alert"が設定されること', async () => {
			const user = userEvent.setup();
			render(<SubscriptionForm {...defaultProps} />);

			const nameInput = screen.getByLabelText(/サービス名/);
			await user.click(nameInput);
			await user.tab();

			await waitFor(() => {
				const errorMessage = screen.getByText("サービス名は必須です");
				expect(errorMessage).toHaveAttribute("role", "alert");
			});
		});

		it("フォームが適切なnoValidate属性を持つこと", () => {
			const { container } = render(<SubscriptionForm {...defaultProps} />);

			const form = container.querySelector("form");
			expect(form).toHaveAttribute("noValidate");
		});
	});
});
