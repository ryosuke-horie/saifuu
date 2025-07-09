import type { Meta, StoryObj } from "@storybook/react";
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
 * - Error: エラー状態
 * - Empty: 空状態
 * - SingleItem: 単一アイテム
 * - ManyItems: 多数アイテム
 * - Mobile/Tablet/Desktop: レスポンシブテスト
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
		className: {
			description: "追加のCSSクラス名",
			control: { type: "text" },
		},
	},
	args: {
		subscriptions: mockSubscriptions,
		isLoading: false,
		error: null,
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
export const Default: Story = {
	parameters: {
		chromatic: { viewports: [1200] },
	},
};

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
		chromatic: { viewports: [375, 768, 1200] },
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
		chromatic: { viewports: [375, 768, 1200] },
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
		chromatic: { viewports: [375, 768, 1200] },
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
		chromatic: { viewports: [375, 768, 1200] },
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
		chromatic: { viewports: [375] },
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
		chromatic: { viewports: [768] },
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
		chromatic: { viewports: [1200] },
	},
};
