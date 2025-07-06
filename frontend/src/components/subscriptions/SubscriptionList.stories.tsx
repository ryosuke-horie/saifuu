import { action } from "@storybook/addon-actions";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { mockSubscriptions } from "../../../.storybook/mocks/data/subscriptions";
import { SubscriptionList } from "./SubscriptionList";

/**
 * SubscriptionListコンポーネントのStorybookストーリー
 *
 * サブスクリプション一覧コンポーネントの各種状態を確認できるストーリー集
 *
 * ストーリー内容:
 * - Default: 通常の一覧表示
 * - Loading: ローディング状態
 * - ErrorState: エラー状態
 * - Empty: 空状態
 * - SingleItem: 単一アイテム
 * - ManyItems: 多数アイテム
 * - WithCustomClass: カスタムクラス適用
 * - Mobile/Tablet/Desktop: レスポンシブテスト
 * - Interactive: 包括的インタラクションテスト
 * - RefreshButtonLoading: リフレッシュボタンローディング状態
 * - RefreshEmptyState: 空状態でのリフレッシュテスト
 * - RefreshErrorState: エラー状態でのリフレッシュテスト
 * - WithoutRefreshButton: リフレッシュボタンなしのテスト
 * - KeyboardNavigation: キーボードナビゲーションテスト
 */

