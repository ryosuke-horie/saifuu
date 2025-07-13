import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { mockTransactions } from "../../../.storybook/mocks/data/transactions";
import type { Transaction } from "../../lib/api/types";
import { ExpenseList } from "./ExpenseList";

/**
 * ExpenseListコンポーネントのStorybookストーリー
 *
 * 支出・収入一覧コンポーネントの各種状態を確認できるストーリー集
 *
 * ストーリー内容:
 * - Default: 通常の一覧表示
 * - Loading: ローディング状態
 * - Error: エラー状態
 * - Empty: 空状態
 * - SingleItem: 単一アイテム
 * - ManyItems: 多数アイテム
 * - WithInteractions: 編集・削除機能付き
 * - Mobile/Tablet/Desktop: レスポンシブテスト
 */

const meta: Meta<typeof ExpenseList> = {
	title: "Components/Expenses/ExpenseList",
	component: ExpenseList,
	parameters: {
		layout: "padded",
		docs: {
			description: {
				component: `
## ExpenseListコンポーネント

支出・収入データをテーブル形式で表示するコンポーネントです。

### 特徴
- **収入/支出の明確な区別**: 収入は緑色の+表示、支出は赤色の-表示
- **日付降順ソート**: 新しい取引から順に表示
- **編集・削除機能**: 各取引に対する操作ボタン
- **レスポンシブ**: モバイル、タブレット、デスクトップに対応
- **状態管理**: ローディング、エラー、空状態の表示
- **アクセシブル**: セマンティックHTMLとARIA属性

### 技術仕様
- テーブル形式での一覧表示
- 日本語ローカライゼーション対応
- 通貨フォーマット（日本円）
- 日付フォーマット（YYYY/MM/DD）
- カテゴリ情報の表示
				`,
			},
		},
	},
	argTypes: {
		transactions: {
			description: "取引データの配列",
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
		onEdit: {
			description: "編集ボタンのコールバック",
			action: "edit",
		},
		onDelete: {
			description: "削除ボタンのコールバック",
			action: "delete",
		},
		className: {
			description: "追加のCSSクラス名",
			control: { type: "text" },
		},
	},
	args: {
		transactions: mockTransactions,
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
 * 通常の取引一覧表示
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
		transactions: [],
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
		transactions: [],
		isLoading: false,
		error: "取引データの取得に失敗しました",
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
 * 取引が登録されていない状態
 */
export const Empty: Story = {
	args: {
		transactions: [],
		isLoading: false,
		error: null,
	},
	parameters: {
		docs: {
			description: {
				story:
					"取引が登録されていない状態です。新規登録を促すメッセージが表示されます。",
			},
		},
		chromatic: { viewports: [375, 768, 1200] },
	},
};

/**
 * 単一アイテム
 *
 * 取引が1つだけ登録されている状態
 */
export const SingleItem: Story = {
	args: {
		transactions: [mockTransactions[0]],
	},
	parameters: {
		docs: {
			description: {
				story: "取引が1つだけ登録されている状態です。",
			},
		},
	},
};

/**
 * 収入のみ
 *
 * 収入取引のみが表示されている状態
 */
export const IncomeOnly: Story = {
	args: {
		transactions: mockTransactions.filter((txn) => txn.type === "income"),
	},
	parameters: {
		docs: {
			description: {
				story:
					"収入取引のみが表示されている状態です。金額が緑色で+表示されます。",
			},
		},
	},
};

/**
 * 支出のみ
 *
 * 支出取引のみが表示されている状態
 */
export const ExpenseOnly: Story = {
	args: {
		transactions: mockTransactions.filter((txn) => txn.type === "expense"),
	},
	parameters: {
		docs: {
			description: {
				story:
					"支出取引のみが表示されている状態です。金額が赤色で-表示されます。",
			},
		},
	},
};

/**
 * 多数アイテム
 *
 * 多くの取引が登録されている状態
 */
export const ManyItems: Story = {
	args: {
		transactions: [
			...mockTransactions,
			{
				id: "txn-6",
				amount: 3000,
				type: "expense",
				description: "カフェ代",
				date: "2025-07-04",
				category: null,
				createdAt: "2025-07-04T15:30:00Z",
				updatedAt: "2025-07-04T15:30:00Z",
			},
			{
				id: "txn-7",
				amount: 120000,
				type: "income",
				description: "副業収入",
				date: "2025-07-03",
				category: null,
				createdAt: "2025-07-03T10:00:00Z",
				updatedAt: "2025-07-03T10:00:00Z",
			},
			{
				id: "txn-8",
				amount: 5000,
				type: "expense",
				description: "ガソリン代",
				date: "2025-07-02",
				category: null,
				createdAt: "2025-07-02T08:45:00Z",
				updatedAt: "2025-07-02T08:45:00Z",
			},
		],
	},
	parameters: {
		docs: {
			description: {
				story:
					"多数の取引が登録されている状態です。スクロール表示と日付降順ソートの確認ができます。",
			},
		},
		chromatic: { viewports: [375, 768, 1200] },
	},
};

/**
 * インタラクション機能付き
 *
 * 編集・削除機能が有効な状態
 */
export const WithInteractions: Story = {
	args: {
		onEdit: (transaction: Transaction) => console.log("編集:", transaction),
		onDelete: (transactionId: string) => console.log("削除:", transactionId),
	},
	parameters: {
		docs: {
			description: {
				story:
					"編集・削除ボタンが有効な状態です。各ボタンのクリック時にコールバックが実行されます。",
			},
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// 更新ボタンのクリックテスト
		const refreshButton = canvas.getByText("更新");
		await userEvent.click(refreshButton);

		// 編集ボタンのクリックテスト
		const editButtons = canvas.getAllByText("編集");
		if (editButtons.length > 0) {
			await userEvent.click(editButtons[0]);
		}

		// 削除ボタンのクリックテスト
		const deleteButtons = canvas.getAllByText("削除");
		if (deleteButtons.length > 0) {
			await userEvent.click(deleteButtons[0]);
		}
	},
};

/**
 * カスタムクラス
 *
 * 追加のCSSクラスを適用した状態
 */
export const WithCustomClass: Story = {
	args: {
		className: "border-2 border-green-200 bg-green-50",
	},
	parameters: {
		docs: {
			description: {
				story:
					"カスタムCSSクラスを適用した例です。ここでは緑色のボーダーと背景色を追加しています。",
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
					"モバイルデバイスでの表示です。カテゴリと説明のカラムが非表示になり、見やすさを保ちます。",
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
					"タブレットデバイスでの表示です。説明カラムが表示され、中程度の画面サイズに最適化されています。",
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

/**
 * アクセシビリティテスト
 *
 * キーボードナビゲーションとスクリーンリーダー対応の確認
 */
export const AccessibilityTest: Story = {
	parameters: {
		docs: {
			description: {
				story:
					"アクセシビリティの確認用ストーリーです。キーボードナビゲーションとスクリーンリーダー対応を確認できます。",
			},
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// テーブル要素の確認
		const table = canvas.getByRole("table");
		expect(table).toBeInTheDocument();

		// ヘッダー要素の確認
		const columnHeaders = canvas.getAllByRole("columnheader");
		expect(columnHeaders).toHaveLength(5);

		// ボタン要素の確認
		const buttons = canvas.getAllByRole("button");
		expect(buttons.length).toBeGreaterThan(0);
	},
};
