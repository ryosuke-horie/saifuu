import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { IncomeCategoryData } from "../IncomeCategoryChart";
import { IncomeCategoryChart } from "../IncomeCategoryChart";

// Rechartsのモック設定
vi.mock("recharts", () => ({
	ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="responsive-container">{children}</div>
	),
	PieChart: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="pie-chart">{children}</div>
	),
	BarChart: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="bar-chart">{children}</div>
	),
	Pie: ({ children, data, label }: any) => (
		<div data-testid="pie" data-label={label}>
			{data?.map((item: any) => (
				<div
					key={item.categoryId}
					data-testid={`pie-segment-${item.categoryId}`}
				>
					{item.name}: {item.percentage}%
				</div>
			))}
			{children}
		</div>
	),
	Bar: ({ dataKey }: { dataKey: string }) => (
		<div data-testid={`bar-${dataKey}`} />
	),
	Cell: ({ fill }: { fill: string }) => (
		<div data-testid="cell" style={{ backgroundColor: fill }} />
	),
	Tooltip: () => <div data-testid="tooltip" />,
	Legend: () => <div data-testid="legend" />,
	XAxis: ({ dataKey }: { dataKey: string }) => (
		<div data-testid={`xaxis-${dataKey}`} />
	),
	YAxis: () => <div data-testid="yaxis" />,
	CartesianGrid: () => <div data-testid="cartesian-grid" />,
}));

