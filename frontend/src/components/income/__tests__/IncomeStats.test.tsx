/**
 * IncomeStatsコンポーネントのユニットテスト
 * 収入統計情報の表示を検証
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { IncomeStatistics } from "@/types/income";
import { IncomeStats } from "../IncomeStats";

describe("IncomeStats", () => {
	// 基本的な統計データのモック
	const mockStats: IncomeStatistics = {
		currentMonth: 300000,
		lastMonth: 280000,
		currentYear: 3600000,
		monthOverMonth: 7.1,
		categoryBreakdown: [
			{
				categoryId: 101,
				name: "給与",
				amount: 250000,
				percentage: 83.3,
			},
			{
				categoryId: 103,
				name: "副業",
				amount: 50000,
				percentage: 16.7,
			},
		],
	};

	describe("統計カードの表示", () => {
		it("今月の収入を表示する", () => {
			render(<IncomeStats stats={mockStats} />);

			// 今月の収入セクションが存在することを確認
			expect(screen.getByText("今月の収入")).toBeInTheDocument();
			// 金額が日本円形式で表示されることを確認
			expect(screen.getByText("¥300,000")).toBeInTheDocument();
		});

		it("先月の収入を表示する", () => {
			render(<IncomeStats stats={mockStats} />);

			expect(screen.getByText("先月の収入")).toBeInTheDocument();
			expect(screen.getByText("¥280,000")).toBeInTheDocument();
		});

		it("今年の収入合計を表示する", () => {
			render(<IncomeStats stats={mockStats} />);

			expect(screen.getByText("今年の収入")).toBeInTheDocument();
			expect(screen.getByText("¥3,600,000")).toBeInTheDocument();
		});

		it("前月比増減率を表示する", () => {
			render(<IncomeStats stats={mockStats} />);

			expect(screen.getByText("前月比")).toBeInTheDocument();
			// 増加の場合は上向き矢印とプラス記号を表示
			expect(screen.getByText("+7.1%")).toBeInTheDocument();
			expect(screen.getByTestId("trend-up-icon")).toBeInTheDocument();
		});

		it("前月比が減少の場合、下向き矢印を表示する", () => {
			const statsWithDecrease: IncomeStatistics = {
				...mockStats,
				monthOverMonth: -5.2,
			};

			render(<IncomeStats stats={statsWithDecrease} />);

			expect(screen.getByText("-5.2%")).toBeInTheDocument();
			expect(screen.getByTestId("trend-down-icon")).toBeInTheDocument();
		});

		it("前月比が変化なしの場合、横ばいアイコンを表示する", () => {
			const statsWithNoChange: IncomeStatistics = {
				...mockStats,
				monthOverMonth: 0,
			};

			render(<IncomeStats stats={statsWithNoChange} />);

			expect(screen.getByText("0%")).toBeInTheDocument();
			expect(screen.getByTestId("trend-flat-icon")).toBeInTheDocument();
		});
	});

	describe("ローディング状態", () => {
		it("ローディング中はスケルトンを表示する", () => {
			render(<IncomeStats stats={mockStats} isLoading={true} />);

			// スケルトンが4つ表示される（各統計カード用）
			const skeletons = screen.getAllByTestId("skeleton-card");
			expect(skeletons).toHaveLength(4);
		});

		it("ローディング中は統計データを表示しない", () => {
			render(<IncomeStats stats={mockStats} isLoading={true} />);

			expect(screen.queryByText("¥300,000")).not.toBeInTheDocument();
			expect(screen.queryByText("¥280,000")).not.toBeInTheDocument();
		});
	});

	describe("エラー状態", () => {
		it("エラー時はエラーメッセージを表示する", () => {
			const error = new Error("統計データの取得に失敗しました");
			render(<IncomeStats stats={mockStats} error={error} />);

			expect(screen.getByText("エラーが発生しました")).toBeInTheDocument();
			expect(
				screen.getByText("統計データの取得に失敗しました"),
			).toBeInTheDocument();
		});

		it("エラー時は統計データを表示しない", () => {
			const error = new Error("統計データの取得に失敗しました");
			render(<IncomeStats stats={mockStats} error={error} />);

			expect(screen.queryByText("¥300,000")).not.toBeInTheDocument();
			expect(screen.queryByText("今月の収入")).not.toBeInTheDocument();
		});
	});

	describe("レスポンシブデザイン", () => {
		it("グリッドレイアウトでカードを配置する", () => {
			const { container } = render(<IncomeStats stats={mockStats} />);

			// グリッドコンテナが存在することを確認
			const gridContainer = container.querySelector(".grid");
			expect(gridContainer).toBeInTheDocument();

			// モバイル、タブレット、デスクトップ用のレスポンシブクラスを確認
			expect(gridContainer).toHaveClass("grid-cols-1");
			expect(gridContainer).toHaveClass("md:grid-cols-2");
			expect(gridContainer).toHaveClass("lg:grid-cols-4");
		});
	});

	describe("ビジュアルデザイン", () => {
		it("緑系統のグラデーションを使用する", () => {
			const { container } = render(<IncomeStats stats={mockStats} />);

			// カードが緑系統のグラデーションクラスを持つことを確認
			const cards = container.querySelectorAll('[data-testid="stats-card"]');
			cards.forEach((card) => {
				expect(card).toHaveClass("bg-gradient-to-r");
				expect(card).toHaveClass("from-green-50");
				expect(card).toHaveClass("to-emerald-50");
			});
		});

		it("収入増加時は緑色のアクセントカラーを使用する", () => {
			render(<IncomeStats stats={mockStats} />);

			const trendIndicator = screen.getByTestId("trend-indicator");
			expect(trendIndicator).toHaveClass("text-green-600");
		});

		it("収入減少時は赤色のアクセントカラーを使用する", () => {
			const statsWithDecrease: IncomeStatistics = {
				...mockStats,
				monthOverMonth: -5.2,
			};

			render(<IncomeStats stats={statsWithDecrease} />);

			const trendIndicator = screen.getByTestId("trend-indicator");
			expect(trendIndicator).toHaveClass("text-red-600");
		});
	});

	describe("カテゴリ別内訳の表示", () => {
		it("カテゴリ別の収入内訳を表示する", () => {
			render(<IncomeStats stats={mockStats} />);

			// カテゴリ名と金額が表示されることを確認
			expect(screen.getByText("給与")).toBeInTheDocument();
			expect(screen.getByText("¥250,000")).toBeInTheDocument();
			expect(screen.getByText("(83.3%)")).toBeInTheDocument();

			expect(screen.getByText("副業")).toBeInTheDocument();
			expect(screen.getByText("¥50,000")).toBeInTheDocument();
			expect(screen.getByText("(16.7%)")).toBeInTheDocument();
		});

		it("カテゴリ別内訳セクションにタイトルを表示する", () => {
			render(<IncomeStats stats={mockStats} />);

			expect(screen.getByText("カテゴリ別内訳")).toBeInTheDocument();
		});
	});

	describe("アニメーション効果", () => {
		it("数値にアニメーションクラスを適用する", () => {
			const { container } = render(<IncomeStats stats={mockStats} />);

			// 数値要素がアニメーションクラスを持つことを確認
			const amountElements = container.querySelectorAll(
				'[data-testid="amount-display"]',
			);
			amountElements.forEach((element) => {
				expect(element).toHaveClass("transition-all");
				expect(element).toHaveClass("duration-500");
			});
		});
	});
});
