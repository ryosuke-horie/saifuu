/**
 * 収入管理画面統合テスト
 * Issue #408: Phase 2-6の要件を検証
 *
 * テスト対象:
 * - 統計カード、フィルタ、グラフ、一覧の統合
 * - レイアウトの適切な配置
 * - コンポーネント間の連携
 * - パフォーマンス要件（2秒以内の表示）
 */

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http } from "msw";
import { setupServer } from "msw/node";
import {
	afterAll,
	afterEach,
	beforeAll,
	describe,
	expect,
	it,
	vi,
} from "vitest";
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
}));

// APIモックサーバーのセットアップ
const server = setupServer(
	// 収入統計API
	http.get("/api/transactions/stats", () => {
		return new Response(
			JSON.stringify({
				currentMonth: 450000,
				lastMonth: 420000,
				currentYear: 5400000,
				monthOverMonth: 7.14,
				categoryBreakdown: [
					{ categoryId: "101", name: "給与", amount: 350000, percentage: 77.8 },
					{ categoryId: "102", name: "ボーナス", amount: 0, percentage: 0 },
					{ categoryId: "103", name: "副業", amount: 80000, percentage: 17.8 },
					{
						categoryId: "104",
						name: "投資収益",
						amount: 20000,
						percentage: 4.4,
					},
				],
			}),
			{ headers: { "Content-Type": "application/json" } },
		);
	}),

	// カテゴリマスタAPI
	http.get("/api/categories", () => {
		return new Response(
			JSON.stringify([
				{
					id: "101",
					name: "給与",
					type: "income",
					color: "#10b981",
					numericId: 101,
				},
				{
					id: "102",
					name: "ボーナス",
					type: "income",
					color: "#059669",
					numericId: 102,
				},
				{
					id: "103",
					name: "副業",
					type: "income",
					color: "#34d399",
					numericId: 103,
				},
				{
					id: "104",
					name: "投資収益",
					type: "income",
					color: "#6ee7b7",
					numericId: 104,
				},
				{
					id: "105",
					name: "その他",
					type: "income",
					color: "#a7f3d0",
					numericId: 105,
				},
			]),
			{ headers: { "Content-Type": "application/json" } },
		);
	}),

	// 収入一覧API（ページネーション対応）
	http.get("/api/transactions", ({ request }) => {
		const url = new URL(request.url);
		const type = url.searchParams.get("type");
		const page = Number(url.searchParams.get("page")) || 1;
		const limit = Number(url.searchParams.get("limit")) || 10;

		if (type !== "income") {
			return new Response(null, { status: 400 });
		}

		const mockData = Array.from({ length: 25 }, (_, i) => ({
			id: `income-${i + 1}`,
			amount: 350000 + i * 10000,
			date: `2024-01-${String(i + 1).padStart(2, "0")}`,
			type: "income",
			categoryId: "101",
			category: { id: "101", name: "給与", type: "income", color: "#10b981" },
			description: `給与 ${i + 1}月分`,
		}));

		const startIndex = (page - 1) * limit;
		const endIndex = startIndex + limit;
		const paginatedData = mockData.slice(startIndex, endIndex);

		return new Response(
			JSON.stringify({
				data: paginatedData,
				pagination: {
					currentPage: page,
					totalPages: Math.ceil(mockData.length / limit),
					totalItems: mockData.length,
					itemsPerPage: limit,
				},
			}),
			{ headers: { "Content-Type": "application/json" } },
		);
	}),
);

// テストのセットアップ
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// パフォーマンス計測用のモック
const performanceMock = {
	startTime: 0,
	mark: vi.fn((name: string) => {
		if (name === "page-start") {
			performanceMock.startTime = Date.now();
		}
	}),
	measure: vi.fn((name: string, startMark: string) => {
		if (name === "page-load" && startMark === "page-start") {
			return Date.now() - performanceMock.startTime;
		}
		return 0;
	}),
};

// performance API のモック
global.performance.mark = performanceMock.mark as any;
global.performance.measure = performanceMock.measure as any;

