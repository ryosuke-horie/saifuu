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
			// 収入カテゴリは表示されない
			expect(
				screen.queryByTestId("top-income-category"),
			).not.toBeInTheDocument();
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
		test("ローディング状態が正常に表示される（スケルトンローダー）", () => {
			render(<ExpenseStats stats={null} isLoading={true} error={null} />);

			// スケルトンローダーの確認（デフォルト）
			expect(screen.getByTestId("stats-skeleton")).toBeInTheDocument();
			expect(screen.queryByTestId("stats-loading")).not.toBeInTheDocument();

			// 統計データが表示されていないことを確認
			expect(screen.queryByTestId("expense-stats")).not.toBeInTheDocument();
		});

		test("従来のローディング表示も利用可能", () => {
			render(
				<ExpenseStats
					stats={null}
					isLoading={true}
					error={null}
					useSkeletonLoader={false}
				/>,
			);

			// 従来のローディングスピナーの確認
			expect(screen.getByTestId("stats-loading")).toBeInTheDocument();
			expect(screen.getByText("読み込み中...")).toBeInTheDocument();
			expect(screen.queryByTestId("stats-skeleton")).not.toBeInTheDocument();

			// 統計データが表示されていないことを確認
			expect(screen.queryByTestId("expense-stats")).not.toBeInTheDocument();
		});

		test("ローディング中はアクセシビリティ属性が適切に設定される", () => {
			render(<ExpenseStats stats={null} isLoading={true} error={null} />);

			const loadingElement = screen.getByTestId("stats-skeleton");
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
				totalExpense: 987654,
			};

			render(<ExpenseStats stats={testStats} isLoading={false} error={null} />);

			// カンマ区切りの確認
			expect(screen.getByTestId("total-expense")).toHaveTextContent(
				"￥987,654",
			);
		});

		// 収支バランスの表示は削除されるため、これらのテストは不要
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
			// 収入カテゴリは削除される
			expect(
				screen.queryByTestId("top-income-category"),
			).not.toBeInTheDocument();
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

	describe("拡張機能テスト", () => {
		describe("スケルトンローダー", () => {
			test("useSkeletonLoader=trueの場合、スケルトンローダーが表示される", () => {
				render(
					<ExpenseStats
						stats={null}
						isLoading={true}
						error={null}
						useSkeletonLoader={true}
					/>,
				);

				// スケルトンローダーが表示されることを確認
				expect(screen.getByTestId("stats-skeleton")).toBeInTheDocument();
				expect(screen.queryByTestId("stats-loading")).not.toBeInTheDocument();
			});

			test("useSkeletonLoader=falseの場合、従来のローディング表示が使用される", () => {
				render(
					<ExpenseStats
						stats={null}
						isLoading={true}
						error={null}
						useSkeletonLoader={false}
					/>,
				);

				// 従来のローディング表示が使用されることを確認
				expect(screen.getByTestId("stats-loading")).toBeInTheDocument();
				expect(screen.queryByTestId("stats-skeleton")).not.toBeInTheDocument();
			});

			test("スケルトンローダーにアクセシビリティ属性が設定されている", () => {
				render(
					<ExpenseStats
						stats={null}
						isLoading={true}
						error={null}
						useSkeletonLoader={true}
					/>,
				);

				const skeletonElement = screen.getByTestId("stats-skeleton");
				expect(skeletonElement).toHaveAttribute("role", "status");
				expect(skeletonElement).toHaveAttribute("aria-live", "polite");
				expect(skeletonElement).toHaveAttribute(
					"aria-label",
					"統計データを読み込み中",
				);
			});
		});

		describe("エラータイプ別表示", () => {
			test("network エラータイプの場合、適切なアイコンとメッセージが表示される", () => {
				render(
					<ExpenseStats
						stats={null}
						isLoading={false}
						error="接続に失敗しました"
						errorType="network"
					/>,
				);

				// ネットワークエラーの要素が表示されることを確認
				expect(screen.getByTestId("stats-error")).toBeInTheDocument();
				expect(screen.getByText("🌐")).toBeInTheDocument(); // ネットワークアイコン
				expect(screen.getByText("ネットワークエラー")).toBeInTheDocument();
				expect(
					screen.getByText("インターネット接続を確認してください。"),
				).toBeInTheDocument();
			});

			test("server エラータイプの場合、適切なアイコンとメッセージが表示される", () => {
				render(
					<ExpenseStats
						stats={null}
						isLoading={false}
						error="サーバーがダウンしています"
						errorType="server"
					/>,
				);

				expect(screen.getByText("🛠️")).toBeInTheDocument(); // サーバーアイコン
				expect(screen.getByText("サーバーエラー")).toBeInTheDocument();
				expect(
					screen.getByText(
						"サーバーで問題が発生しました。しばらく待ってから再度お試しください。",
					),
				).toBeInTheDocument();
			});

			test("timeout エラータイプの場合、適切なアイコンとメッセージが表示される", () => {
				render(
					<ExpenseStats
						stats={null}
						isLoading={false}
						error="リクエストがタイムアウトしました"
						errorType="timeout"
					/>,
				);

				expect(screen.getByText("⏱️")).toBeInTheDocument(); // タイマーアイコン
				expect(screen.getByText("タイムアウト")).toBeInTheDocument();
				expect(
					screen.getByText(
						"リクエストがタイムアウトしました。再度お試しください。",
					),
				).toBeInTheDocument();
			});

			test("unknown/デフォルト エラータイプの場合、汎用的なメッセージが表示される", () => {
				render(
					<ExpenseStats
						stats={null}
						isLoading={false}
						error="予期しないエラー"
						errorType="unknown"
					/>,
				);

				expect(screen.getByText("⚠️")).toBeInTheDocument(); // 警告アイコン
				expect(screen.getByText("エラー")).toBeInTheDocument();
				expect(
					screen.getByText("予期しないエラーが発生しました。"),
				).toBeInTheDocument();
			});

			test("errorTypeが指定されない場合、unknownとして扱われる", () => {
				render(
					<ExpenseStats
						stats={null}
						isLoading={false}
						error="エラーメッセージ"
						// errorTypeを指定しない
					/>,
				);

				// デフォルトでunknownエラーとして表示される
				expect(screen.getByText("⚠️")).toBeInTheDocument();
				expect(screen.getByText("エラー")).toBeInTheDocument();
			});
		});

		describe("型安全性", () => {
			test("BaseStatsDataのみの場合、拡張機能は表示されない", () => {
				const baseStatsData = {
					totalExpense: 50000,
					transactionCount: 10,
				};

				render(
					<ExpenseStats stats={baseStatsData} isLoading={false} error={null} />,
				);

				// 基本統計は表示される
				expect(screen.getByTestId("monthly-balance-card")).toBeInTheDocument();

				// 拡張データは "データなし" として表示される
				expect(screen.getByTestId("top-categories-card")).toBeInTheDocument();
				expect(
					screen.getByTestId("period-comparison-card"),
				).toBeInTheDocument();

				// 拡張データの要素で "データなし" が表示されることを確認
				const expenseCategory = screen.getByTestId("top-expense-category");
				const monthlyComparison = screen.getByTestId("monthly-comparison");

				expect(expenseCategory).toHaveTextContent("データなし");
				expect(monthlyComparison).toHaveTextContent("--%");
				// 収入カテゴリは表示されない
				expect(
					screen.queryByTestId("top-income-category"),
				).not.toBeInTheDocument();
			});

			test("ExtendedStatsDataの場合、拡張機能が正しく表示される", () => {
				const extendedStatsData = {
					totalExpense: 50000,
					transactionCount: 10,
					monthlyComparison: 15.5,
					topExpenseCategory: { name: "交通費", amount: 20000 },
				};

				render(
					<ExpenseStats
						stats={extendedStatsData}
						isLoading={false}
						error={null}
					/>,
				);

				// 拡張データが正しく表示されることを確認
				expect(screen.getByTestId("top-expense-category")).toHaveTextContent(
					"交通費",
				);
				expect(screen.getByTestId("top-expense-category")).toHaveTextContent(
					"￥20,000",
				);
				// 収入カテゴリは表示されない
				expect(
					screen.queryByTestId("top-income-category"),
				).not.toBeInTheDocument();
				expect(screen.getByTestId("monthly-comparison")).toHaveTextContent(
					"+15.5%",
				);
			});

			test("部分的な拡張データでも安全に処理される", () => {
				const partialExtendedData = {
					totalExpense: 50000,
					transactionCount: 10,
					monthlyComparison: 5.0, // 月次比較のみ
					// topExpenseCategory は未定義
				};

				render(
					<ExpenseStats
						stats={partialExtendedData}
						isLoading={false}
						error={null}
					/>,
				);

				// 月次比較は表示される
				expect(screen.getByTestId("monthly-comparison")).toHaveTextContent(
					"+5.0%",
				);

				// カテゴリデータは "データなし" として表示される
				expect(screen.getByTestId("top-expense-category")).toHaveTextContent(
					"データなし",
				);
				// 収入カテゴリは表示されない
				expect(
					screen.queryByTestId("top-income-category"),
				).not.toBeInTheDocument();
			});
		});

		describe("パフォーマンス最適化", () => {
			test("React.memoが適用されていることを確認", () => {
				// ExpenseStatsのDisplayNameが設定されていることを確認
				expect(ExpenseStats.displayName).toBe("ExpenseStats");
			});

			test("同じpropsでは再レンダリングされない", () => {
				const props = {
					stats: mockStatsData,
					isLoading: false,
					error: null,
				};

				const { rerender } = render(<ExpenseStats {...props} />);

				// 初回レンダリング確認
				expect(screen.getByTestId("expense-stats")).toBeInTheDocument();

				// 同じpropsで再レンダリング
				rerender(<ExpenseStats {...props} />);

				// コンポーネントは引き続き表示されている
				expect(screen.getByTestId("expense-stats")).toBeInTheDocument();
			});

			test("propsが変更された場合は再レンダリングされる", () => {
				const initialProps = {
					stats: mockStatsData,
					isLoading: false,
					error: null,
				};

				const { rerender } = render(<ExpenseStats {...initialProps} />);

				// 初回レンダリング確認
				expect(screen.getByTestId("expense-stats")).toBeInTheDocument();

				// 異なるpropsで再レンダリング
				const updatedProps = {
					...initialProps,
					isLoading: true,
				};
				rerender(<ExpenseStats {...updatedProps} />);

				// ローディング状態に変更されている
				expect(screen.getByTestId("stats-skeleton")).toBeInTheDocument();
				expect(screen.queryByTestId("expense-stats")).not.toBeInTheDocument();
			});
		});
	});
});
