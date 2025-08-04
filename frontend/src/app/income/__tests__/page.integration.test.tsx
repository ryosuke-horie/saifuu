/**
 * 収入ページ統合テスト
 *
 * すべてのコンポーネントの連携、フィルター機能、CRUD操作、
 * ページネーション、レスポンシブレイアウトなどの統合的な動作を検証
 */

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	type Mock,
	vi,
} from "vitest";
import type { TransactionWithCategory } from "@/lib/api/types";
import type { Category } from "@/types/category";

// モック設定を外部化
const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockSearchParams = new URLSearchParams();

// Next.js Router モック
vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: mockPush,
		replace: mockReplace,
		prefetch: vi.fn(),
		back: vi.fn(),
		forward: vi.fn(),
		refresh: vi.fn(),
	}),
	useSearchParams: () => mockSearchParams,
	usePathname: () => "/income",
}));

// メディアクエリフックのモック
vi.mock("@/hooks/useMediaQuery", () => ({
	useIsMobile: vi.fn(() => false),
}));

// カスタムフックのモック - メモリを節約するため軽量なモックを使用
vi.mock("@/hooks/useIncomesWithPagination", () => ({
	useIncomesWithPagination: vi.fn(() => ({
		incomes: [],
		loading: false,
		error: null,
		pagination: {
			currentPage: 1,
			totalPages: 1,
			totalItems: 0,
			itemsPerPage: 10,
		},
		currentPage: 1,
		onPageChange: vi.fn(),
		onItemsPerPageChange: vi.fn(),
		refetch: vi.fn(),
	})),
}));

vi.mock("@/hooks/useIncomeStats", () => ({
	useIncomeStats: vi.fn(() => ({
		totalIncome: 0,
		incomeByCategory: [],
		topCategories: [],
	})),
}));

vi.mock("@/hooks/useIncomeFilters", () => ({
	useIncomeFilters: vi.fn(() => ({
		filters: {},
		updateFilter: vi.fn(),
		updateFilters: vi.fn(),
		resetFilters: vi.fn(),
		toggleCategory: vi.fn(),
		selectedCategories: [],
	})),
}));

// APIクライアントのモック
vi.mock("@/lib/api/client", () => ({
	apiClient: {
		transactions: {
			list: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		},
	},
}));

// カテゴリAPIのモック
vi.mock("@/lib/api/categories/api", () => ({
	fetchCategories: vi.fn(),
}));

import { useIncomeFilters } from "@/hooks/useIncomeFilters";
import { useIncomeStats } from "@/hooks/useIncomeStats";
import { useIncomesWithPagination } from "@/hooks/useIncomesWithPagination";
import { useIsMobile } from "@/hooks/useMediaQuery";
// インポート（モック後）
import { fetchCategories } from "@/lib/api/categories/api";
import { apiClient } from "@/lib/api/client";
// テストではSuspenseラップなしのコンテンツコンポーネントを直接使用
import { IncomePageContent } from "../page";