const meta: Meta<typeof SubscriptionList> = {
	title: "Components/Subscriptions/SubscriptionList",
	component: SubscriptionList,
	parameters: {
		layout: "padded",
		docs: {
			description: {
				component: `
## SubscriptionListコンポーネント

サブスクリプションデータをテーブル形式で表示するコンポーネントです。

### 特徴
- **レスポンシブ**: モバイル、タブレット、デスクトップに対応
- **状態管理**: ローディング、エラー、空状態の表示
- **アクセシブル**: セマンティックHTMLとARIA属性
- **データフォーマット**: 通貨、日付、カテゴリの適切な表示

### 技術仕様
- テーブル形式での一覧表示
- レスポンシブ対応（モバイルでは一部カラム非表示）
- ローディング・エラー・空状態の適切な表示
- 日本語ローカライゼーション対応
				`,
			},
		},
	},
	argTypes: {
		subscriptions: {
			description: "サブスクリプションデータの配列",
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
		onRefresh: {
			description: "データ再取得用のコールバック",
			action: "refresh-clicked",
		},
		className: {
			description: "追加のCSSクラス名",
			control: { type: "text" },
		},
	},
	args: {
		subscriptions: mockSubscriptions,
		isLoading: false,
		error: null,
		onRefresh: action("refresh-clicked"),
		className: "",
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * デフォルト状態
 *
 * 通常のサブスクリプション一覧表示
 */
export const Default: Story = {};

/**
 * ローディング状態
 *
 * データ読み込み中の表示状態
 */
export const Loading: Story = {
	args: {
		subscriptions: [],
		isLoading: true,
	},
	parameters: {
		docs: {
			description: {
				story:
					"データの読み込み中に表示される状態です。スピナーとローディングメッセージが表示されます。",
			},
		},
	},
};

/**
 * エラー状態
 *
 * データ取得エラー時の表示状態
 */
export const ErrorState: Story = {
	args: {
		subscriptions: [],
		isLoading: false,
		error: "サブスクリプションデータの取得に失敗しました",
	},
	parameters: {
		docs: {
			description: {
				story:
					"データ取得でエラーが発生した際に表示される状態です。エラーメッセージが表示されます。",
			},
		},
	},
};

/**
 * 空状態
 *
 * サブスクリプションが登録されていない状態
 */
export const Empty: Story = {
	args: {
		subscriptions: [],
		isLoading: false,
		error: null,
	},
	parameters: {
		docs: {
			description: {
				story:
					"サブスクリプションが登録されていない状態です。新規登録を促すメッセージが表示されます。",
			},
		},
	},
};

/**
 * 単一アイテム
 *
 * サブスクリプションが1つだけ登録されている状態
 */
export const SingleItem: Story = {
	args: {
		subscriptions: [mockSubscriptions[0]],
	},
	parameters: {
		docs: {
			description: {
				story: "サブスクリプションが1つだけ登録されている状態です。",
			},
		},
	},
};

/**
 * 多数アイテム
 *
 * 多くのサブスクリプションが登録されている状態
 */
export const ManyItems: Story = {
	args: {
		subscriptions: [
			...mockSubscriptions,
			{
				id: "4",
				name: "Amazon Prime",
				amount: 500,
				billingCycle: "monthly" as const,
				nextBillingDate: "2025-07-20",
				category: "entertainment",
			},
			{
				id: "5",
				name: "Microsoft 365",
				amount: 1284,
				billingCycle: "monthly" as const,
				nextBillingDate: "2025-07-25",
				category: "work",
			},
			{
				id: "6",
				name: "Figma",
				amount: 1500,
				billingCycle: "monthly" as const,
				nextBillingDate: "2025-07-30",
				category: "work",
			},
		],
	},
	parameters: {
		docs: {
			description: {
				story:
					"多数のサブスクリプションが登録されている状態です。スクロール表示の確認ができます。",
			},
		},
	},
};

/**
 * カスタムクラス
 *
 * 追加のCSSクラスを適用した状態
 */
export const WithCustomClass: Story = {
	args: {
		className: "border-2 border-blue-200",
	},
	parameters: {
		docs: {
			description: {
				story:
					"カスタムCSSクラスを適用した例です。ここでは青いボーダーを追加しています。",
			},
		},
	},
};

/**
 * モバイル表示
 *
 * モバイルデバイスでの表示確認
 */
export const Mobile: Story = {
	parameters: {
		viewport: {
			defaultViewport: "mobile1",
		},
		docs: {
			description: {
				story:
					"モバイルデバイスでの表示です。一部のカラムが非表示になり、見やすさを保ちます。",
			},
		},
	},
};

/**
 * タブレット表示
 *
 * タブレットデバイスでの表示確認
 */
export const Tablet: Story = {
	parameters: {
		viewport: {
			defaultViewport: "tablet",
		},
		docs: {
			description: {
				story:
					"タブレットデバイスでの表示です。中程度の画面サイズに最適化されています。",
			},
		},
	},
};

/**
 * デスクトップ表示
 *
 * デスクトップでの表示確認
 */
export const Desktop: Story = {
	parameters: {
		viewport: {
			defaultViewport: "desktop",
		},
		docs: {
			description: {
				story:
					"デスクトップでの表示です。全てのカラムが表示され、最も詳細な情報を確認できます。",
			},
		},
	},
};

/**
 * 包括的インタラクションテスト
 *
 * SubscriptionListコンポーネントの主要な機能を包括的にテストする
 */
export const Interactive: Story = {
	parameters: {
		docs: {
			description: {
				story: `
このストーリーは、SubscriptionListコンポーネントの主要な機能を包括的にテストします：

- **リフレッシュボタン**: クリック動作とコールバック検証
- **行のホバー効果**: 視覚的フィードバックの確認
- **レスポンシブ動作**: ブレークポイントでの列の表示・非表示
- **テーブルナビゲーション**: キーボードナビゲーションとアクセシビリティ
- **ローディング状態**: ローディング中の表示とボタンの無効化
				`,
			},
		},
	},
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);

		// 1. リフレッシュボタンのテスト
		// リフレッシュボタンが存在することを確認
		const refreshButton = canvas.getByRole("button", { name: "更新" });
		await expect(refreshButton).toBeInTheDocument();
		await expect(refreshButton).toBeEnabled();

		// リフレッシュボタンをクリック
		await userEvent.click(refreshButton);

		// onRefreshコールバックが呼ばれることを確認
		await expect(args.onRefresh).toHaveBeenCalledTimes(1);

		// 2. テーブルの基本構造確認
		// テーブルのヘッダー確認
		await expect(canvas.getByText("サービス名")).toBeInTheDocument();
		await expect(canvas.getByText("料金")).toBeInTheDocument();
		await expect(canvas.getByText("次回請求日")).toBeInTheDocument();

		// 3. データ行の確認
		// Netflix行の確認
		await expect(canvas.getByText("Netflix")).toBeInTheDocument();
		await expect(canvas.getByText("¥1,480")).toBeInTheDocument();
		await expect(canvas.getByText("2025/07/01")).toBeInTheDocument();

		// Spotify行の確認
		await expect(canvas.getByText("Spotify")).toBeInTheDocument();
		await expect(canvas.getByText("¥980")).toBeInTheDocument();
		await expect(canvas.getByText("2025/07/15")).toBeInTheDocument();

		// Adobe Creative Suite行の確認
		await expect(canvas.getByText("Adobe Creative Suite")).toBeInTheDocument();
		await expect(canvas.getByText("¥5,680")).toBeInTheDocument();
		await expect(canvas.getByText("2025/07/10")).toBeInTheDocument();

		// 4. テーブルのアクセシビリティ確認
		// テーブル要素の存在確認
		const table = canvas.getByRole("table");
		await expect(table).toBeInTheDocument();

		// テーブルヘッダーの確認
		const columnHeaders = canvas.getAllByRole("columnheader");
		await expect(columnHeaders).toHaveLength(5); // 5つのカラム

		// 5. 行のホバー効果テスト（CSSクラスの確認）
		// 最初の行を取得
		const firstRow = canvas.getByText("Netflix").closest("tr");
		await expect(firstRow).toHaveClass("hover:bg-gray-50");
		await expect(firstRow).toHaveClass("transition-colors");

		// 6. レスポンシブ動作の確認
		// 請求サイクル列がsm:table-cellクラスを持つことを確認
		const billingCycleHeader = canvas.getByText("請求サイクル");
		await expect(billingCycleHeader).toHaveClass("hidden", "sm:table-cell");

		// カテゴリ列がmd:table-cellクラスを持つことを確認
		const categoryHeader = canvas.getByText("カテゴリ");
		await expect(categoryHeader).toHaveClass("hidden", "md:table-cell");
	},
};

/**
 * リフレッシュボタンローディング状態テスト
 *
 * ローディング中のリフレッシュボタンの動作確認
 */
export const RefreshButtonLoading: Story = {
	args: {
		isLoading: true,
		onRefresh: action("refresh-clicked"),
	},
	parameters: {
		docs: {
			description: {
				story:
					"ローディング中のリフレッシュボタンの状態を確認します。ボタンが無効化され、スピナーが表示されます。",
			},
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// リフレッシュボタンが無効化されていることを確認
		const refreshButton = canvas.getByRole("button", { name: "更新" });
		await expect(refreshButton).toBeInTheDocument();
		await expect(refreshButton).toBeDisabled();

		// スピナーが表示されることを確認
		const spinner = canvas
			.getByRole("button", { name: "更新" })
			.querySelector(".animate-spin");
		await expect(spinner).toBeInTheDocument();

		// ローディング状態の表示確認
		await expect(canvas.getByText("読み込み中...")).toBeInTheDocument();
	},
};

/**
 * 空状態でのリフレッシュテスト
 *
 * 空状態でのリフレッシュボタンの動作確認
 */
export const RefreshEmptyState: Story = {
	args: {
		subscriptions: [],
		isLoading: false,
		error: null,
		onRefresh: action("refresh-clicked"),
	},
	parameters: {
		docs: {
			description: {
				story:
					"空状態でのリフレッシュボタンの動作を確認します。データが空でもリフレッシュボタンは機能します。",
			},
		},
	},
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);

		// 空状態の表示確認
		await expect(
			canvas.getByText("登録されているサブスクリプションがありません"),
		).toBeInTheDocument();

		// リフレッシュボタンが利用可能であることを確認
		const refreshButton = canvas.getByRole("button", { name: "更新" });
		await expect(refreshButton).toBeInTheDocument();
		await expect(refreshButton).toBeEnabled();

		// リフレッシュボタンをクリック
		await userEvent.click(refreshButton);

		// onRefreshコールバックが呼ばれることを確認
		await expect(args.onRefresh).toHaveBeenCalledTimes(1);
	},
};

