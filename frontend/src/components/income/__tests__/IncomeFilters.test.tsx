/**
 * IncomeFiltersコンポーネントのテスト
 *
 * 収入データのフィルタリング機能を検証
 * 期間、カテゴリ、金額範囲によるフィルタリングをテスト
 */

import { INCOME_CATEGORIES } from "@shared/config";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { describe, expect, it, vi } from "vitest";
import { createMockCategories } from "../../../test-utils/categoryHelpers";
import type { IncomeFiltersProps } from "../../../types/income";
import { IncomeFilters } from "../IncomeFilters";

// Next.js のルーター機能をモック
vi.mock("next/navigation", () => ({
	useRouter: vi.fn(),
	useSearchParams: vi.fn(),
	usePathname: vi.fn(),
}));

describe("IncomeFilters", () => {
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

	it("収入フィルターコンポーネントが正しくレンダリングされること", () => {
		render(<IncomeFilters {...defaultProps} />);

		// 基本的な要素の確認
		expect(screen.getByLabelText("収入フィルター")).toBeInTheDocument();
		expect(screen.getByLabelText("期間")).toBeInTheDocument();
		expect(screen.getByText("カテゴリ")).toBeInTheDocument();
		expect(screen.getByLabelText("最小金額")).toBeInTheDocument();
		expect(screen.getByLabelText("最大金額")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "リセット" }),
		).toBeInTheDocument();
	});

	it("期間フィルターが正しく動作すること", async () => {
		const user = userEvent.setup();
		render(<IncomeFilters {...defaultProps} />);

		const periodSelect = screen.getByLabelText("期間");

		// 今月を選択
		await user.selectOptions(periodSelect, "thisMonth");

		await waitFor(() => {
			expect(mockOnFiltersChange).toHaveBeenCalledWith(
				expect.objectContaining({
					period: "thisMonth",
				}),
			);
		});

		// カスタム期間を選択
		await user.selectOptions(periodSelect, "custom");

		// カスタム期間の日付入力フィールドが表示される
		await waitFor(() => {
			expect(screen.getByLabelText("開始日")).toBeInTheDocument();
			expect(screen.getByLabelText("終了日")).toBeInTheDocument();
		});
	});

	it("カスタム期間の日付入力が正しく動作すること", async () => {
		const user = userEvent.setup();
		render(<IncomeFilters {...defaultProps} />);

		// カスタム期間を選択
		const periodSelect = screen.getByLabelText("期間");
		await user.selectOptions(periodSelect, "custom");

		// 日付を入力
		const startDateInput = screen.getByLabelText("開始日");
		const endDateInput = screen.getByLabelText("終了日");

		await user.type(startDateInput, "2025-01-01");
		await user.type(endDateInput, "2025-01-31");

		await waitFor(() => {
			expect(mockOnFiltersChange).toHaveBeenCalledWith(
				expect.objectContaining({
					period: "custom",
					startDate: "2025-01-01",
					endDate: "2025-01-31",
				}),
			);
		});
	});

	it("収入カテゴリフィルターが複数選択可能であること", async () => {
		const user = userEvent.setup();
		render(<IncomeFilters {...defaultProps} />);

		// 給与カテゴリを選択
		const salaryCheckbox = screen.getByLabelText("給与");
		await user.click(salaryCheckbox);

		// ボーナスカテゴリも選択
		const bonusCheckbox = screen.getByLabelText("ボーナス");
		await user.click(bonusCheckbox);

		await waitFor(() => {
			expect(mockOnFiltersChange).toHaveBeenCalledWith(
				expect.objectContaining({
					categories: ["101", "102"],
				}),
			);
		});
	});

	it("金額範囲フィルターが正しく動作すること", async () => {
		const user = userEvent.setup();
		render(<IncomeFilters {...defaultProps} />);

		const minAmountInput = screen.getByLabelText("最小金額");
		const maxAmountInput = screen.getByLabelText("最大金額");

		await user.type(minAmountInput, "10000");
		await user.type(maxAmountInput, "500000");

		await waitFor(() => {
			expect(mockOnFiltersChange).toHaveBeenCalledWith(
				expect.objectContaining({
					minAmount: 10000,
					maxAmount: 500000,
				}),
			);
		});
	});

	it("負の金額入力時にエラーが表示されること", async () => {
		const user = userEvent.setup();
		render(<IncomeFilters {...defaultProps} />);

		const minAmountInput = screen.getByLabelText("最小金額");
		await user.type(minAmountInput, "-1000");

		await waitFor(() => {
			expect(
				screen.getByText("金額は0以上の数値を入力してください"),
			).toBeInTheDocument();
		});
	});

	it("リセットボタンですべてのフィルターがクリアされること", async () => {
		const user = userEvent.setup();
		render(<IncomeFilters {...defaultProps} />);

		// フィルターを設定
		const periodSelect = screen.getByLabelText("期間");
		await user.selectOptions(periodSelect, "thisMonth");

		const salaryCheckbox = screen.getByLabelText("給与");
		await user.click(salaryCheckbox);

		const minAmountInput = screen.getByLabelText("最小金額");
		await user.type(minAmountInput, "10000");

		// リセットボタンをクリック
		const resetButton = screen.getByRole("button", { name: "リセット" });
		await user.click(resetButton);

		await waitFor(() => {
			expect(mockOnFiltersChange).toHaveBeenLastCalledWith({});
		});

		// フィールドがクリアされている
		expect((periodSelect as unknown as HTMLSelectElement).value).toBe("");
		expect((salaryCheckbox as HTMLInputElement).checked).toBe(false);
		expect((minAmountInput as HTMLInputElement).value).toBe("");
	});

	it("URLパラメータから初期値が復元されること", () => {
		const searchParams = new URLSearchParams({
			period: "thisMonth",
			categories: "101,102",
			minAmount: "10000",
			maxAmount: "500000",
		});

		(useSearchParams as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
			searchParams,
		);

		render(<IncomeFilters {...defaultProps} />);

		// 期間が選択されている
		const periodSelect = screen.getByLabelText(
			"期間",
		) as unknown as HTMLSelectElement;
		expect(periodSelect.value).toBe("thisMonth");

		// カテゴリがチェックされている
		const salaryCheckbox = screen.getByLabelText("給与") as HTMLInputElement;
		const bonusCheckbox = screen.getByLabelText("ボーナス") as HTMLInputElement;
		expect(salaryCheckbox.checked).toBe(true);
		expect(bonusCheckbox.checked).toBe(true);

		// 金額が入力されている
		const minAmountInput = screen.getByLabelText(
			"最小金額",
		) as HTMLInputElement;
		const maxAmountInput = screen.getByLabelText(
			"最大金額",
		) as HTMLInputElement;
		expect(minAmountInput.value).toBe("10000");
		expect(maxAmountInput.value).toBe("500000");
	});

	it("フィルター変更時にURLパラメータが更新されること", async () => {
		const user = userEvent.setup();
		render(<IncomeFilters {...defaultProps} />);

		const periodSelect = screen.getByLabelText("期間");
		await user.selectOptions(periodSelect, "lastMonth");

		await waitFor(() => {
			expect(mockRouter.replace).toHaveBeenCalledWith(
				expect.stringContaining("period=lastMonth"),
			);
		});
	});

	it("disableUrlSyncがtrueの場合、URLパラメータが更新されないこと", async () => {
		const user = userEvent.setup();
		render(<IncomeFilters {...defaultProps} disableUrlSync={true} />);

		const periodSelect = screen.getByLabelText("期間");
		await user.selectOptions(periodSelect, "thisYear");

		await waitFor(() => {
			expect(mockOnFiltersChange).toHaveBeenCalled();
			expect(mockRouter.replace).not.toHaveBeenCalled();
		});
	});

	it("選択中のフィルターがバッジで表示されること", async () => {
		const user = userEvent.setup();
		render(<IncomeFilters {...defaultProps} />);

		// フィルターを設定
		await user.selectOptions(screen.getByLabelText("期間"), "thisMonth");
		await user.click(screen.getByLabelText("給与"));
		await user.type(screen.getByLabelText("最小金額"), "10000");

		// アクティブフィルターのバッジが表示される
		await waitFor(() => {
			expect(screen.getByText("今月")).toBeInTheDocument();
			expect(screen.getByText("給与")).toBeInTheDocument();
			expect(screen.getByText("¥10,000以上")).toBeInTheDocument();
		});
	});

	it("モバイル表示でレイアウトが縦並びになること", () => {
		// ウィンドウサイズをモバイルに設定
		Object.defineProperty(window, "matchMedia", {
			writable: true,
			value: vi.fn().mockImplementation((query) => ({
				matches: query === "(max-width: 768px)",
				media: query,
				onchange: null,
				addListener: vi.fn(),
				removeListener: vi.fn(),
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
				dispatchEvent: vi.fn(),
			})),
		});

		render(<IncomeFilters {...defaultProps} />);

		// flex-col クラスが適用されている
		const container = screen.getByLabelText("収入フィルター");
		const flexElements = container.querySelectorAll(".flex-col");
		expect(flexElements.length).toBeGreaterThan(0);
	});

	it("収入固有のカテゴリのみが表示されること", () => {
		render(<IncomeFilters {...defaultProps} />);

		// 収入カテゴリが表示されている
		expect(screen.getByLabelText("給与")).toBeInTheDocument();
		expect(screen.getByLabelText("ボーナス")).toBeInTheDocument();
		expect(screen.getByLabelText("副業")).toBeInTheDocument();
		expect(screen.getByLabelText("投資収益")).toBeInTheDocument();
		expect(screen.getByLabelText("その他")).toBeInTheDocument();

		// 支出カテゴリは表示されていない
		expect(screen.queryByLabelText("食費")).not.toBeInTheDocument();
		expect(screen.queryByLabelText("交通費")).not.toBeInTheDocument();
	});

	it("フィルターのスタイルが緑系統であること", () => {
		render(<IncomeFilters {...defaultProps} />);

		const container = screen.getByLabelText("収入フィルター");

		// 緑系統のクラスが適用されている
		expect(container.className).toContain("bg-green-50");

		// カテゴリの色が緑系統
		const salaryLabel = screen.getByText("給与");
		expect(salaryLabel.style.color).toMatch(/#10b981|rgb\(16,\s*185,\s*129\)/);
	});
});
