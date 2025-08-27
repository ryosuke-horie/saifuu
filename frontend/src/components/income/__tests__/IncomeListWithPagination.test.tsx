/**
 * IncomeList ページネーション統合テスト
 *
 * 収入一覧でのページネーション機能の統合動作を検証
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Transaction } from "@/lib/api/types";
import { IncomeList } from "../IncomeList";

// APIモックデータ生成
const generateMockTransactions = (count: number): Transaction[] => {
	return Array.from({ length: count }, (_, i) => ({
		id: `income-${i + 1}`,
		amount: 50000 + i * 1000,
		type: "income" as const,
		description: `収入 ${i + 1}`,
		date: new Date(2024, 0, i + 1).toISOString().split("T")[0],
		categoryId: "101",
		categoryName: "給与",
		createdAt: new Date(2024, 0, i + 1).toISOString(),
		updatedAt: new Date(2024, 0, i + 1).toISOString(),
		userId: "user-1",
	}));
};

// APIモック
vi.mock("@/lib/api/client", () => ({
	apiClient: {
		transactions: {
			list: vi.fn(),
		},
	},
}));

describe("IncomeList with Pagination", () => {
	let queryClient: QueryClient;

	beforeEach(() => {
		queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
			},
		});
		vi.clearAllMocks();
	});

	const renderWithQueryClient = (component: React.ReactElement) => {
		return render(
			<QueryClientProvider client={queryClient}>
				{component}
			</QueryClientProvider>,
		);
	};

	describe("ページネーション統合", () => {
		it("ページネーション付きで収入一覧が表示される", async () => {
			const mockTransactions = generateMockTransactions(98);
			const apiClient = await import("@/lib/api/client");

			// 最初のページのデータを返す
			vi.mocked(apiClient.apiClient.transactions.list).mockResolvedValueOnce({
				data: mockTransactions.slice(0, 20),
				pagination: {
					currentPage: 1,
					totalPages: 5,
					totalItems: 98,
					itemsPerPage: 20,
				},
			});

			renderWithQueryClient(
				<IncomeList enablePagination={true} itemsPerPage={20} />,
			);

			// データの読み込みを待つ
			await waitFor(() => {
				expect(screen.getByText("収入 1")).toBeInTheDocument();
			});

			// ページネーションコンポーネントの表示確認
			expect(screen.getByText("1 / 5")).toBeInTheDocument();
			expect(screen.getByText("全98件")).toBeInTheDocument();
			expect(screen.getByLabelText("次のページ")).toBeInTheDocument();
		});

		it("次のページボタンをクリックすると2ページ目のデータが表示される", async () => {
			const mockTransactions = generateMockTransactions(98);
			const apiClient = await import("@/lib/api/client");

			// 1ページ目のデータ
			vi.mocked(apiClient.apiClient.transactions.list).mockResolvedValueOnce({
				data: mockTransactions.slice(0, 20),
				pagination: {
					currentPage: 1,
					totalPages: 5,
					totalItems: 98,
					itemsPerPage: 20,
				},
			});

			renderWithQueryClient(
				<IncomeList enablePagination={true} itemsPerPage={20} />,
			);

			await waitFor(() => {
				expect(screen.getByText("収入 1")).toBeInTheDocument();
			});

			// 2ページ目のデータをモック
			vi.mocked(apiClient.apiClient.transactions.list).mockResolvedValueOnce({
				data: mockTransactions.slice(20, 40),
				pagination: {
					currentPage: 2,
					totalPages: 5,
					totalItems: 98,
					itemsPerPage: 20,
				},
			});

			// 次のページボタンをクリック
			const nextButton = screen.getByLabelText("次のページ");
			fireEvent.click(nextButton);

			// 2ページ目のデータが表示されることを確認
			await waitFor(() => {
				expect(screen.getByText("収入 21")).toBeInTheDocument();
				expect(screen.queryByText("収入 1")).not.toBeInTheDocument();
			});

			// ページ情報の更新確認
			expect(screen.getByText("2 / 5")).toBeInTheDocument();
		});

		it("表示件数を変更すると適切にデータが再取得される", async () => {
			const mockTransactions = generateMockTransactions(98);
			const apiClient = await import("@/lib/api/client");

			// 初期表示（20件）
			vi.mocked(apiClient.apiClient.transactions.list).mockResolvedValueOnce({
				data: mockTransactions.slice(0, 20),
				pagination: {
					currentPage: 1,
					totalPages: 5,
					totalItems: 98,
					itemsPerPage: 20,
				},
			});

			renderWithQueryClient(
				<IncomeList enablePagination={true} itemsPerPage={20} />,
			);

			await waitFor(() => {
				expect(screen.getByText("収入 1")).toBeInTheDocument();
			});

			// 50件表示に変更
			vi.mocked(apiClient.apiClient.transactions.list).mockResolvedValueOnce({
				data: mockTransactions.slice(0, 50),
				pagination: {
					currentPage: 1,
					totalPages: 2,
					totalItems: 98,
					itemsPerPage: 50,
				},
			});

			const select = screen.getByLabelText("表示件数");
			fireEvent.change(select, { target: { value: "50" } });

			// 50件のデータが表示されることを確認
			await waitFor(() => {
				expect(screen.getByText("収入 50")).toBeInTheDocument();
				expect(screen.getByText("1 / 2")).toBeInTheDocument();
			});
		});

		it("URLパラメータと同期される", async () => {
			const mockTransactions = generateMockTransactions(98);
			const apiClient = await import("@/lib/api/client");

			// URLパラメータを設定
			const searchParams = new URLSearchParams({
				page: "2",
				limit: "20",
			});
			window.history.pushState({}, "", `?${searchParams.toString()}`);

			// 2ページ目のデータを返す
			vi.mocked(apiClient.apiClient.transactions.list).mockResolvedValueOnce({
				data: mockTransactions.slice(20, 40),
				pagination: {
					currentPage: 2,
					totalPages: 5,
					totalItems: 98,
					itemsPerPage: 20,
				},
			});

			renderWithQueryClient(
				<IncomeList
					enablePagination={true}
					itemsPerPage={20}
					syncWithUrl={true}
				/>,
			);

			// URLパラメータに基づいて2ページ目が表示される
			await waitFor(() => {
				expect(screen.getByText("収入 21")).toBeInTheDocument();
				expect(screen.getByText("2 / 5")).toBeInTheDocument();
			});
		});

		it("ソート機能と併用できる", async () => {
			const mockTransactions = generateMockTransactions(98);
			const apiClient = await import("@/lib/api/client");

			// 金額でソートされたデータ
			const sortedTransactions = [...mockTransactions].sort(
				(a, b) => b.amount - a.amount,
			);

			vi.mocked(apiClient.apiClient.transactions.list).mockResolvedValueOnce({
				data: sortedTransactions.slice(0, 20),
				pagination: {
					currentPage: 1,
					totalPages: 5,
					totalItems: 98,
					itemsPerPage: 20,
				},
			});

			renderWithQueryClient(
				<IncomeList
					enablePagination={true}
					itemsPerPage={20}
					sortBy="amount"
					sortOrder="desc"
				/>,
			);

			await waitFor(() => {
				// 金額が高い順に表示される
				expect(screen.getByText("収入 98")).toBeInTheDocument();
			});

			// APIが適切なパラメータで呼ばれていることを確認
			expect(apiClient.apiClient.transactions.list).toHaveBeenCalledWith(
				expect.objectContaining({
					type: "income",
					page: 1,
					limit: 20,
					sort: "amount",
					order: "desc",
				}),
			);
		});
	});

	describe("パフォーマンス", () => {
		it("2秒以内にページ切り替えが完了する", async () => {
			const mockTransactions = generateMockTransactions(98);
			const apiClient = await import("@/lib/api/client");

			// 初期表示
			vi.mocked(apiClient.apiClient.transactions.list).mockResolvedValueOnce({
				data: mockTransactions.slice(0, 20),
				pagination: {
					currentPage: 1,
					totalPages: 5,
					totalItems: 98,
					itemsPerPage: 20,
				},
			});

			renderWithQueryClient(
				<IncomeList enablePagination={true} itemsPerPage={20} />,
			);

			await waitFor(() => {
				expect(screen.getByText("収入 1")).toBeInTheDocument();
			});

			// 2ページ目のデータ（遅延付き）
			vi.mocked(apiClient.apiClient.transactions.list).mockImplementationOnce(
				() =>
					new Promise((resolve) => {
						setTimeout(() => {
							resolve({
								data: mockTransactions.slice(20, 40),
								pagination: {
									currentPage: 2,
									totalPages: 5,
									totalItems: 98,
									itemsPerPage: 20,
								},
							});
						}, 500); // 0.5秒の遅延
					}),
			);

			const startTime = Date.now();

			// 次のページボタンをクリック
			const nextButton = screen.getByLabelText("次のページ");
			fireEvent.click(nextButton);

			// ローディング状態の表示
			expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();

			// 2ページ目のデータが表示されることを確認
			await waitFor(() => {
				expect(screen.getByText("収入 21")).toBeInTheDocument();
			});

			const endTime = Date.now();
			const duration = endTime - startTime;

			// 2秒以内に完了
			expect(duration).toBeLessThan(2000);
		});
	});

	describe("エラーハンドリング", () => {
		it("ページ取得エラー時に適切なメッセージが表示される", async () => {
			const apiClient = await import("@/lib/api/client");

			// エラーを返す
			vi.mocked(apiClient.apiClient.transactions.list).mockRejectedValueOnce(
				new Error("ページの取得に失敗しました"),
			);

			renderWithQueryClient(
				<IncomeList enablePagination={true} itemsPerPage={20} />,
			);

			// エラーメッセージの表示
			await waitFor(() => {
				// ErrorStateコンポーネントの表示形式に合わせて確認
				// "エラー: ページの取得に失敗しました" として表示される
				const errorElement = screen.getByText((content, _element) => {
					// エラーメッセージ全体または一部を確認
					return content.includes("ページの取得に失敗しました");
				});
				expect(errorElement).toBeInTheDocument();
			});
		});
	});
});
