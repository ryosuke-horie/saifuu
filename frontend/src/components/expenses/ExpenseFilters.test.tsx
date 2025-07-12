/**
 * ExpenseFiltersコンポーネントのユニットテスト
 *
 * 期間指定、カテゴリ絞り込み、種別絞り込み、金額範囲指定の機能と
 * URLパラメータとの連携をテストする
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import type { ExpenseFiltersProps } from "../../types/expense";
import { convertGlobalCategoriesToCategory } from "../../utils/categories";
import { ExpenseFilters } from "./ExpenseFilters";

// Next.jsのrouterモック
vi.mock("next/navigation", () => ({
	useSearchParams: vi.fn(() => new URLSearchParams()),
	useRouter: vi.fn(() => ({
		push: vi.fn(),
		replace: vi.fn(),
	})),
	usePathname: vi.fn(() => "/expenses"),
}));

describe("ExpenseFilters", () => {
	const mockOnFiltersChange = vi.fn();
	const defaultCategories = [
		...convertGlobalCategoriesToCategory("expense"),
		...convertGlobalCategoriesToCategory("income"),
	];

	const defaultProps: ExpenseFiltersProps = {
		onFiltersChange: mockOnFiltersChange,
		categories: defaultCategories,
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("基本的な表示", () => {
		it("フィルターコンポーネントが正しく表示される", () => {
			render(<ExpenseFilters {...defaultProps} />);

			// 各フィルター要素の存在確認
			expect(screen.getByLabelText("期間")).toBeInTheDocument();
			expect(screen.getByText("カテゴリ")).toBeInTheDocument();
			expect(screen.getByLabelText("種別")).toBeInTheDocument();
			expect(screen.getByLabelText("最小金額")).toBeInTheDocument();
			expect(screen.getByLabelText("最大金額")).toBeInTheDocument();
			expect(
				screen.getByRole("button", { name: "リセット" }),
			).toBeInTheDocument();
		});

		it("初期状態では全てのフィルターが未選択状態", () => {
			render(<ExpenseFilters {...defaultProps} />);

			const periodSelect = screen.getByLabelText("期間");
			const typeSelect = screen.getByLabelText("種別");
			const minAmountInput = screen.getByLabelText(
				"最小金額",
			) as HTMLInputElement;
			const maxAmountInput = screen.getByLabelText(
				"最大金額",
			) as HTMLInputElement;

			expect((periodSelect as unknown as HTMLSelectElement).value).toBe("");
			// カテゴリは複数選択のため個別のチェックボックスで確認するため、ここでは確認しない
			expect((typeSelect as unknown as HTMLSelectElement).value).toBe("");
			expect(minAmountInput.value).toBe("");
			expect(maxAmountInput.value).toBe("");
		});
	});

	describe("期間フィルター", () => {
		it("期間を選択するとonFiltersChangeが呼ばれる", async () => {
			const user = userEvent.setup();
			render(<ExpenseFilters {...defaultProps} />);

			const periodSelect = screen.getByLabelText("期間");
			await user.selectOptions(periodSelect, "current_month");

			await waitFor(() => {
				expect(mockOnFiltersChange).toHaveBeenCalledWith({
					period: "current_month",
				});
			});
		});

		it("カスタム期間を選択すると日付入力フィールドが表示される", async () => {
			const user = userEvent.setup();
			render(<ExpenseFilters {...defaultProps} />);

			const periodSelect = screen.getByLabelText("期間");
			await user.selectOptions(periodSelect, "custom");

			expect(screen.getByLabelText("開始日")).toBeInTheDocument();
			expect(screen.getByLabelText("終了日")).toBeInTheDocument();
		});
	});

	describe("カテゴリフィルター", () => {
		it("カテゴリを選択するとonFiltersChangeが呼ばれる", async () => {
			const user = userEvent.setup();
			render(<ExpenseFilters {...defaultProps} />);

			const foodCheckbox = screen.getByRole("checkbox", { name: "食費" });
			await user.click(foodCheckbox);

			await waitFor(() => {
				expect(mockOnFiltersChange).toHaveBeenCalledWith({
					categoryIds: ["food"],
				});
			});
		});

		it("複数のカテゴリを選択できる", async () => {
			const user = userEvent.setup();
			render(<ExpenseFilters {...defaultProps} />);

			// 複数選択可能なカテゴリ選択UI
			const foodCheckbox = screen.getByRole("checkbox", { name: "食費" });
			const transportCheckbox = screen.getByRole("checkbox", {
				name: "交通費",
			});

			await user.click(foodCheckbox);
			await user.click(transportCheckbox);

			await waitFor(() => {
				expect(mockOnFiltersChange).toHaveBeenCalledWith({
					categoryIds: ["food", "transportation"],
				});
			});
		});
	});

	describe("種別フィルター", () => {
		it("収入のみを選択するとonFiltersChangeが呼ばれる", async () => {
			const user = userEvent.setup();
			render(<ExpenseFilters {...defaultProps} />);

			const typeSelect = screen.getByLabelText("種別");
			await user.selectOptions(typeSelect, "income");

			await waitFor(() => {
				expect(mockOnFiltersChange).toHaveBeenCalledWith({
					type: "income",
				});
			});
		});

		it("支出のみを選択するとonFiltersChangeが呼ばれる", async () => {
			const user = userEvent.setup();
			render(<ExpenseFilters {...defaultProps} />);

			const typeSelect = screen.getByLabelText("種別");
			await user.selectOptions(typeSelect, "expense");

			await waitFor(() => {
				expect(mockOnFiltersChange).toHaveBeenCalledWith({
					type: "expense",
				});
			});
		});
	});

	describe("金額範囲フィルター", () => {
		it("最小金額を入力するとonFiltersChangeが呼ばれる", async () => {
			const user = userEvent.setup();
			render(<ExpenseFilters {...defaultProps} />);

			const minAmountInput = screen.getByLabelText("最小金額");
			await user.type(minAmountInput, "1000");

			await waitFor(() => {
				expect(mockOnFiltersChange).toHaveBeenCalledWith({
					minAmount: 1000,
				});
			});
		});

		it("最大金額を入力するとonFiltersChangeが呼ばれる", async () => {
			const user = userEvent.setup();
			render(<ExpenseFilters {...defaultProps} />);

			const maxAmountInput = screen.getByLabelText("最大金額");
			await user.type(maxAmountInput, "10000");

			await waitFor(() => {
				expect(mockOnFiltersChange).toHaveBeenCalledWith({
					maxAmount: 10000,
				});
			});
		});

		it.skip("無効な金額入力はエラーを表示する", async () => {
			const user = userEvent.setup();
			render(<ExpenseFilters {...defaultProps} />);

			const minAmountInput = screen.getByLabelText("最小金額");
			await user.type(minAmountInput, "-100");
			// バリデーションをトリガーするためにblurイベントを発火
			await user.tab();

			await waitFor(() => {
				expect(
					screen.getByText("金額は0以上の数値を入力してください"),
				).toBeInTheDocument();
			});
		});
	});

	describe.skip("URLパラメータ連携", () => {
		it("URLパラメータから初期値を読み込む", () => {
			// Next.jsのnavigationモックを再定義
			const useSearchParams = vi.fn();
			const searchParams = new URLSearchParams({
				type: "expense",
				categoryIds: "food,transportation",
				minAmount: "1000",
				maxAmount: "5000",
				period: "current_month",
			});
			useSearchParams.mockReturnValue(searchParams);

			vi.doMock("next/navigation", () => ({
				useSearchParams,
				useRouter: vi.fn(() => ({
					push: vi.fn(),
					replace: vi.fn(),
				})),
				usePathname: vi.fn(() => "/expenses"),
			}));

			render(<ExpenseFilters {...defaultProps} />);

			const typeSelect = screen.getByLabelText(
				"種別",
			) as unknown as HTMLSelectElement;
			const minAmountInput = screen.getByLabelText(
				"最小金額",
			) as HTMLInputElement;
			const maxAmountInput = screen.getByLabelText(
				"最大金額",
			) as HTMLInputElement;

			expect(typeSelect.value).toBe("expense");
			expect(minAmountInput.value).toBe("1000");
			expect(maxAmountInput.value).toBe("5000");
		});

		it("フィルター変更時にURLパラメータを更新する", async () => {
			const useRouter = vi.fn();
			const mockReplace = vi.fn();
			useRouter.mockReturnValue({
				push: vi.fn(),
				replace: mockReplace,
			} as any);

			vi.doMock("next/navigation", () => ({
				useSearchParams: vi.fn(() => new URLSearchParams()),
				useRouter,
				usePathname: vi.fn(() => "/expenses"),
			}));

			const user = userEvent.setup();
			render(<ExpenseFilters {...defaultProps} />);

			const typeSelect = screen.getByLabelText("種別");
			await user.selectOptions(typeSelect, "income");

			await waitFor(() => {
				expect(mockReplace).toHaveBeenCalledWith(
					expect.stringContaining("type=income"),
				);
			});
		});
	});

	describe("リセット機能", () => {
		it("リセットボタンをクリックすると全てのフィルターがクリアされる", async () => {
			const user = userEvent.setup();
			render(<ExpenseFilters {...defaultProps} />);

			// フィルターを設定
			const typeSelect = screen.getByLabelText("種別");
			const minAmountInput = screen.getByLabelText("最小金額");
			await user.selectOptions(typeSelect, "expense");
			await user.type(minAmountInput, "1000");

			// リセットボタンをクリック
			const resetButton = screen.getByRole("button", { name: "リセット" });
			await user.click(resetButton);

			await waitFor(() => {
				expect(mockOnFiltersChange).toHaveBeenCalledWith({});
				expect((typeSelect as unknown as HTMLSelectElement).value).toBe("");
				expect((minAmountInput as unknown as HTMLInputElement).value).toBe("");
			});
		});

		it.skip("リセット時にURLパラメータもクリアされる", async () => {
			const useRouter = vi.fn();
			const mockReplace = vi.fn();
			useRouter.mockReturnValue({
				push: vi.fn(),
				replace: mockReplace,
			} as any);

			vi.doMock("next/navigation", () => ({
				useSearchParams: vi.fn(() => new URLSearchParams()),
				useRouter,
				usePathname: vi.fn(() => "/expenses"),
			}));

			const user = userEvent.setup();
			render(<ExpenseFilters {...defaultProps} />);

			const resetButton = screen.getByRole("button", { name: "リセット" });
			await user.click(resetButton);

			await waitFor(() => {
				expect(mockReplace).toHaveBeenCalledWith("/expenses");
			});
		});
	});

	describe("レスポンシブデザイン", () => {
		it("モバイル表示では縦並びレイアウトになる", () => {
			// window.matchMediaのモック
			window.matchMedia = vi.fn().mockImplementation((query) => ({
				matches: query === "(max-width: 768px)",
				media: query,
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
			}));

			render(<ExpenseFilters {...defaultProps} />);

			// 最初のflexコンテナを取得
			const filterContainer = screen.getByTestId("expense-filters");
			const flexContainers = filterContainer.querySelectorAll(".flex");
			expect(flexContainers[0]).toHaveClass("flex-col");
		});

		it("デスクトップ表示では横並びレイアウトになる", () => {
			window.matchMedia = vi.fn().mockImplementation((query) => ({
				matches: query === "(min-width: 769px)",
				media: query,
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
			}));

			render(<ExpenseFilters {...defaultProps} />);

			// 最初のflexコンテナを取得
			const filterContainer = screen.getByTestId("expense-filters");
			const flexContainers = filterContainer.querySelectorAll(".flex");
			expect(flexContainers[0]).toHaveClass("flex-row");
		});
	});

	describe("アクセシビリティ", () => {
		it("キーボードナビゲーションが可能", async () => {
			const user = userEvent.setup();
			render(<ExpenseFilters {...defaultProps} />);

			// Tabキーで各要素にフォーカス可能
			await user.tab();
			expect(screen.getByLabelText("期間")).toHaveFocus();

			// 種別にフォーカス
			await user.tab();
			expect(screen.getByLabelText("種別")).toHaveFocus();

			// カテゴリの最初のチェックボックスにフォーカス
			await user.tab();
			const firstCategoryCheckbox = screen.getAllByRole("checkbox")[0];
			expect(firstCategoryCheckbox).toHaveFocus();
		});

		it("適切なARIA属性が設定されている", () => {
			render(<ExpenseFilters {...defaultProps} />);

			const filterContainer = screen.getByTestId("expense-filters");
			expect(filterContainer).toHaveAttribute("role", "search");
			expect(filterContainer).toHaveAttribute(
				"aria-label",
				"支出・収入フィルター",
			);
		});
	});
});
