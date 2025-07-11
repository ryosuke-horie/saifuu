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
	totalIncome: 123456,
	totalExpense: 98765,
	balance: 24691,
	transactionCount: 42,
	monthlyComparison: 12.5, // 前月比12.5%増
	topExpenseCategory: { name: "食費", amount: 50000 },
	topIncomeCategory: { name: "給与", amount: 100000 },
};

const mockEmptyStatsData = {
	totalIncome: 0,
	totalExpense: 0,
	balance: 0,
	transactionCount: 0,
	monthlyComparison: 0,
	topExpenseCategory: null,
	topIncomeCategory: null,
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

			// 月間収支カードの確認
			expect(screen.getByTestId("monthly-balance-card")).toBeInTheDocument();
			expect(screen.getByText("月間収支")).toBeInTheDocument();

			// 統計数値の表示確認
			expect(screen.getByTestId("total-income")).toHaveTextContent("￥123,456");
			expect(screen.getByTestId("total-expense")).toHaveTextContent("￥98,765");
			expect(screen.getByTestId("balance-amount")).toHaveTextContent(
				"￥24,691",
			);
		});

		test("主要カテゴリ情報が正常に表示される", () => {
			render(
				<ExpenseStats stats={mockStatsData} isLoading={false} error={null} />,
			);

			// 主要カテゴリカードの確認
			expect(screen.getByTestId("top-categories-card")).toBeInTheDocument();
			expect(screen.getByText("主要カテゴリ")).toBeInTheDocument();

			// カテゴリ情報の確認
			expect(screen.getByTestId("top-expense-category")).toHaveTextContent(
				"食費",
			);
			expect(screen.getByTestId("top-expense-category")).toHaveTextContent(
				"食費",
			);
			expect(screen.getByTestId("top-expense-category")).toHaveTextContent(
				"￥50,000",
			);
			expect(screen.getByTestId("top-income-category")).toHaveTextContent(
				"給与",
			);
			expect(screen.getByTestId("top-income-category")).toHaveTextContent(
				"￥100,000",
			);
		});

		test("期間比較情報が正常に表示される", () => {
			render(
				<ExpenseStats stats={mockStatsData} isLoading={false} error={null} />,
			);

			// 期間比較カードの確認
			expect(screen.getByTestId("period-comparison-card")).toBeInTheDocument();
			expect(screen.getByText("前月比")).toBeInTheDocument();

			// 前月比の数値確認
			expect(screen.getByTestId("monthly-comparison")).toHaveTextContent(
				"+12.5%",
			);
		});
	});

	describe("ローディング状態", () => {
		test("ローディング状態が正常に表示される", () => {
			render(<ExpenseStats stats={null} isLoading={true} error={null} />);

			// ローディングスピナーの確認
			expect(screen.getByTestId("stats-loading")).toBeInTheDocument();
			expect(screen.getByText("読み込み中...")).toBeInTheDocument();

			// 統計データが表示されていないことを確認
			expect(screen.queryByTestId("expense-stats")).not.toBeInTheDocument();
		});

		test("ローディング中はアクセシビリティ属性が適切に設定される", () => {
			render(<ExpenseStats stats={null} isLoading={true} error={null} />);

			const loadingElement = screen.getByTestId("stats-loading");
			expect(loadingElement).toHaveAttribute("role", "status");
			expect(loadingElement).toHaveAttribute("aria-live", "polite");
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

		test("エラー状態でのアクセシビリティ属性が適切に設定される", () => {
			render(
				<ExpenseStats
					stats={null}
					isLoading={false}
					error="エラーメッセージ"
				/>,
			);

			const errorElement = screen.getByTestId("stats-error");
			expect(errorElement).toHaveAttribute("role", "alert");
			expect(errorElement).toHaveAttribute("aria-live", "assertive");
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

		test("空データでも基本的な構造は表示される", () => {
			render(
				<ExpenseStats
					stats={mockEmptyStatsData}
					isLoading={false}
					error={null}
				/>,
			);

			// 空データの場合はEmptyStateが表示され、カードは表示されない
			expect(screen.getByTestId("stats-empty")).toBeInTheDocument();
			expect(
				screen.queryByTestId("monthly-balance-card"),
			).not.toBeInTheDocument();
		});
	});

	describe("数値フォーマット", () => {
		test("日本円形式で正しくフォーマットされる", () => {
			const testStats = {
				...mockStatsData,
				totalIncome: 1234567,
				totalExpense: 987654,
				balance: 246913,
			};

			render(<ExpenseStats stats={testStats} isLoading={false} error={null} />);

			// カンマ区切りの確認
			expect(screen.getByTestId("total-income")).toHaveTextContent(
				"￥1,234,567",
			);
			expect(screen.getByTestId("total-expense")).toHaveTextContent(
				"￥987,654",
			);
			expect(screen.getByTestId("balance-amount")).toHaveTextContent(
				"￥246,913",
			);
		});

		test("負の収支が正しく表示される", () => {
			const testStats = {
				...mockStatsData,
				totalIncome: 50000,
				totalExpense: 75000,
				balance: -25000,
			};

			render(<ExpenseStats stats={testStats} isLoading={false} error={null} />);

			// 負の収支の表示確認
			const balanceElement = screen.getByTestId("balance-amount");
			expect(balanceElement).toHaveTextContent("-￥25,000");
			expect(balanceElement).toHaveClass("text-red-600"); // 負の値は赤色
		});

		test("正の収支が正しく表示される", () => {
			render(
				<ExpenseStats stats={mockStatsData} isLoading={false} error={null} />,
			);

			// 正の収支の表示確認
			const balanceElement = screen.getByTestId("balance-amount");
			expect(balanceElement).toHaveTextContent("￥24,691");
			expect(balanceElement).toHaveClass("text-green-600"); // 正の値は緑色
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

			// 各カードにrole属性が設定されている
			expect(screen.getByTestId("monthly-balance-card")).toHaveAttribute(
				"role",
				"region",
			);
			expect(screen.getByTestId("top-categories-card")).toHaveAttribute(
				"role",
				"region",
			);
			expect(screen.getByTestId("period-comparison-card")).toHaveAttribute(
				"role",
				"region",
			);
		});

		test("セマンティックなマークアップが使用されている", () => {
			render(
				<ExpenseStats stats={mockStatsData} isLoading={false} error={null} />,
			);

			// regionロールが設定されている（メインセクション + 3つのカード）
			const regions = screen.getAllByRole("region");
			expect(regions).toHaveLength(4); // メインセクション + 3つのカードregion
		});
	});

	describe("条件付きレンダリング", () => {
		test("プロパティが未定義の場合の処理", () => {
			render(<ExpenseStats stats={undefined} isLoading={false} error={null} />);

			// 未定義の場合は空状態として処理される
			expect(screen.getByTestId("stats-empty")).toBeInTheDocument();
		});

		test("nullプロパティの安全な処理", () => {
			const statsWithNulls = {
				...mockStatsData,
				topExpenseCategory: null,
				topIncomeCategory: null,
			};

			render(
				<ExpenseStats stats={statsWithNulls} isLoading={false} error={null} />,
			);

			// null値の場合は適切なフォールバック表示
			expect(screen.getByTestId("top-expense-category")).toHaveTextContent(
				"データなし",
			);
			expect(screen.getByTestId("top-income-category")).toHaveTextContent(
				"データなし",
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
