import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useIncomes } from "@/hooks/useIncomes";
import { fetchCategories } from "@/lib/api/categories/api";
import type { TransactionWithCategory } from "@/lib/api/types";
import IncomePage from "../page";

// Next.js App Router のモック
vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: vi.fn(),
		replace: vi.fn(),
		refresh: vi.fn(),
		back: vi.fn(),
		forward: vi.fn(),
		prefetch: vi.fn(),
	}),
	useSearchParams: () => new URLSearchParams(),
	usePathname: () => "/income",
}))

// APIモック
vi.mock("@/lib/api/categories/api", () => ({
	fetchCategories: vi.fn(),
}));

// useIncomesフックのモック
vi.mock("@/hooks/useIncomes", () => ({
	useIncomes: vi.fn(),
}));

// useIncomesWithPaginationフックのモック
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

// useIncomeStatsフックのモック
vi.mock("@/hooks/useIncomeStatsApi", () => ({
	useIncomeStats: vi.fn(() => ({
		stats: null,
		loading: false,
		error: null,
		refetch: vi.fn(),
		refetchStats: vi.fn(),
	})),
}));

// APIクライアントのモック
vi.mock("@/lib/api/client", () => ({
	apiClient: {
		transactions: {
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		},
	},
}))

// useIncomesWithPaginationフックのインポート
import { useIncomesWithPagination } from "@/hooks/useIncomesWithPagination";
import { useIncomeStats } from "@/hooks/useIncomeStatsApi";
import { apiClient } from "@/lib/api/client";