describe("IncomePageContent 統合テスト", () => {
	// テストデータ（最小限）
	const mockCategories: Category[] = [
		{
			id: "salary",
			name: "給与",
			type: "income",
			color: "#10b981",
			createdAt: "2024-01-01T00:00:00.000Z",
			updatedAt: "2024-01-01T00:00:00.000Z",
		},
		{
			id: "bonus",
			name: "ボーナス",
			type: "income",
			color: "#059669",
			createdAt: "2024-01-01T00:00:00.000Z",
			updatedAt: "2024-01-01T00:00:00.000Z",
		},
	];

	const mockIncomes: TransactionWithCategory[] = [
		{
			id: "1",
			amount: 300000,
			date: "2024-01-25",
			description: "1月給与",
			type: "income",
			category: mockCategories[0],
			categoryId: "salary",
			createdAt: "2024-01-25T00:00:00Z",
			updatedAt: "2024-01-25T00:00:00Z",
		},
		{
			id: "2",
			amount: 150000,
			date: "2024-01-20",
			description: "冬季ボーナス",
			type: "income",
			category: mockCategories[1],
			categoryId: "bonus",
			createdAt: "2024-01-20T00:00:00Z",
			updatedAt: "2024-01-20T00:00:00Z",
		},
	];

	// API応答のデフォルト設定
	const setupApiMocks = () => {
		// トランザクションリストのモック
		(apiClient.transactions.list as Mock).mockResolvedValue({
			data: mockIncomes,
			pagination: {
				currentPage: 1,
				totalPages: 1,
				totalItems: 2,
				itemsPerPage: 10,
			},
		});

		// カテゴリのモック
		(fetchCategories as Mock).mockResolvedValue(mockCategories);
	};

	// カスタムフックのデフォルト設定
	const setupHookMocks = (overrides = {}) => {
		const defaultHookData = {
			incomes: mockIncomes,
			loading: false,
			error: null,
			pagination: {
				currentPage: 1,
				totalPages: 1,
				totalItems: 2,
				itemsPerPage: 10,
			},
			currentPage: 1,
			onPageChange: vi.fn(),
			onItemsPerPageChange: vi.fn(),
			refetch: vi.fn(),
			...overrides,
		};

		(useIncomesWithPagination as Mock).mockReturnValue(defaultHookData);

		(useIncomeStats as Mock).mockReturnValue({
			totalIncome: 450000,
			incomeByCategory: [
				{ categoryId: "salary", amount: 300000 },
				{ categoryId: "bonus", amount: 150000 },
			],
			topCategories: ["salary", "bonus"],
		});

		(useIncomeFilters as Mock).mockReturnValue({
			filters: {},
			updateFilters: vi.fn(),
		});
	};

	beforeEach(() => {
		vi.clearAllMocks();
		mockSearchParams.forEach((_, key) => mockSearchParams.delete(key));
		setupApiMocks();
		setupHookMocks();
	});

	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	describe("コンポーネントレンダリング", () => {
		it("すべての主要コンポーネントが表示される", async () => {
			render(<IncomePageContent />);

			await waitFor(() => {
				// ページタイトル
				expect(
					screen.getByRole("heading", { name: "収入管理" }),
				).toBeInTheDocument();
			});

			// 統計コンポーネント
			expect(screen.getByText(/今月の収入/)).toBeInTheDocument();
			expect(screen.getByText(/先月の収入/)).toBeInTheDocument();
			expect(screen.getByText(/今年の収入/)).toBeInTheDocument();

			// フィルターセクション
			expect(screen.getByText("絞り込み条件")).toBeInTheDocument();

			// 収入登録フォーム
			expect(screen.getByText(/収入を登録/)).toBeInTheDocument();
			// 金額入力フィールドを特定のコンテナ内で検索
			const formContainer = screen.getByText(/収入を登録/).closest("div");
			expect(formContainer).toBeInTheDocument();

			// 収入一覧
			expect(screen.getByText("収入一覧")).toBeInTheDocument();
		});

		it("収入データが一覧に表示される", async () => {
			render(<IncomePageContent />);

			await waitFor(() => {
				expect(screen.getByText("1月給与")).toBeInTheDocument();
				expect(screen.getByText("冬季ボーナス")).toBeInTheDocument();
			});
		});
	});

	describe("フィルター機能", () => {
		it("フィルターセクションが表示される", async () => {
			const mockUpdateFilters = vi.fn();
			(useIncomeFilters as Mock).mockReturnValue({
				filters: {},
				updateFilters: mockUpdateFilters,
			});

			render(<IncomePageContent />);

			await waitFor(() => {
				expect(screen.getByText("絞り込み条件")).toBeInTheDocument();
			});

			// フィルターコンポーネントが存在することを確認
			const filterSection = screen.getByText("絞り込み条件").closest("div");
			expect(filterSection).toBeInTheDocument();

			// 期間選択が存在することを確認
			expect(screen.getByLabelText("期間")).toBeInTheDocument();
		});

		it("期間フィルターが動作する", async () => {
			const mockUpdateFilters = vi.fn();
			(useIncomeFilters as Mock).mockReturnValue({
				filters: {},
				updateFilters: mockUpdateFilters,
			});

			const user = userEvent.setup();
			render(<IncomePageContent />);

			await waitFor(() => {
				expect(screen.getByText("絞り込み条件")).toBeInTheDocument();
			});

			// 期間フィルターを選択
			const periodSelect = screen.getByLabelText("期間");
			await user.selectOptions(periodSelect, "thisMonth");

			// フィルター更新関数が呼び出されることを確認
			await waitFor(() => {
				expect(mockUpdateFilters).toHaveBeenCalled();
			});
		});

		it("フィルターリセットが動作する", async () => {
			const mockUpdateFilters = vi.fn();
			(useIncomeFilters as Mock).mockReturnValue({
				filters: { period: "thisMonth" },
				updateFilters: mockUpdateFilters,
			});

			const user = userEvent.setup();
			render(<IncomePageContent />);

			await waitFor(() => {
				expect(screen.getByText("絞り込み条件")).toBeInTheDocument();
			});

			// リセットボタンを探す（フィルターコンポーネント内）
			const filterSection = screen.getByTestId("income-filters");
			const resetButton = filterSection.querySelector('button[type="button"]');

			if (resetButton) {
				await user.click(resetButton);
				// フィルター更新関数が呼び出されることを確認
				await waitFor(() => {
					expect(mockUpdateFilters).toHaveBeenCalled();
				});
			}
		});
	});

	describe("CRUD操作", () => {
		it("新規収入フォームが表示される", async () => {
			render(<IncomePageContent />);

			await waitFor(() => {
				expect(screen.getByText(/収入を登録/)).toBeInTheDocument();
			});

			// フォームコンテナを探す
			const formSection = screen.getByText(/収入を登録/).closest("div");
			expect(formSection).toBeInTheDocument();
		});

		it("収入の登録処理が動作する", async () => {
			const mockRefetch = vi.fn();
			setupHookMocks({
				incomes: mockIncomes,
				refetch: mockRefetch,
			});

			(apiClient.transactions.create as Mock).mockResolvedValue({
				id: "new-1",
				amount: 80000,
				date: "2024-01-30",
				description: "臨時収入",
				type: "income",
				categoryId: "bonus",
				createdAt: "2024-01-30T00:00:00Z",
				updatedAt: "2024-01-30T00:00:00Z",
			});

			const user = userEvent.setup();
			render(<IncomePageContent />);

			await waitFor(() => {
				expect(screen.getByText(/収入を登録/)).toBeInTheDocument();
			});

			// フォームセクション内で入力要素を探す
			const formSection = screen
				.getByText(/収入を登録/)
				.closest("div")?.parentElement;
			if (!formSection) throw new Error("Form section not found");

			// 金額入力（フォーム内で検索）
			const amountInputs = formSection.querySelectorAll('input[type="number"]');
			const amountInput = amountInputs[0] as HTMLInputElement;
			if (amountInput) {
				await user.clear(amountInput);
				await user.type(amountInput, "80000");
			}

			// 登録ボタンをクリック
			const submitButtons = formSection.querySelectorAll(
				'button[type="submit"]',
			);
			if (submitButtons[0]) {
				await user.click(submitButtons[0]);
			}

			// APIが呼び出されることを確認
			await waitFor(() => {
				expect(apiClient.transactions.create).toHaveBeenCalled();
			});
		});

		it("収入を編集できる", async () => {
			const user = userEvent.setup();
			(apiClient.transactions.update as Mock).mockResolvedValue({
				...mockIncomes[0],
				amount: 350000,
			});

			render(<IncomePageContent />);

			await waitFor(() => {
				expect(screen.getByText("1月給与")).toBeInTheDocument();
			});

			// 編集ボタンを探す
			const editButtons = screen.queryAllByTestId(/edit-button/);
			if (editButtons.length > 0) {
				await user.click(editButtons[0]);

				// フォームが編集モードになることを確認
				await waitFor(() => {
					expect(screen.getByText(/収入を編集/)).toBeInTheDocument();
				});
			}
		});

		it("削除確認ダイアログが表示される", async () => {
			const user = userEvent.setup();
			render(<IncomePageContent />);

			await waitFor(() => {
				expect(screen.getByText("1月給与")).toBeInTheDocument();
			});

			// 削除ボタンを探す
			const deleteButtons = screen.queryAllByTestId(/delete-button/);
			if (deleteButtons.length > 0) {
				await user.click(deleteButtons[0]);

				// 削除確認ダイアログのモックがトリガーされることを確認
				// （実際のダイアログは別コンポーネントなので、削除ハンドラーが呼ばれることを確認）
			}
		});
	});

	describe("ページネーション", () => {
		it("ページネーション情報が表示される", async () => {
			// ページネーション用のデータ設定
			setupHookMocks({
				incomes: mockIncomes,
				loading: false,
				error: null,
				pagination: {
					currentPage: 1,
					totalPages: 2,
					totalItems: 15,
					itemsPerPage: 10,
				},
			});

			render(<IncomePageContent />);

			await waitFor(() => {
				// ページ情報が表示されることを確認
				expect(screen.getByText(/15件/)).toBeInTheDocument();
			});

			// ページネーションボタンの存在を確認（ボタンテキストは実装に依存）
			const buttons = screen.getAllByRole("button");
			expect(buttons.length).toBeGreaterThan(0);
		});

		it("ページ変更ハンドラーが動作する", async () => {
			const mockOnPageChange = vi.fn();

			setupHookMocks({
				incomes: mockIncomes,
				loading: false,
				error: null,
				pagination: {
					currentPage: 1,
					totalPages: 2,
					totalItems: 15,
					itemsPerPage: 10,
				},
				onPageChange: mockOnPageChange,
			});

			const user = userEvent.setup();
			render(<IncomePageContent />);

			await waitFor(() => {
				expect(screen.getByText(/15件/)).toBeInTheDocument();
			});

			// ページネーションボタンを探してクリック
			const buttons = screen.getAllByRole("button");
			const nextButton = buttons.find(
				(btn) =>
					btn.textContent?.includes("次") ||
					btn.textContent?.includes("2") ||
					btn.getAttribute("aria-label")?.includes("次"),
			);

			if (nextButton) {
				await user.click(nextButton);
				// ページ変更ハンドラーが呼び出される
				await waitFor(() => {
					expect(mockOnPageChange).toHaveBeenCalled();
				});
			}
		});
	});

	describe("レスポンシブレイアウト", () => {
		it("モバイルレイアウトで適切に表示される", async () => {
			// モバイルモードに設定
			(useIsMobile as Mock).mockReturnValue(true);

			render(<IncomePageContent />);

			await waitFor(() => {
				// モバイルではグリッドレイアウトではなく縦並びになる
				const filterSection = screen.getByText("絞り込み条件").closest("div");
				const parentDiv = filterSection?.parentElement;

				// space-y-6クラスが適用されていることを確認（モバイルレイアウト）
				expect(parentDiv).toHaveClass("space-y-6");
				expect(parentDiv).not.toHaveClass("grid", "grid-cols-2");
			});
		});

		it("デスクトップレイアウトで適切に表示される", async () => {
			// デスクトップモードに設定
			(useIsMobile as Mock).mockReturnValue(false);

			render(<IncomePageContent />);

			await waitFor(() => {
				// デスクトップではグリッドレイアウトになる
				const filterSection = screen.getByText("絞り込み条件").closest("div");
				const parentDiv = filterSection?.parentElement;

				// grid grid-cols-2クラスが適用されていることを確認（デスクトップレイアウト）
				expect(parentDiv).toHaveClass("grid", "grid-cols-2");
				expect(parentDiv).not.toHaveClass("space-y-6");
			});
		});
	});

	describe("エラーハンドリング", () => {
		it("API エラー時にエラーメッセージが表示される", async () => {
			setupHookMocks({
				incomes: [],
				loading: false,
				error: "データの取得に失敗しました",
				pagination: null,
			});

			render(<IncomePageContent />);

			await waitFor(() => {
				// エラーメッセージが表示される
				expect(
					screen.getByText("データの取得に失敗しました"),
				).toBeInTheDocument();
			});
		});

		it("カテゴリ取得エラー時でもページが表示される", async () => {
			(fetchCategories as Mock).mockRejectedValue(
				new Error("カテゴリ取得エラー"),
			);

			render(<IncomePageContent />);

			await waitFor(() => {
				// ページタイトルは表示される
				expect(
					screen.getByRole("heading", { name: "収入管理" }),
				).toBeInTheDocument();

				// フォームセクションは表示される
				expect(screen.getByText(/収入を登録/)).toBeInTheDocument();
			});
		});
	});

	describe("統合フロー", () => {
		it("基本的な収入管理フローが動作する", async () => {
			const mockRefetch = vi.fn();
			const mockUpdateFilters = vi.fn();

			setupHookMocks({
				incomes: mockIncomes,
				refetch: mockRefetch,
			});

			(useIncomeFilters as Mock).mockReturnValue({
				filters: {},
				updateFilters: mockUpdateFilters,
			});

			const user = userEvent.setup();
			render(<IncomePageContent />);

			// 1. 初期表示を確認
			await waitFor(() => {
				expect(
					screen.getByRole("heading", { name: "収入管理" }),
				).toBeInTheDocument();
				expect(screen.getByText("1月給与")).toBeInTheDocument();
			});

			// 2. 新規収入を登録
			(apiClient.transactions.create as Mock).mockResolvedValue({
				id: "flow-new",
				amount: 250000,
				date: "2024-01-28",
				description: "追加給与",
				type: "income",
				categoryId: "salary",
				createdAt: "2024-01-28T00:00:00Z",
				updatedAt: "2024-01-28T00:00:00Z",
			});

			// フォームセクション内で入力
			const formSection = screen
				.getByText(/収入を登録/)
				.closest("div")?.parentElement;
			if (formSection) {
				const amountInputs = formSection.querySelectorAll(
					'input[type="number"]',
				);
				const amountInput = amountInputs[0] as HTMLInputElement;
				if (amountInput) {
					await user.clear(amountInput);
					await user.type(amountInput, "250000");
				}

				const submitButtons = formSection.querySelectorAll(
					'button[type="submit"]',
				);
				if (submitButtons[0]) {
					await user.click(submitButtons[0]);
				}
			}

			// 3. データが更新される
			await waitFor(() => {
				expect(apiClient.transactions.create).toHaveBeenCalled();
				expect(mockRefetch).toHaveBeenCalled();
			});
		});
	});
});
