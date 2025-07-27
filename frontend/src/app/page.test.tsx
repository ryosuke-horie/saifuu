import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Page from "./page";

// フックのモック
vi.mock("../hooks/useExpenseStats", () => ({
	useExpenseStats: vi.fn(),
}));

vi.mock("../hooks/useExpenses", () => ({
	useExpenses: vi.fn(),
}));

vi.mock("../hooks/useIncomes", () => ({
	useIncomes: vi.fn(),
}));

vi.mock("../lib/api/hooks/useSubscriptions", () => ({
	useSubscriptionStats: vi.fn(),
}));

import { useExpenseStats } from "../hooks/useExpenseStats";
import { useExpenses } from "../hooks/useExpenses";
import { useIncomes } from "../hooks/useIncomes";
import { useSubscriptionStats } from "../lib/api/hooks/useSubscriptions";

const mockUseExpenseStats = useExpenseStats as unknown as ReturnType<
	typeof vi.fn
>;
const mockUseExpenses = useExpenses as unknown as ReturnType<typeof vi.fn>;
const mockUseIncomes = useIncomes as unknown as ReturnType<typeof vi.fn>;
const mockUseSubscriptionStats = useSubscriptionStats as unknown as ReturnType<
	typeof vi.fn
>;

describe("ダッシュボード（ホームページ）", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("タイトル表示", () => {
		it("ダッシュボードのタイトルが表示される", () => {
			// モックの初期状態設定
			mockUseExpenses.mockReturnValue({
				expenses: [],
				loading: true,
				error: null,
				operationLoading: false,
				refetch: vi.fn(),
				createExpenseMutation: vi.fn(),
				updateExpenseMutation: vi.fn(),
				deleteExpenseMutation: vi.fn(),
				getExpenseById: vi.fn(),
			});
			mockUseIncomes.mockReturnValue({
				incomes: [],
				loading: true,
				error: null,
				operationLoading: false,
				refetch: vi.fn(),
				createIncomeMutation: vi.fn(),
				updateIncomeMutation: vi.fn(),
				deleteIncomeMutation: vi.fn(),
				getIncomeById: vi.fn(),
			});
			mockUseExpenseStats.mockReturnValue({
				totalExpense: 0,
				transactionCount: 0,
			});
			mockUseSubscriptionStats.mockReturnValue({
				stats: null,
				isLoading: true,
				error: null,
			});

			render(<Page />);

			expect(
				screen.getByRole("heading", { name: "ダッシュボード" }),
			).toBeInTheDocument();
		});
	});

	describe("支出サマリー表示", () => {
		it("支出の合計金額が表示される", async () => {
			// 支出データのモック
			const mockExpenses = [
				{
					id: "1",
					amount: 1000,
					type: "expense" as const,
					date: "2024-01-01",
					description: null,
					category: null,
					createdAt: "2024-01-01",
					updatedAt: "2024-01-01",
				},
				{
					id: "2",
					amount: 2000,
					type: "expense" as const,
					date: "2024-01-02",
					description: null,
					category: null,
					createdAt: "2024-01-02",
					updatedAt: "2024-01-02",
				},
			];

			mockUseExpenses.mockReturnValue({
				expenses: mockExpenses,
				loading: false,
				error: null,
				operationLoading: false,
				refetch: vi.fn(),
				createExpenseMutation: vi.fn(),
				updateExpenseMutation: vi.fn(),
				deleteExpenseMutation: vi.fn(),
				getExpenseById: vi.fn(),
			});
			mockUseIncomes.mockReturnValue({
				incomes: [],
				loading: false,
				error: null,
				operationLoading: false,
				refetch: vi.fn(),
				createIncomeMutation: vi.fn(),
				updateIncomeMutation: vi.fn(),
				deleteIncomeMutation: vi.fn(),
				getIncomeById: vi.fn(),
			});
			mockUseExpenseStats.mockReturnValue({
				totalExpense: 3000,
				transactionCount: 2,
			});
			mockUseSubscriptionStats.mockReturnValue({
				stats: null,
				isLoading: true,
				error: null,
			});

			render(<Page />);

			await waitFor(() => {
				expect(screen.getByText("今月の支出")).toBeInTheDocument();
				expect(screen.getByText("¥3,000")).toBeInTheDocument();
			});
		});

		it("支出件数が表示される", async () => {
			const mockExpenses = [
				{
					id: "1",
					amount: 1000,
					type: "expense" as const,
					date: "2024-01-01",
					description: null,
					category: null,
					createdAt: "2024-01-01",
					updatedAt: "2024-01-01",
				},
				{
					id: "2",
					amount: 2000,
					type: "expense" as const,
					date: "2024-01-02",
					description: null,
					category: null,
					createdAt: "2024-01-02",
					updatedAt: "2024-01-02",
				},
			];

			mockUseExpenses.mockReturnValue({
				expenses: mockExpenses,
				loading: false,
				error: null,
				operationLoading: false,
				refetch: vi.fn(),
				createExpenseMutation: vi.fn(),
				updateExpenseMutation: vi.fn(),
				deleteExpenseMutation: vi.fn(),
				getExpenseById: vi.fn(),
			});
			mockUseIncomes.mockReturnValue({
				incomes: [],
				loading: false,
				error: null,
				operationLoading: false,
				refetch: vi.fn(),
				createIncomeMutation: vi.fn(),
				updateIncomeMutation: vi.fn(),
				deleteIncomeMutation: vi.fn(),
				getIncomeById: vi.fn(),
			});
			mockUseExpenseStats.mockReturnValue({
				totalExpense: 3000,
				transactionCount: 2,
			});
			mockUseSubscriptionStats.mockReturnValue({
				stats: null,
				isLoading: true,
				error: null,
			});

			render(<Page />);

			await waitFor(() => {
				expect(screen.getByText("2件")).toBeInTheDocument();
			});
		});

		it("ローディング中はスピナーが表示される", () => {
			mockUseExpenses.mockReturnValue({
				expenses: [],
				loading: true,
				error: null,
				operationLoading: false,
				refetch: vi.fn(),
				createExpenseMutation: vi.fn(),
				updateExpenseMutation: vi.fn(),
				deleteExpenseMutation: vi.fn(),
				getExpenseById: vi.fn(),
			});
			mockUseIncomes.mockReturnValue({
				incomes: [],
				loading: true,
				error: null,
				operationLoading: false,
				refetch: vi.fn(),
				createIncomeMutation: vi.fn(),
				updateIncomeMutation: vi.fn(),
				deleteIncomeMutation: vi.fn(),
				getIncomeById: vi.fn(),
			});
			mockUseExpenseStats.mockReturnValue({
				totalExpense: 0,
				transactionCount: 0,
			});
			mockUseSubscriptionStats.mockReturnValue({
				stats: null,
				isLoading: true,
				error: null,
			});

			render(<Page />);

			expect(screen.getAllByTestId("loading-spinner")).toHaveLength(2);
		});
	});

	describe("収入サマリー表示", () => {
		it("収入の合計金額が表示される", async () => {
			// 収入データのモック
			const mockIncomes = [
				{
					id: "1",
					amount: 50000,
					type: "income" as const,
					date: "2024-01-01",
					description: null,
					category: null,
					createdAt: "2024-01-01",
					updatedAt: "2024-01-01",
				},
				{
					id: "2",
					amount: 30000,
					type: "income" as const,
					date: "2024-01-15",
					description: null,
					category: null,
					createdAt: "2024-01-15",
					updatedAt: "2024-01-15",
				},
			];

			mockUseExpenses.mockReturnValue({
				expenses: [],
				loading: false,
				error: null,
				operationLoading: false,
				refetch: vi.fn(),
				createExpenseMutation: vi.fn(),
				updateExpenseMutation: vi.fn(),
				deleteExpenseMutation: vi.fn(),
				getExpenseById: vi.fn(),
			});
			mockUseIncomes.mockReturnValue({
				incomes: mockIncomes,
				loading: false,
				error: null,
				operationLoading: false,
				refetch: vi.fn(),
				createIncomeMutation: vi.fn(),
				updateIncomeMutation: vi.fn(),
				deleteIncomeMutation: vi.fn(),
				getIncomeById: vi.fn(),
			});
			mockUseExpenseStats.mockReturnValue({
				totalExpense: 0,
				transactionCount: 0,
			});
			mockUseSubscriptionStats.mockReturnValue({
				stats: null,
				isLoading: true,
				error: null,
			});

			render(<Page />);

			await waitFor(() => {
				expect(screen.getByText("今月の収入")).toBeInTheDocument();
				expect(screen.getByText("¥80,000")).toBeInTheDocument();
			});
		});
	});

	describe("サブスクリプションサマリー表示", () => {
		it("アクティブなサブスクリプション数が表示される", async () => {
			mockUseExpenses.mockReturnValue({
				expenses: [],
				loading: false,
				error: null,
				operationLoading: false,
				refetch: vi.fn(),
				createExpenseMutation: vi.fn(),
				updateExpenseMutation: vi.fn(),
				deleteExpenseMutation: vi.fn(),
				getExpenseById: vi.fn(),
			});
			mockUseIncomes.mockReturnValue({
				incomes: [],
				loading: false,
				error: null,
				operationLoading: false,
				refetch: vi.fn(),
				createIncomeMutation: vi.fn(),
				updateIncomeMutation: vi.fn(),
				deleteIncomeMutation: vi.fn(),
				getIncomeById: vi.fn(),
			});
			mockUseExpenseStats.mockReturnValue({
				totalExpense: 0,
				transactionCount: 0,
			});
			mockUseSubscriptionStats.mockReturnValue({
				stats: {
					stats: {
						totalActive: 5,
						totalInactive: 2,
						monthlyTotal: 15000,
						yearlyTotal: 180000,
						avgMonthlyAmount: 3000,
						categoryBreakdown: [],
					},
					upcomingBillings: [],
				},
				isLoading: false,
				error: null,
			});

			render(<Page />);

			await waitFor(() => {
				expect(screen.getByText("アクティブなサブスク")).toBeInTheDocument();
				expect(screen.getByText("5件")).toBeInTheDocument();
			});
		});

		it("月額合計が表示される", async () => {
			mockUseExpenses.mockReturnValue({
				expenses: [],
				loading: false,
				error: null,
				operationLoading: false,
				refetch: vi.fn(),
				createExpenseMutation: vi.fn(),
				updateExpenseMutation: vi.fn(),
				deleteExpenseMutation: vi.fn(),
				getExpenseById: vi.fn(),
			});
			mockUseIncomes.mockReturnValue({
				incomes: [],
				loading: false,
				error: null,
				operationLoading: false,
				refetch: vi.fn(),
				createIncomeMutation: vi.fn(),
				updateIncomeMutation: vi.fn(),
				deleteIncomeMutation: vi.fn(),
				getIncomeById: vi.fn(),
			});
			mockUseExpenseStats.mockReturnValue({
				totalExpense: 0,
				transactionCount: 0,
			});
			mockUseSubscriptionStats.mockReturnValue({
				stats: {
					stats: {
						totalActive: 5,
						totalInactive: 2,
						monthlyTotal: 15000,
						yearlyTotal: 180000,
						avgMonthlyAmount: 3000,
						categoryBreakdown: [],
					},
					upcomingBillings: [],
				},
				isLoading: false,
				error: null,
			});

			render(<Page />);

			await waitFor(() => {
				expect(screen.getByText("月額合計")).toBeInTheDocument();
				expect(screen.getByText("¥15,000")).toBeInTheDocument();
			});
		});
	});

	describe("ナビゲーションリンク", () => {
		const setupMocksForNavigation = () => {
			mockUseExpenses.mockReturnValue({
				expenses: [],
				loading: true,
				error: null,
				operationLoading: false,
				refetch: vi.fn(),
				createExpenseMutation: vi.fn(),
				updateExpenseMutation: vi.fn(),
				deleteExpenseMutation: vi.fn(),
				getExpenseById: vi.fn(),
			});
			mockUseIncomes.mockReturnValue({
				incomes: [],
				loading: true,
				error: null,
				operationLoading: false,
				refetch: vi.fn(),
				createIncomeMutation: vi.fn(),
				updateIncomeMutation: vi.fn(),
				deleteIncomeMutation: vi.fn(),
				getIncomeById: vi.fn(),
			});
			mockUseExpenseStats.mockReturnValue({
				totalExpense: 0,
				transactionCount: 0,
			});
			mockUseSubscriptionStats.mockReturnValue({
				stats: null,
				isLoading: true,
				error: null,
			});
		};

		it("支出管理ページへのリンクが表示される", () => {
			setupMocksForNavigation();
			render(<Page />);

			const expenseLink = screen.getByRole("link", { name: /支出管理/ });
			expect(expenseLink).toBeInTheDocument();
			expect(expenseLink).toHaveAttribute("href", "/expenses");
		});

		it("収入管理ページへのリンクが表示される", () => {
			setupMocksForNavigation();
			render(<Page />);

			const incomeLink = screen.getByRole("link", { name: /収入管理/ });
			expect(incomeLink).toBeInTheDocument();
			expect(incomeLink).toHaveAttribute("href", "/income");
		});

		it("サブスクリプション管理ページへのリンクが表示される", () => {
			setupMocksForNavigation();
			render(<Page />);

			const subscriptionLink = screen.getByRole("link", {
				name: /サブスクリプション管理/,
			});
			expect(subscriptionLink).toBeInTheDocument();
			expect(subscriptionLink).toHaveAttribute("href", "/subscriptions");
		});
	});

	describe("エラーハンドリング", () => {
		it("支出データ取得エラー時にエラーメッセージが表示される", () => {
			mockUseExpenses.mockReturnValue({
				expenses: [],
				loading: false,
				error: "支出データの取得に失敗しました",
				operationLoading: false,
				refetch: vi.fn(),
				createExpenseMutation: vi.fn(),
				updateExpenseMutation: vi.fn(),
				deleteExpenseMutation: vi.fn(),
				getExpenseById: vi.fn(),
			});
			mockUseIncomes.mockReturnValue({
				incomes: [],
				loading: false,
				error: null,
				operationLoading: false,
				refetch: vi.fn(),
				createIncomeMutation: vi.fn(),
				updateIncomeMutation: vi.fn(),
				deleteIncomeMutation: vi.fn(),
				getIncomeById: vi.fn(),
			});
			mockUseExpenseStats.mockReturnValue({
				totalExpense: 0,
				transactionCount: 0,
			});
			mockUseSubscriptionStats.mockReturnValue({
				stats: null,
				isLoading: false,
				error: null,
			});

			render(<Page />);

			expect(
				screen.getByText(/支出データの取得に失敗しました/),
			).toBeInTheDocument();
		});

		it("サブスクリプションデータ取得エラー時にエラーメッセージが表示される", () => {
			mockUseExpenses.mockReturnValue({
				expenses: [],
				loading: false,
				error: null,
				operationLoading: false,
				refetch: vi.fn(),
				createExpenseMutation: vi.fn(),
				updateExpenseMutation: vi.fn(),
				deleteExpenseMutation: vi.fn(),
				getExpenseById: vi.fn(),
			});
			mockUseIncomes.mockReturnValue({
				incomes: [],
				loading: false,
				error: null,
				operationLoading: false,
				refetch: vi.fn(),
				createIncomeMutation: vi.fn(),
				updateIncomeMutation: vi.fn(),
				deleteIncomeMutation: vi.fn(),
				getIncomeById: vi.fn(),
			});
			mockUseExpenseStats.mockReturnValue({
				totalExpense: 0,
				transactionCount: 0,
			});
			mockUseSubscriptionStats.mockReturnValue({
				stats: null,
				isLoading: false,
				error: "サブスクリプションデータの取得に失敗しました",
			});

			render(<Page />);

			expect(
				screen.getByText(/サブスクリプションデータの取得に失敗しました/),
			).toBeInTheDocument();
		});
	});
});