/**
 * エラー状態でのリフレッシュテスト
 *
 * エラー状態でのリフレッシュボタンの動作確認
 */
export const RefreshErrorState: Story = {
	args: {
		subscriptions: [],
		isLoading: false,
		error: "データの取得に失敗しました",
		onRefresh: action("refresh-clicked"),
	},
	parameters: {
		docs: {
			description: {
				story:
					"エラー状態でのリフレッシュボタンの動作を確認します。エラーが発生してもリフレッシュボタンは機能します。",
			},
		},
	},
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);

		// エラー状態の表示確認
		await expect(
			canvas.getByText("エラー: データの取得に失敗しました"),
		).toBeInTheDocument();

		// リフレッシュボタンが利用可能であることを確認
		const refreshButton = canvas.getByRole("button", { name: "更新" });
		await expect(refreshButton).toBeInTheDocument();
		await expect(refreshButton).toBeEnabled();

		// リフレッシュボタンをクリック
		await userEvent.click(refreshButton);

		// onRefreshコールバックが呼ばれることを確認
		await expect(args.onRefresh).toHaveBeenCalledTimes(1);
	},
};

/**
 * リフレッシュボタンなしのテスト
 *
 * onRefreshが提供されていない場合の動作確認
 */
export const WithoutRefreshButton: Story = {
	args: {
		onRefresh: undefined,
	},
	parameters: {
		docs: {
			description: {
				story:
					"onRefreshコールバックが提供されていない場合、リフレッシュボタンは表示されません。",
			},
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// リフレッシュボタンが存在しないことを確認
		const refreshButton = canvas.queryByRole("button", { name: "更新" });
		await expect(refreshButton).not.toBeInTheDocument();

		// テーブルヘッダーは表示されることを確認
		await expect(
			canvas.getByText("サブスクリプション一覧"),
		).toBeInTheDocument();
	},
};

/**
 * キーボードナビゲーションテスト
 *
 * テーブルのキーボードナビゲーション機能の確認
 */
export const KeyboardNavigation: Story = {
	parameters: {
		docs: {
			description: {
				story:
					"キーボードナビゲーションの動作を確認します。Tabキーでフォーカス移動、Enterキーでの操作が正しく動作することを確認します。",
			},
		},
	},
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);

		// リフレッシュボタンにフォーカスを移動
		const refreshButton = canvas.getByRole("button", { name: "更新" });
		await userEvent.tab();

		// リフレッシュボタンがフォーカスされることを確認
		await expect(refreshButton).toHaveFocus();

		// Enterキーでリフレッシュボタンを押す
		await userEvent.keyboard("{Enter}");

		// onRefreshコールバックが呼ばれることを確認
		await expect(args.onRefresh).toHaveBeenCalledTimes(1);
	},
};