describe("IncomePage", () => {
	// モックデータ
	const mockIncomes: TransactionWithCategory[] = [
		{
			id: "1",
			amount: 300000,
			date: "2024-01-25",
			description: "1月給与",
			type: "income" as const,
			category: {
				id: "101", // 給与カテゴリのnumericId
				name: "給与",
				type: "income" as const,
				color: "#10b981",
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			},
			categoryId: "salary",
			createdAt: "2024-01-25T00:00:00Z",
			updatedAt: "2024-01-25T00:00:00Z",
		},
		{
			id: "2",
			amount: 100000,
			date: "2024-01-15",
			description: "冬季ボーナス",
			type: "income" as const,
			category: {
				id: "102", // ボーナスカテゴリのnumericId
				name: "ボーナス",
				type: "income" as const,
				color: "#059669",
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			},
			categoryId: "bonus",
			createdAt: "2024-01-15T00:00:00Z",
			updatedAt: "2024-01-15T00:00:00Z",
		},
	];

	const mockCategories = [
		{
			id: "salary",
			name: "給与",
			type: "income" as const,
			color: "#10b981",
			createdAt: "2024-01-01T00:00:00.000Z",
			updatedAt: "2024-01-01T00:00:00.000Z",
		},
		{
			id: "bonus",
			name: "ボーナス",
			type: "income" as const,
			color: "#059669",
			createdAt: "2024-01-01T00:00:00.000Z",
			updatedAt: "2024-01-01T00:00:00.000Z",
		},
		{
			id: "side_business",
			name: "副業",
			type: "income" as const,
			color: "#34d399",
			createdAt: "2024-01-01T00:00:00.000Z",
			updatedAt: "2024-01-01T00:00:00.000Z",
		},
	];

	// デフォルトのモック実装
	const defaultUseIncomesMock = {
		incomes: [],
		loading: false,
		error: null,
		operationLoading: false,
		createIncomeMutation: vi.fn(),
		updateIncomeMutation: vi.fn(),
		deleteIncomeMutation: vi.fn(),
		refetch: vi.fn(),
		getIncomeById: vi.fn(),
	};

	beforeEach(() => {
		vi.clearAllMocks();
		// カテゴリのモックデータ
		vi.mocked(fetchCategories).mockResolvedValue(mockCategories);
		// デフォルトのuseIncomesモック
		vi.mocked(useIncomes).mockReturnValue(defaultUseIncomesMock);
		// デフォルトのuseIncomesWithPaginationモック
		vi.mocked(useIncomesWithPagination).mockReturnValue({
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
		});
		// デフォルトのuseIncomeStatsモック
		vi.mocked(useIncomeStats).mockReturnValue({
			stats: null,
			loading: false,
			error: null,
			refetch: vi.fn(),
			refetchStats: vi.fn(),
		});
	});

	it("収入管理ページのタイトルが表示される", async () => {
		render(<IncomePage />);

		await waitFor(() => {
			expect(
				screen.getByRole("heading", { name: /収入管理/i }),
			).toBeInTheDocument();
		});
	});

	it("収入登録フォームが表示される", async () => {
		render(<IncomePage />);

		await waitFor(() => {
			// フォーム内のフィールドをテストIDで取得
			const amountInput = document.getElementById("income-amount");
			expect(amountInput).toBeInTheDocument();
			expect(screen.getByLabelText(/日付/i)).toBeInTheDocument();
			expect(screen.getByLabelText(/カテゴリ/i)).toBeInTheDocument();
			expect(screen.getByLabelText(/説明/i)).toBeInTheDocument();
			expect(screen.getByRole("button", { name: /登録/i })).toBeInTheDocument();
		});
	});

	it("収入一覧テーブルが表示される", async () => {
		vi.mocked(useIncomesWithPagination).mockReturnValue({
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
		});

		render(<IncomePage />);

		await waitFor(() => {
			expect(screen.getByText("1月給与")).toBeInTheDocument();
			expect(screen.getByText("冬季ボーナス")).toBeInTheDocument();
			expect(screen.getByText("￥300,000")).toBeInTheDocument();
			expect(screen.getByText("￥100,000")).toBeInTheDocument();
		});
	});

	it("収入を登録できる", async () => {
		const user = userEvent.setup();
		const mockCreate = vi.fn().mockResolvedValue({
			id: "3",
			amount: 50000,
			date: "2024-01-20",
			description: "副業収入",
			type: "income" as const,
			category: {
				id: "side_business",
				name: "副業",
				type: "income" as const,
				color: "#34d399",
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			},
			createdAt: "2024-01-20T00:00:00Z",
			updatedAt: "2024-01-20T00:00:00Z",
		});

		vi.mocked(apiClient.transactions.create).mockImplementation(mockCreate);

		const { container } = render(<IncomePage />);

		// フォームに入力（IDで取得）
		const amountInput = container.querySelector('#income-amount') as HTMLInputElement;
		expect(amountInput).toBeTruthy();
		await user.clear(amountInput);
		await user.type(amountInput, "50000");
		await user.type(screen.getByLabelText(/説明/i), "副業収入");

		// カテゴリを選択（フォームがロードされるまで待つ）
		await waitFor(() => {
			const categorySelect = screen.getByLabelText(/カテゴリ/i);
			expect(categorySelect).not.toBeDisabled();
		});
		await user.selectOptions(
			screen.getByLabelText(/カテゴリ/i),
			"side_business",
		);

		// 登録ボタンをクリック
		await user.click(screen.getByRole("button", { name: /登録/i }));

		await waitFor(() => {
			expect(mockCreate).toHaveBeenCalledWith({
				type: "income",
				amount: 50000,
				date: new Date().toISOString().split("T")[0], // 今日の日付をYYYY-MM-DD形式で
				categoryId: "side_business", // 副業のカテゴリID（文字列型）
				description: "副業収入",
			});
		});
	});

	it("収入を編集できる", async () => {
		const user = userEvent.setup();
		const mockUpdate = vi.fn().mockResolvedValue({
			...mockIncomes[0],
			amount: 350000,
		});

		vi.mocked(apiClient.transactions.update).mockImplementation(mockUpdate);
		vi.mocked(useIncomesWithPagination).mockReturnValue({
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
		});

		const { container } = render(<IncomePage />);

		await waitFor(() => {
			expect(screen.getByText("1月給与")).toBeInTheDocument();
		});

		// 最初の行の編集ボタンをクリック
		const editButtons = screen.getAllByRole("button", { name: /編集/i });
		await user.click(editButtons[0]);

		// 金額を変更（IDで取得）
		await waitFor(() => {
			const amountInput = container.querySelector('#income-amount') as HTMLInputElement;
			expect(amountInput).toBeTruthy();
		});
		const amountInput = container.querySelector('#income-amount') as HTMLInputElement;
		await user.clear(amountInput);
		await user.type(amountInput, "350000");

		// 更新ボタンをクリック
		await user.click(screen.getByRole("button", { name: /更新/i }));

		await waitFor(() => {
			expect(mockUpdate).toHaveBeenCalledWith("1", {
				amount: 350000,
				date: "2024-01-25",
				categoryId: "salary", // 給与カテゴリのID
				description: "1月給与",
			});
		});
	});

	it("収入を削除できる", async () => {
		const user = userEvent.setup();
		const mockDelete = vi.fn().mockResolvedValue(undefined);

		vi.mocked(apiClient.transactions.delete).mockImplementation(mockDelete);
		vi.mocked(useIncomesWithPagination).mockReturnValue({
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
		});

		render(<IncomePage />);

		await waitFor(() => {
			expect(screen.getByText("1月給与")).toBeInTheDocument();
		});

		// 最初の行の削除ボタンをクリック
		const deleteButtons = screen.getAllByRole("button", { name: /削除/i });
		await user.click(deleteButtons[0]);

		// 確認ダイアログで削除を確定
		await user.click(screen.getByRole("button", { name: /削除を確定/i }));

		await waitFor(() => {
			expect(mockDelete).toHaveBeenCalledWith("1");
		});
	});

	it("エラー時に適切なエラーメッセージが表示される", async () => {
		vi.mocked(useIncomesWithPagination).mockReturnValue({
			incomes: [],
			loading: false,
			error: "データの取得に失敗しました",
			pagination: null,
			currentPage: 1,
			onPageChange: vi.fn(),
			onItemsPerPageChange: vi.fn(),
			refetch: vi.fn(),
		});

		render(<IncomePage />);

		await waitFor(() => {
			// エラーメッセージはテーブル外に表示される
			expect(
				screen.getByText("データの取得に失敗しました"),
			).toBeInTheDocument();
		});
	});

	it("ローディング中はローディング表示がされる", async () => {
		vi.mocked(useIncomesWithPagination).mockReturnValue({
			incomes: [],
			loading: true,
			error: null,
			pagination: null,
			currentPage: 1,
			onPageChange: vi.fn(),
			onItemsPerPageChange: vi.fn(),
			refetch: vi.fn(),
		});

		render(<IncomePage />);

		// ページレベルのローディング表示を確認
		expect(screen.getByText("読み込み中...")).toBeInTheDocument();
	});
});