describe("IncomeCategoryChart", () => {
	const mockData: IncomeCategoryData[] = [
		{
			categoryId: "101",
			name: "給与",
			amount: 300000,
			percentage: 60,
			color: "#10b981",
		},
		{
			categoryId: "102",
			name: "ボーナス",
			amount: 150000,
			percentage: 30,
			color: "#059669",
		},
		{
			categoryId: "103",
			name: "副業",
			amount: 50000,
			percentage: 10,
			color: "#34d399",
		},
	];

	describe("基本的な表示", () => {
		it("円グラフモードで正しく描画される", () => {
			render(<IncomeCategoryChart data={mockData} />);

			// タイトルが表示される
			expect(screen.getByText("カテゴリ別収入")).toBeInTheDocument();

			// 円グラフが表示される
			expect(screen.getByTestId("pie-chart")).toBeInTheDocument();

			// 各カテゴリのセグメントが表示される
			expect(screen.getByTestId("pie-segment-101")).toBeInTheDocument();
			expect(screen.getByTestId("pie-segment-102")).toBeInTheDocument();
			expect(screen.getByTestId("pie-segment-103")).toBeInTheDocument();

			// パーセンテージが表示される
			expect(screen.getByText(/給与: 60%/)).toBeInTheDocument();
			expect(screen.getByText(/ボーナス: 30%/)).toBeInTheDocument();
			expect(screen.getByText(/副業: 10%/)).toBeInTheDocument();
		});

		it("棒グラフモードで正しく描画される", async () => {
			const user = userEvent.setup();
			render(<IncomeCategoryChart data={mockData} />);

			// 切り替えボタンをクリック
			const toggleButton = screen.getByRole("button", {
				name: /グラフ切り替え/i,
			});
			await user.click(toggleButton);

			// 棒グラフが表示される
			expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
			expect(screen.getByTestId("bar-amount")).toBeInTheDocument();
			expect(screen.getByTestId("xaxis-name")).toBeInTheDocument();
			expect(screen.getByTestId("yaxis")).toBeInTheDocument();
		});

		it("データが空の場合、適切なメッセージが表示される", () => {
			render(<IncomeCategoryChart data={[]} />);

			expect(screen.getByText("データがありません")).toBeInTheDocument();
		});
	});

	describe("インタラクション", () => {
		it("円グラフと棒グラフを切り替えられる", async () => {
			const user = userEvent.setup();
			render(<IncomeCategoryChart data={mockData} />);

			// 初期状態は円グラフ
			expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
			expect(screen.queryByTestId("bar-chart")).not.toBeInTheDocument();

			// 切り替えボタンをクリック
			const toggleButton = screen.getByRole("button", {
				name: /グラフ切り替え/i,
			});
			await user.click(toggleButton);

			// 棒グラフに切り替わる
			expect(screen.queryByTestId("pie-chart")).not.toBeInTheDocument();
			expect(screen.getByTestId("bar-chart")).toBeInTheDocument();

			// もう一度クリックして円グラフに戻る
			await user.click(toggleButton);
			expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
			expect(screen.queryByTestId("bar-chart")).not.toBeInTheDocument();
		});

		it("凡例をクリックすると詳細が表示される", async () => {
			const user = userEvent.setup();
			render(<IncomeCategoryChart data={mockData} />);

			// 凡例アイテムをクリック
			const legendItem = screen.getByTestId("legend-item-101");
			await user.click(legendItem);

			// 詳細情報が表示される
			const detail = screen.getByTestId("category-detail-101");
			expect(detail).toBeInTheDocument();
			expect(within(detail).getByText("¥300,000")).toBeInTheDocument();
			expect(within(detail).getByText("60%")).toBeInTheDocument();
		});
	});

	describe("レスポンシブ対応", () => {
		it("モバイルサイズで適切に表示される", () => {
			// ビューポートサイズをモバイルに設定
			global.innerWidth = 375;
			global.innerHeight = 667;

			render(<IncomeCategoryChart data={mockData} />);

			const container = screen.getByTestId("income-category-chart");
			expect(container).toHaveClass("flex-col");
		});

		it("デスクトップサイズで適切に表示される", () => {
			// ビューポートサイズをデスクトップに設定
			global.innerWidth = 1920;
			global.innerHeight = 1080;

			render(<IncomeCategoryChart data={mockData} />);

			const container = screen.getByTestId("income-category-chart");
			expect(container).toHaveClass("flex-row");
		});
	});

	describe("アクセシビリティ", () => {
		it("適切なARIAラベルが設定されている", () => {
			render(<IncomeCategoryChart data={mockData} />);

			const chart = screen.getByRole("img", {
				name: /カテゴリ別収入内訳/i,
			});
			expect(chart).toBeInTheDocument();
		});

		it("スクリーンリーダー用の代替テキストがある", () => {
			render(<IncomeCategoryChart data={mockData} />);

			const srOnly = screen.getByTestId("sr-only-description");
			expect(srOnly).toHaveTextContent(
				"給与が60%、ボーナスが30%、副業が10%を占めています",
			);
		});

		it("キーボードナビゲーションが可能", async () => {
			const user = userEvent.setup();
			render(<IncomeCategoryChart data={mockData} />);

			// Tabキーで切り替えボタンにフォーカス
			await user.tab();
			const toggleButton = screen.getByRole("button", {
				name: /グラフ切り替え/i,
			});
			expect(toggleButton).toHaveFocus();

			// Enterキーで切り替え
			await user.keyboard("{Enter}");
			expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
		});
	});

	describe("アニメーション", () => {
		it("初回レンダリング時にアニメーションが実行される", () => {
			const { container } = render(<IncomeCategoryChart data={mockData} />);

			const animatedElements = container.querySelectorAll("[data-animated]");
			expect(animatedElements.length).toBeGreaterThan(0);
		});
	});

	describe("緑系統のカラーパレット", () => {
		it("収入用の緑系統の色が使用される", () => {
			render(<IncomeCategoryChart data={mockData} />);

			const cells = screen.getAllByTestId("cell");
			expect(cells[0]).toHaveStyle({ backgroundColor: "#10b981" });
			expect(cells[1]).toHaveStyle({ backgroundColor: "#059669" });
			expect(cells[2]).toHaveStyle({ backgroundColor: "#34d399" });
		});
	});
});
