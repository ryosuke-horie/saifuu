/**
 * ExpenseStats コンポーネントのユニットテスト
 *
 * テスト内容:
 * - 各状態の表示確認（Default, Loading, Error, Empty）
 * - 統計数値のフォーマット確認
 * - レスポンシブデザインの基本確認
 * - アクセシビリティの確認
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { ExpenseStats } from "./ExpenseStats";

// モックデータ
const mockStatsData = {
	totalExpense: 98765,
	transactionCount: 42,
	monthlyComparison: 12.5, // 前月比12.5%増
	topExpenseCategory: { name: "食費", amount: 50000 },
};

const mockEmptyStatsData = {
	totalExpense: 0,
	transactionCount: 0,
	monthlyComparison: 0,
	topExpenseCategory: null,
};

describe("ExpenseStats", () => {
	beforeEach(() => {
		// 各テスト前にモックをリセット
		vi.clearAllMocks();
	});

	describe("基本的な表示", () => {
		test("統計データが正常に表示される", async () => {
			render(
				<ExpenseStats stats={mockStatsData} isLoading={false} error={null} />,
			);

			// メインコンテナの表示確認
			expect(screen.getByTestId("expense-stats")).toBeInTheDocument();

			// 月間支出カードの確認
			expect(screen.getByTestId("monthly-balance-card")).toBeInTheDocument();
			expect(screen.getByText("月間支出")).toBeInTheDocument();

			// 統計数値の表示確認
			expect(screen.getByTestId("total-expense")).toHaveTextContent("￥98,765");
			// 収入とバランスは表示されない
			expect(screen.queryByTestId("total-income")).not.toBeInTheDocument();
			expect(screen.queryByTestId("balance-amount")).not.toBeInTheDocument();
		});

	});

	describe("ローディング状態", () => {
		test("ローディング状態が正常に表示される", () => {
			render(<ExpenseStats stats={null} isLoading={true} error={null} />);

			// スケルトンローダーの確認
			expect(screen.getByTestId("stats-skeleton")).toBeInTheDocument();
		});
	});

	describe("エラー状態", () => {
		test("エラー状態が正常に表示される", () => {
			const errorMessage = "統計データの取得に失敗しました";
			const mockOnRetry = vi.fn();

			render(
				<ExpenseStats
					stats={null}
					isLoading={false}
					error={errorMessage}
					onRetry={mockOnRetry}
				/>,
			);

			// エラーメッセージの確認
			expect(screen.getByTestId("stats-error")).toBeInTheDocument();
			expect(screen.getByText("エラー")).toBeInTheDocument();
			expect(screen.getByText(errorMessage)).toBeInTheDocument();

			// リトライボタンの確認
			expect(screen.getByTestId("stats-retry-button")).toBeInTheDocument();
			expect(screen.getByText("再試行")).toBeInTheDocument();
		});

		test("リトライボタンクリック時にonRetry関数が呼ばれる", async () => {
			const mockOnRetry = vi.fn();
			const user = userEvent.setup();

			render(
				<ExpenseStats
					stats={null}
					isLoading={false}
					error="エラーメッセージ"
					onRetry={mockOnRetry}
				/>,
			);

			const retryButton = screen.getByTestId("stats-retry-button");
			await user.click(retryButton);

			expect(mockOnRetry).toHaveBeenCalledOnce();
		});

	});

	describe("空データ状態", () => {
		test("空データ状態が正常に表示される", () => {
			render(
				<ExpenseStats
					stats={mockEmptyStatsData}
					isLoading={false}
					error={null}
				/>,
			);

			// 空状態メッセージの確認
			expect(screen.getByTestId("stats-empty")).toBeInTheDocument();
			expect(screen.getByText("データがありません")).toBeInTheDocument();
			expect(screen.getByText("取引を登録してください")).toBeInTheDocument();
		});

	});

	describe("数値フォーマット", () => {
		test("日本円形式で正しくフォーマットされる", () => {
			const testStats = {
				...mockStatsData,
				totalExpense: 987654,
			};

			render(<ExpenseStats stats={testStats} isLoading={false} error={null} />);

			// カンマ区切りの確認
			expect(screen.getByTestId("total-expense")).toHaveTextContent(
				"￥987,654",
			);
		});
	});

	describe("アクセシビリティ", () => {
		test("適切なARIA属性が設定されている", () => {
			render(
				<ExpenseStats stats={mockStatsData} isLoading={false} error={null} />,
			);

			// セクションにaria-labelledbyが設定されている
			const statsContainer = screen.getByTestId("expense-stats");
			expect(statsContainer).toHaveAttribute(
				"aria-labelledby",
				"expense-stats-title",
			);
		});
	});


	describe("カスタムprops", () => {
		test("classNameプロパティが適用される", () => {
			const customClassName = "custom-stats-class";

			render(
				<ExpenseStats
					stats={mockStatsData}
					isLoading={false}
					error={null}
					className={customClassName}
				/>,
			);

			expect(screen.getByTestId("expense-stats")).toHaveClass(customClassName);
		});

		test("onRefreshプロパティが機能する", async () => {
			const mockOnRefresh = vi.fn();
			const user = userEvent.setup();

			render(
				<ExpenseStats
					stats={mockStatsData}
					isLoading={false}
					error={null}
					onRefresh={mockOnRefresh}
				/>,
			);

			// リフレッシュボタンが表示されることを確認
			const refreshButton = screen.getByTestId("stats-refresh-button");
			expect(refreshButton).toBeInTheDocument();

			// クリック時にonRefresh関数が呼ばれることを確認
			await user.click(refreshButton);
			expect(mockOnRefresh).toHaveBeenCalledOnce();
		});
	});

});