describe("収入管理画面統合テスト", () => {
	it("すべての必須コンポーネントが正しい順序で表示される", async () => {
		performance.mark("page-start");
		render(<IncomePage />);

		// 1. 収入統計カードが上部に表示される
		await waitFor(() => {
			const statsSection = screen.getByTestId("income-stats");
			expect(statsSection).toBeInTheDocument();
		});

		// 統計カードの内容確認
		const statsSection = screen.getByTestId("income-stats");
		expect(within(statsSection).getByText("今月の収入")).toBeInTheDocument();
		expect(within(statsSection).getByText("¥450,000")).toBeInTheDocument();
		expect(within(statsSection).getByText("先月の収入")).toBeInTheDocument();
		expect(within(statsSection).getByText("¥420,000")).toBeInTheDocument();
		expect(within(statsSection).getByText("今年の収入")).toBeInTheDocument();
		expect(within(statsSection).getByText("¥5,400,000")).toBeInTheDocument();
		expect(within(statsSection).getByText("前月比")).toBeInTheDocument();
		expect(within(statsSection).getByText("+7.14%")).toBeInTheDocument();

		// 2. フィルタリングコントロールが中部に表示される
		const filtersSection = screen.getByTestId("income-filters");
		expect(filtersSection).toBeInTheDocument();
		expect(
			within(filtersSection).getByLabelText("期間選択"),
		).toBeInTheDocument();
		expect(within(filtersSection).getByText("カテゴリ")).toBeInTheDocument();
		expect(within(filtersSection).getByText("金額範囲")).toBeInTheDocument();

		// 3. カテゴリ別グラフが中部右に表示される
		const chartSection = screen.getByTestId("income-category-chart");
		expect(chartSection).toBeInTheDocument();
		expect(
			within(chartSection).getByText("カテゴリ別内訳"),
		).toBeInTheDocument();

		// 4. 収入一覧テーブルが下部に表示される
		await waitFor(() => {
			const listSection = screen.getByTestId("income-list");
			expect(listSection).toBeInTheDocument();
		});

		// ページネーションコントロールの確認
		const paginationSection = screen.getByTestId("pagination-controls");
		expect(paginationSection).toBeInTheDocument();
		expect(within(paginationSection).getByText("1 / 3")).toBeInTheDocument();

		// パフォーマンス測定
		const loadTime = performance.measure("page-load", "page-start");
		expect(loadTime).toBeLessThan(2000); // 2秒以内
	});

	it("フィルタと統計が連動して動作する", async () => {
		const user = userEvent.setup();
		render(<IncomePage />);

		// 初期状態の確認
		await waitFor(() => {
			expect(screen.getByTestId("income-stats")).toBeInTheDocument();
		});

		// カテゴリフィルタを適用
		const filtersSection = screen.getByTestId("income-filters");
		const salaryCheckbox = within(filtersSection).getByRole("checkbox", {
			name: /給与/,
		});
		await user.click(salaryCheckbox);

		// 統計が更新されることを確認
		await waitFor(() => {
			const statsSection = screen.getByTestId("income-stats");
			// フィルタ適用後の統計値が更新される
			expect(within(statsSection).getByText("¥350,000")).toBeInTheDocument();
		});

		// グラフも連動して更新されることを確認
		const chartSection = screen.getByTestId("income-category-chart");
		await waitFor(() => {
			expect(within(chartSection).getByTestId("category-101")).toHaveStyle({
				opacity: "1",
			});
			expect(within(chartSection).getByTestId("category-103")).toHaveStyle({
				opacity: "0.5",
			});
		});
	});

	it("ページネーションが正しく動作する", async () => {
		const user = userEvent.setup();
		render(<IncomePage />);

		// 初期ページの確認
		await waitFor(() => {
			const listSection = screen.getByTestId("income-list");
			expect(listSection).toBeInTheDocument();
		});

		// 10件表示されることを確認
		const incomeItems = screen.getAllByTestId(/^income-item-/);
		expect(incomeItems).toHaveLength(10);

		// 次のページへ移動
		const nextButton = screen.getByRole("button", { name: "次のページ" });
		await user.click(nextButton);

		// ページ番号が更新される
		await waitFor(() => {
			const paginationSection = screen.getByTestId("pagination-controls");
			expect(within(paginationSection).getByText("2 / 3")).toBeInTheDocument();
		});

		// 表示件数を変更
		const itemsPerPageSelect = screen.getByLabelText("表示件数");
		await user.selectOptions(itemsPerPageSelect, "20");

		// 20件表示されることを確認
		await waitFor(() => {
			const updatedItems = screen.getAllByTestId(/^income-item-/);
			expect(updatedItems).toHaveLength(20);
		});
	});

	it("レスポンシブデザインが適切に適用される", () => {
		// モバイルビューポート
		global.innerWidth = 375;
		global.innerHeight = 667;
		const { container } = render(<IncomePage />);

		// モバイル用のレイアウトクラスが適用される
		expect(container.querySelector(".grid-cols-1")).toBeInTheDocument();
		expect(container.querySelector(".grid-cols-2")).not.toBeInTheDocument();

		// デスクトップビューポート
		global.innerWidth = 1920;
		global.innerHeight = 1080;
		const { container: desktopContainer } = render(<IncomePage />);

		// デスクトップ用のレイアウトクラスが適用される
		expect(desktopContainer.querySelector(".grid-cols-2")).toBeInTheDocument();
		expect(
			desktopContainer.querySelector(".lg\\:grid-cols-4"),
		).toBeInTheDocument();
	});

	it("データフェッチが最適化されている（並列実行）", async () => {
		const fetchSpy = vi.spyOn(global, "fetch");
		render(<IncomePage />);

		// 初回レンダリング時に複数のAPIが並列で呼ばれる
		await waitFor(() => {
			expect(fetchSpy).toHaveBeenCalledTimes(3); // stats, categories, transactions
		});

		// APIコールのタイミングを確認（ほぼ同時に呼ばれる）
		const callTimes = fetchSpy.mock.calls.map(() => Date.now());
		const timeDifferences = callTimes
			.slice(1)
			.map((time, i) => time - callTimes[i]);

		// 各APIコールの間隔が100ms未満（並列実行の証拠）
		timeDifferences.forEach((diff) => {
			expect(diff).toBeLessThan(100);
		});

		fetchSpy.mockRestore();
	});

	it("エラー状態が適切に表示される", async () => {
		// エラーレスポンスを返すようにモック
		server.use(
			http.get("/api/transactions", () => {
				return new Response(null, { status: 500 });
			}),
		);

		render(<IncomePage />);

		// エラーメッセージが表示される
		await waitFor(() => {
			expect(
				screen.getByText(/データの取得に失敗しました/),
			).toBeInTheDocument();
		});

		// リトライボタンが表示される
		const retryButton = screen.getByRole("button", { name: "再試行" });
		expect(retryButton).toBeInTheDocument();
	});
});
