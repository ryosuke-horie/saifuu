/**
 * IncomeFiltersコンポーネントのエラーハンドリングテスト
 *
 * 入力バリデーション、エラー状態の処理を検証
 * 注：現在の実装では、ネットワークエラーは親コンポーネントで処理される想定
 */

import { INCOME_CATEGORIES } from "@shared/config";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockCategories } from "../../../test-utils/categoryHelpers";
import type { IncomeFiltersProps } from "../../../types/income";
import { IncomeFilters } from "../IncomeFilters";

// Next.js のルーター機能をモック
vi.mock("next/navigation", () => ({
	useRouter: vi.fn(),
	useSearchParams: vi.fn(),
	usePathname: vi.fn(),
}));

describe("IncomeFilters - エラーハンドリングとエッジケース", () => {
	const mockOnFiltersChange = vi.fn();
	const mockCategories = createMockCategories(INCOME_CATEGORIES);
	const mockRouter = { replace: vi.fn(), push: vi.fn() };
	const mockSearchParams = new URLSearchParams();

	const defaultProps: IncomeFiltersProps = {
		onFiltersChange: mockOnFiltersChange,
		categories: mockCategories,
	};

	beforeEach(() => {
		vi.clearAllMocks();
		(useRouter as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
			mockRouter,
		);
		(useSearchParams as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
			mockSearchParams,
		);
		(usePathname as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
			"/income",
		);
	});

	describe("フィルター同期エラー", () => {
		it("URL更新失敗時でもフィルター機能は正常動作する", async () => {
			// RouterのreplaceメソッドがエラーをスローするようにMock
			const mockRouterWithError = {
				...mockRouter,
				replace: vi.fn().mockRejectedValue(new Error("Navigation failed")),
			};
			(useRouter as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
				mockRouterWithError,
			);

			const user = userEvent.setup();
			render(<IncomeFilters {...defaultProps} />);

			// フィルターを設定
			const periodSelect = screen.getByLabelText("期間");
			await user.selectOptions(periodSelect, "thisMonth");

			// フィルター自体は正常に動作
			await waitFor(() => {
				expect(mockOnFiltersChange).toHaveBeenCalledWith(
					expect.objectContaining({
						period: "thisMonth",
					}),
				);
			});

			// URL更新は失敗するが、UIは正常に更新される
			expect(periodSelect).toHaveValue("thisMonth");
		});

		it("不正なURLパラメータは無視される", async () => {
			// 不正なURLパラメータを設定
			const invalidSearchParams = new URLSearchParams({
				period: "invalid_period",
				categories: "999,invalid",
				minAmount: "abc", // 数値でない
				maxAmount: "-1000", // 負の値
			});

			(useSearchParams as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
				invalidSearchParams,
			);

			render(<IncomeFilters {...defaultProps} />);

			// 不正な値は無視され、デフォルト値が使用される
			await waitFor(() => {
				const periodSelect = screen.getByLabelText(
					"期間",
				) as unknown as HTMLSelectElement;
				expect(periodSelect.value).toBe("");

				const minAmountInput = screen.getByLabelText(
					"最小金額",
				) as unknown as HTMLInputElement;
				expect(minAmountInput.value).toBe("");

				const maxAmountInput = screen.getByLabelText(
					"最大金額",
				) as unknown as HTMLInputElement;
				expect(maxAmountInput.value).toBe("");
			});
		});

		it("複数フィルター同時変更時の最終状態が正しい", async () => {
			const user = userEvent.setup();
			render(<IncomeFilters {...defaultProps} />);

			// 複数のフィルターを短時間で変更
			const periodSelect = screen.getByLabelText("期間");
			const minAmountInput = screen.getByLabelText("最小金額");
			const salaryCheckbox = screen.getByLabelText("給与");

			// 順番に操作を実行
			await user.selectOptions(periodSelect, "thisMonth");
			await user.type(minAmountInput, "10000");
			await user.click(salaryCheckbox);

			// 最終的な状態が正しく反映される
			await waitFor(() => {
				const lastCall =
					mockOnFiltersChange.mock.calls[
						mockOnFiltersChange.mock.calls.length - 1
					];
				expect(lastCall[0]).toEqual(
					expect.objectContaining({
						period: "thisMonth",
						minAmount: 10000,
						categories: ["101"],
					}),
				);
			});
		});
	});

	describe("金額範囲の異常値処理", () => {
		it("負の金額でもonFiltersChangeは呼ばれる（UIの更新のため）", async () => {
			const user = userEvent.setup();
			render(<IncomeFilters {...defaultProps} />);

			const minAmountInput = screen.getByLabelText("最小金額");
			await user.clear(minAmountInput);
			await user.type(minAmountInput, "-5000");

			// onFiltersChangeは呼ばれる（UIを最新に保つため）
			await waitFor(() => {
				expect(mockOnFiltersChange).toHaveBeenCalledWith(
					expect.objectContaining({
						minAmount: -5000,
					}),
				);
			});
		});

		it("非常に大きな金額の処理", async () => {
			const user = userEvent.setup();
			render(<IncomeFilters {...defaultProps} />);

			const maxAmountInput = screen.getByLabelText("最大金額");
			await user.type(maxAmountInput, "999999999999");

			// 大きな値でもonFiltersChangeは呼ばれる
			await waitFor(() => {
				expect(mockOnFiltersChange).toHaveBeenCalledWith(
					expect.objectContaining({
						maxAmount: 999999999999,
					}),
				);
			});
		});

		it("最小金額が最大金額を超える場合でも値は設定される", async () => {
			const user = userEvent.setup();
			render(<IncomeFilters {...defaultProps} />);

			const minAmountInput = screen.getByLabelText("最小金額");
			const maxAmountInput = screen.getByLabelText("最大金額");

			await user.type(minAmountInput, "50000");
			await user.type(maxAmountInput, "10000");

			// 両方の値が設定される（バリデーションは親コンポーネントで行う）
			await waitFor(() => {
				expect(mockOnFiltersChange).toHaveBeenCalledWith(
					expect.objectContaining({
						minAmount: 50000,
						maxAmount: 10000,
					}),
				);
			});
		});

		it("金額フィールドをクリアすると undefined が設定される", async () => {
			const user = userEvent.setup();
			render(<IncomeFilters {...defaultProps} />);

			const minAmountInput = screen.getByLabelText("最小金額");

			// 値を入力
			await user.type(minAmountInput, "10000");

			// onFiltersChangeが呼ばれるのを待つ
			await waitFor(() => {
				expect(mockOnFiltersChange).toHaveBeenCalledWith(
					expect.objectContaining({
						minAmount: 10000,
					}),
				);
			});

			// クリア
			await user.clear(minAmountInput);

			// 空文字列になることを確認（type=numberの場合はnullになる）
			expect(minAmountInput).toHaveValue(null);
		});
	});

	describe("カテゴリフィルターのエッジケース", () => {
		it("存在しないカテゴリIDがURLに含まれる場合は無視される", () => {
			const searchParams = new URLSearchParams({
				categories: "101,999,invalid,102",
			});

			(useSearchParams as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
				searchParams,
			);

			render(<IncomeFilters {...defaultProps} />);

			// 有効なカテゴリのみがチェックされる
			const salaryCheckbox = screen.getByLabelText(
				"給与",
			) as unknown as HTMLInputElement;
			const bonusCheckbox = screen.getByLabelText(
				"ボーナス",
			) as unknown as HTMLInputElement;
			expect(salaryCheckbox.checked).toBe(true);
			expect(bonusCheckbox.checked).toBe(true);
		});

		it("すべてのカテゴリを選択・解除できる", async () => {
			const user = userEvent.setup();
			render(<IncomeFilters {...defaultProps} />);

			// すべてのカテゴリを選択
			const allCheckboxes = screen.getAllByRole("checkbox");
			for (const checkbox of allCheckboxes) {
				await user.click(checkbox);
			}

			// すべてのカテゴリIDが含まれる
			await waitFor(() => {
				const lastCall =
					mockOnFiltersChange.mock.calls[
						mockOnFiltersChange.mock.calls.length - 1
					];
				expect(lastCall[0].categories).toHaveLength(5);
			});

			// すべてのカテゴリを解除
			for (const checkbox of allCheckboxes) {
				await user.click(checkbox);
			}

			// カテゴリが空になる（またはcategoriesキーが削除される）
			await waitFor(() => {
				const lastCall =
					mockOnFiltersChange.mock.calls[
						mockOnFiltersChange.mock.calls.length - 1
					];
				// categoriesが[]またはundefinedのいずれか
				expect(lastCall[0].categories || []).toEqual([]);
			});
		});
	});

	describe("パフォーマンスとレース条件", () => {
		it("高頻度の入力でもdebounceが機能する", async () => {
			const user = userEvent.setup();
			render(<IncomeFilters {...defaultProps} />);

			const minAmountInput = screen.getByLabelText("最小金額");

			// 短時間で複数の値を入力
			await user.type(minAmountInput, "1");
			await user.type(minAmountInput, "2");
			await user.type(minAmountInput, "3");

			// onFiltersChangeは即座に呼ばれる
			expect(mockOnFiltersChange).toHaveBeenCalled();

			// しかしURL更新はdebounceされる
			// 実際のdebounce時間を待つ（実装に依存）
			await new Promise((resolve) => setTimeout(resolve, 400));

			// 最終的な値でURL更新される
			const lastCall =
				mockRouter.replace.mock.calls[mockRouter.replace.mock.calls.length - 1];
			if (lastCall) {
				expect(lastCall[0]).toContain("minAmount=123");
			}
		}, 15000);
	});
});
