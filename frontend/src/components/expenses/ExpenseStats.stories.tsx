/**
 * ExpenseStats コンポーネントのStorybook ストーリー
 * 
 * 統計表示コンポーネントの各状態とバリエーションを定義
 * - Default: 通常の統計データ表示
 * - Loading: ローディング状態
 * - Error: エラー状態
 * - Empty: 空データ状態
 * - レスポンシブ対応の確認
 */

import type { Meta, StoryObj } from "@storybook/react";
import { within, expect, userEvent } from "@storybook/test";
import { ExpenseStats } from "./ExpenseStats";

const meta: Meta<typeof ExpenseStats> = {
	title: "Components/Expenses/ExpenseStats",
	component: ExpenseStats,
	parameters: {
		layout: "padded",
		docs: {
			description: {
				component: `
支出統計コンポーネント：月間収支、主要カテゴリ、期間比較などの統計情報を表示します。

## 主な機能
- 月間収支の表示（収入・支出・差額）
- 主要カテゴリの表示（最大支出・最大収入）
- 期間比較（前月比）
- ローディング・エラー・空状態の適切な表示
- レスポンシブデザイン対応

## 使用場面
- 支出管理画面のダッシュボード
- 月次レポート画面
- 統計分析画面
				`,
			},
		},
	},
	argTypes: {
		stats: {
			description: "統計データオブジェクト",
			control: { type: "object" },
		},
		isLoading: {
			description: "ローディング状態",
			control: { type: "boolean" },
		},
		error: {
			description: "エラーメッセージ",
			control: { type: "text" },
		},
		className: {
			description: "カスタムCSSクラス",
			control: { type: "text" },
		},
		onRefresh: {
			description: "リフレッシュボタンクリック時のハンドラー",
			action: "refreshed",
		},
		onRetry: {
			description: "リトライボタンクリック時のハンドラー",
			action: "retried",
		},
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

// デフォルトの統計データ
const defaultStatsData = {
	totalIncome: 320000,
	totalExpense: 180000,
	balance: 140000,
	transactionCount: 28,
	monthlyComparison: 15.3,
	topExpenseCategory: { name: "食費", amount: 65000 },
	topIncomeCategory: { name: "給与", amount: 280000 }
};

// 空の統計データ
const emptyStatsData = {
	totalIncome: 0,
	totalExpense: 0,
	balance: 0,
	transactionCount: 0,
	monthlyComparison: 0,
	topExpenseCategory: null,
	topIncomeCategory: null
};

// 負の収支統計データ
const negativeBalanceStatsData = {
	totalIncome: 180000,
	totalExpense: 250000,
	balance: -70000,
	transactionCount: 35,
	monthlyComparison: -23.5,
	topExpenseCategory: { name: "家賃", amount: 80000 },
	topIncomeCategory: { name: "給与", amount: 180000 }
};

// 大きな金額の統計データ
const largeAmountStatsData = {
	totalIncome: 12345678,
	totalExpense: 9876543,
	balance: 2469135,
	transactionCount: 156,
	monthlyComparison: 45.8,
	topExpenseCategory: { name: "住宅ローン", amount: 3500000 },
	topIncomeCategory: { name: "賞与", amount: 5000000 }
};

/**
 * デフォルト状態
 * 通常の統計データが表示された状態
 */
export const Default: Story = {
	args: {
		stats: defaultStatsData,
		isLoading: false,
		error: null,
	},
};

/**
 * ローディング状態
 * データ取得中の表示状態
 */
export const Loading: Story = {
	args: {
		stats: null,
		isLoading: true,
		error: null,
	},
};

/**
 * エラー状態
 * データ取得失敗時の表示状態
 */
export const Error: Story = {
	args: {
		stats: null,
		isLoading: false,
		error: "統計データの取得に失敗しました。ネットワーク接続を確認してください。",
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		
		// エラー表示の確認
		await expect(canvas.getByTestId("stats-error")).toBeInTheDocument();
		await expect(canvas.getByText("エラー")).toBeInTheDocument();
		
		// リトライボタンの存在確認
		const retryButton = canvas.getByTestId("stats-retry-button");
		await expect(retryButton).toBeInTheDocument();
		await expect(retryButton).toBeEnabled();
	},
};

/**
 * 空データ状態
 * 取引データが存在しない場合の表示状態
 */
export const Empty: Story = {
	args: {
		stats: emptyStatsData,
		isLoading: false,
		error: null,
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		
		// 空状態メッセージの確認
		await expect(canvas.getByTestId("stats-empty")).toBeInTheDocument();
		await expect(canvas.getByText("データがありません")).toBeInTheDocument();
		
		// ゼロ金額の表示確認
		await expect(canvas.getByTestId("total-income")).toHaveTextContent("¥0");
		await expect(canvas.getByTestId("total-expense")).toHaveTextContent("¥0");
		await expect(canvas.getByTestId("balance-amount")).toHaveTextContent("¥0");
	},
};

/**
 * 負の収支状態
 * 支出が収入を上回っている場合の表示状態
 */
export const NegativeBalance: Story = {
	args: {
		stats: negativeBalanceStatsData,
		isLoading: false,
		error: null,
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		
		// 負の収支の表示確認
		const balanceElement = canvas.getByTestId("balance-amount");
		await expect(balanceElement).toHaveTextContent("-¥70,000");
		
		// 前月比マイナス表示の確認
		const comparisonElement = canvas.getByTestId("monthly-comparison");
		await expect(comparisonElement).toHaveTextContent("-23.5%");
	},
};

/**
 * 大きな金額データ
 * 金額が大きい場合の表示確認（カンマ区切りなど）
 */
export const LargeAmounts: Story = {
	args: {
		stats: largeAmountStatsData,
		isLoading: false,
		error: null,
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		
		// 大きな金額のフォーマット確認
		await expect(canvas.getByTestId("total-income")).toHaveTextContent("¥12,345,678");
		await expect(canvas.getByTestId("total-expense")).toHaveTextContent("¥9,876,543");
		await expect(canvas.getByTestId("balance-amount")).toHaveTextContent("¥2,469,135");
	},
};

/**
 * リフレッシュ機能付き
 * リフレッシュボタンが表示される状態
 */
export const WithRefresh: Story = {
	args: {
		stats: defaultStatsData,
		isLoading: false,
		error: null,
		onRefresh: () => console.log("Refresh clicked"),
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();
		
		// リフレッシュボタンの存在確認
		const refreshButton = canvas.getByTestId("stats-refresh-button");
		await expect(refreshButton).toBeInTheDocument();
		
		// ボタンクリックのテスト
		await user.click(refreshButton);
	},
};

/**
 * カスタムスタイル適用
 * classNameプロパティでカスタムスタイルが適用される状態
 */
export const CustomStyle: Story = {
	args: {
		stats: defaultStatsData,
		isLoading: false,
		error: null,
		className: "border-2 border-blue-500 rounded-lg shadow-lg",
	},
};

/**
 * モバイル表示
 * モバイルサイズでの表示確認
 */
export const Mobile: Story = {
	args: {
		stats: defaultStatsData,
		isLoading: false,
		error: null,
	},
	parameters: {
		viewport: {
			defaultViewport: "mobile1",
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		
		// モバイルでも主要な統計が表示されることを確認
		await expect(canvas.getByTestId("expense-stats")).toBeInTheDocument();
		await expect(canvas.getByTestId("monthly-balance-card")).toBeInTheDocument();
		await expect(canvas.getByTestId("top-categories-card")).toBeInTheDocument();
	},
};

/**
 * タブレット表示
 * タブレットサイズでの表示確認
 */
export const Tablet: Story = {
	args: {
		stats: defaultStatsData,
		isLoading: false,
		error: null,
	},
	parameters: {
		viewport: {
			defaultViewport: "tablet",
		},
	},
};

/**
 * ダークモード対応
 * ダークテーマでの表示確認
 */
export const DarkMode: Story = {
	args: {
		stats: defaultStatsData,
		isLoading: false,
		error: null,
	},
	parameters: {
		backgrounds: {
			default: "dark",
		},
	},
};

/**
 * インタラクションテスト
 * ユーザー操作のテストシナリオ
 */
export const InteractionTest: Story = {
	args: {
		stats: null,
		isLoading: false,
		error: "テストエラーメッセージ",
		onRetry: () => console.log("Retry clicked"),
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();
		
		// エラー状態の確認
		await expect(canvas.getByTestId("stats-error")).toBeInTheDocument();
		
		// リトライボタンのクリックテスト
		const retryButton = canvas.getByTestId("stats-retry-button");
		await user.click(retryButton);
		
		// フォーカス状態の確認
		await expect(retryButton).toHaveFocus();
	},
};

/**
 * アクセシビリティテスト
 * キーボードナビゲーションとスクリーンリーダーサポートの確認
 */
export const AccessibilityTest: Story = {
	args: {
		stats: defaultStatsData,
		isLoading: false,
		error: null,
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();
		
		// ARIA属性の確認
		const statsContainer = canvas.getByTestId("expense-stats");
		await expect(statsContainer).toHaveAttribute("aria-label", "支出統計情報");
		
		// キーボードナビゲーションの確認
		const cards = canvas.getAllByRole("region");
		
		// 最初のカードにフォーカス
		if (cards.length > 0) {
			cards[0].focus();
			await expect(cards[0]).toHaveFocus();
			
			// Tabキーでの移動
			await user.tab();
			await expect(cards[1]).toHaveFocus();
		}
	},
};