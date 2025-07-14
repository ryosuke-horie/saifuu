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
 * - 基本的なレンダリング
 * - フォーム入力処理
 * - バリデーション機能
 * - 送信処理
 * - エラーハンドリング
 * - ローディング状態
 * - 編集モード
 * - アクセシビリティ
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

	describe("基本的なレンダリング", () => {
		it("正常にレンダリングされること", () => {
			render(<SubscriptionForm {...defaultProps} />);

			expect(screen.getByLabelText(/サービス名/)).toBeInTheDocument();
			expect(screen.getByLabelText(/料金（円）/)).toBeInTheDocument();
			expect(screen.getByLabelText(/請求サイクル/)).toBeInTheDocument();
			expect(screen.getByLabelText(/次回請求日/)).toBeInTheDocument();
			expect(screen.getByLabelText(/カテゴリ/)).toBeInTheDocument();
			expect(screen.getByLabelText(/説明（任意）/)).toBeInTheDocument();
		});

		it("必須フィールドマークが表示されること", () => {
			render(<SubscriptionForm {...defaultProps} />);

			const requiredMarks = screen.getAllByText("*");
			// name, amount, billingCycle, nextBillingDate, category = 5個
			expect(requiredMarks).toHaveLength(5);
		});

		it("ボタンが正しく表示されること", () => {
			render(<SubscriptionForm {...defaultProps} />);

			expect(
				screen.getByRole("button", { name: "キャンセル" }),
			).toBeInTheDocument();
			expect(screen.getByRole("button", { name: "登録" })).toBeInTheDocument();
		});

		it("カスタムクラス名が適用されること", () => {
			const { container } = render(
				<SubscriptionForm {...defaultProps} className="custom-class" />,
			);

			expect(container.firstChild).toHaveClass("custom-class");
		});
	});

	describe("フォーム入力処理", () => {
		it("テキスト入力が正しく動作すること", async () => {
			const user = userEvent.setup();
			render(<SubscriptionForm {...defaultProps} />);

			const nameInput = screen.getByLabelText(/サービス名/);
			await user.type(nameInput, "Netflix");

			expect(nameInput).toHaveValue("Netflix");
		});

		it("数値入力が正しく動作すること", async () => {
			const user = userEvent.setup();
			render(<SubscriptionForm {...defaultProps} />);

			const amountInput = screen.getByLabelText(/料金（円）/);
			await user.type(amountInput, "1480");

			expect(amountInput).toHaveValue(1480);
		});

		it("セレクト選択が正しく動作すること", async () => {
			const user = userEvent.setup();
			render(<SubscriptionForm {...defaultProps} />);

			const billingCycleSelect = screen.getByLabelText(/請求サイクル/);
			await user.selectOptions(billingCycleSelect, "yearly");

			expect(billingCycleSelect).toHaveValue("yearly");
		});

		it("日付入力が正しく動作すること", async () => {
			const user = userEvent.setup();
			render(<SubscriptionForm {...defaultProps} />);

			const dateInput = screen.getByLabelText(/次回請求日/);
			await user.type(dateInput, "2025-07-01");

			expect(dateInput).toHaveValue("2025-07-01");
		});

		it("テキストエリア入力が正しく動作すること", async () => {
			const user = userEvent.setup();
			render(<SubscriptionForm {...defaultProps} />);

			const descriptionInput = screen.getByLabelText(/説明（任意）/);
			await user.type(descriptionInput, "動画配信サービス");

			expect(descriptionInput).toHaveValue("動画配信サービス");
		});

		it("文字数カウンターが正しく動作すること", async () => {
			const user = userEvent.setup();
			render(<SubscriptionForm {...defaultProps} />);

			const descriptionInput = screen.getByLabelText(/説明（任意）/);
			await user.type(descriptionInput, "テスト");

			expect(screen.getByText("3/500文字")).toBeInTheDocument();
		});
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
		it("送信中の状態が正しく表示されること", () => {
			render(<SubscriptionForm {...defaultProps} isSubmitting={true} />);

			const submitButton = screen.getByRole("button", { name: /登録/ });
			const cancelButton = screen.getByRole("button", { name: "キャンセル" });

			expect(submitButton).toBeDisabled();
			expect(cancelButton).toBeDisabled();
			expect(screen.getByRole("button", { name: /登録/ })).toHaveClass(
				"disabled:opacity-50",
			);
		});

		it("送信中はフォーム入力が無効化されること", () => {
			render(<SubscriptionForm {...defaultProps} isSubmitting={true} />);

			expect(screen.getByLabelText(/サービス名/)).toBeDisabled();
			expect(screen.getByLabelText(/料金（円）/)).toBeDisabled();
			expect(screen.getByLabelText(/請求サイクル/)).toBeDisabled();
			expect(screen.getByLabelText(/次回請求日/)).toBeDisabled();
			expect(screen.getByLabelText(/カテゴリ/)).toBeDisabled();
			expect(screen.getByLabelText(/説明（任意）/)).toBeDisabled();
		});

		it("送信中のスピナーが表示されること", () => {
			render(<SubscriptionForm {...defaultProps} isSubmitting={true} />);

			const spinner = document.querySelector(".animate-spin");
			expect(spinner).toBeInTheDocument();
		});
	});

	describe("編集モード", () => {
		it("初期データが正しく表示されること", () => {
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

			// セレクト要素の値確認
			expect(screen.getByLabelText(/請求サイクル/)).toHaveValue(
				validFormData.billingCycle,
			);
			expect(screen.getByLabelText(/カテゴリ/)).toHaveValue(
				validFormData.categoryId,
			);
		});

		it("編集モードでボタンテキストが「更新」になること", () => {
			render(
				<SubscriptionForm {...defaultProps} initialData={validFormData} />,
			);

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
		it("必須フィールドマークが表示されること", () => {
			render(<SubscriptionForm {...defaultProps} />);

			const requiredMarks = screen.getAllByText("*");
			expect(requiredMarks).toHaveLength(5); // name, amount, billingCycle, nextBillingDate, category
		});

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

	describe("デフォルト値", () => {
		it("デフォルト値が正しく設定されること", () => {
			render(<SubscriptionForm {...defaultProps} />);

			expect(screen.getByLabelText(/サービス名/)).toHaveValue(""); // name
			expect(screen.getByLabelText(/料金（円）/)).toHaveValue(null); // amount (empty number input is null)
			expect(screen.getByLabelText(/請求サイクル/)).toHaveValue("monthly"); // billingCycle
			expect(screen.getByLabelText(/カテゴリ/)).toHaveValue(""); // categoryId
		});
	});

	describe("日付の制約", () => {
		it("日付入力フィールドに最小値が設定されること", () => {
			render(<SubscriptionForm {...defaultProps} />);

			const dateInput = screen.getByLabelText(/次回請求日/);
			const today = new Date().toISOString().split("T")[0];
			expect(dateInput).toHaveAttribute("min", today);
		});
	});

	describe("カテゴリオプションの表示", () => {
		it("カテゴリが日本語で表示されること", () => {
			render(<SubscriptionForm {...defaultProps} />);

			expect(screen.getByText("食費")).toBeInTheDocument();
			expect(screen.getByText("仕事・ビジネス")).toBeInTheDocument();
			expect(screen.getByText("健康・フィットネス")).toBeInTheDocument();
			expect(screen.getByText("その他")).toBeInTheDocument();
		});

		it("請求サイクルが日本語で表示されること", () => {
			render(<SubscriptionForm {...defaultProps} />);

			expect(screen.getByText("月額")).toBeInTheDocument();
			expect(screen.getByText("年額")).toBeInTheDocument();
		});
	});
});
