/**
 * NewExpenseButtonコンポーネントのStorybook
 * 
 * 関連Issue: #93 支出管理メインページ実装
 */

import type { Meta, StoryObj } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import { NewExpenseButton } from "./NewExpenseButton";

const meta: Meta<typeof NewExpenseButton> = {
	title: "Components/Expenses/NewExpenseButton",
	component: NewExpenseButton,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component: `
新規支出登録ボタンコンポーネント

支出管理画面で新規登録を開始するためのボタンです。
視認性の高いプライマリボタンデザインで、アクセシビリティに配慮した実装となっています。

### 機能
- クリックイベントのハンドリング
- disabled状態の制御
- カスタムスタイルの適用
- アクセシビリティ対応（aria-label）

### 使用例
\`\`\`tsx
<NewExpenseButton onClick={handleNewClick} />
\`\`\`
				`,
			},
		},
	},
	argTypes: {
		onClick: {
			description: "ボタンクリック時のコールバック関数",
			action: "clicked",
		},
		disabled: {
			description: "ボタンの無効化状態",
			control: { type: "boolean" },
			defaultValue: false,
		},
		className: {
			description: "追加のCSSクラス",
			control: { type: "text" },
		},
	},
	args: {
		disabled: false,
		className: "",
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * デフォルト状態
 * 通常の有効なボタン
 */
export const Default: Story = {
	args: {
		onClick: action("onClick"),
	},
};

/**
 * 無効化状態
 * 処理中や権限がない場合などに使用
 */
export const Disabled: Story = {
	args: {
		onClick: action("onClick"),
		disabled: true,
	},
	parameters: {
		docs: {
			description: {
				story: "ボタンが無効化された状態。opacity-50とcursor-not-allowedが適用されます。",
			},
		},
	},
};

/**
 * カスタムスタイル適用
 * 追加のスタイルクラスを適用した例
 */
export const WithCustomStyle: Story = {
	args: {
		onClick: action("onClick"),
		className: "shadow-lg scale-110",
	},
	parameters: {
		docs: {
			description: {
				story: "カスタムクラスを追加してスタイルをカスタマイズした例。",
			},
		},
	},
};

/**
 * ホバー状態
 * マウスオーバー時の状態
 */
export const Hover: Story = {
	args: {
		onClick: action("onClick"),
	},
	parameters: {
		pseudo: { hover: true },
		docs: {
			description: {
				story: "ホバー時の状態。背景色がbg-blue-700に変化します。",
			},
		},
	},
};

/**
 * フォーカス状態
 * キーボード操作時のフォーカス状態
 */
export const Focus: Story = {
	args: {
		onClick: action("onClick"),
	},
	parameters: {
		pseudo: { focus: true },
		docs: {
			description: {
				story: "フォーカス時の状態。focus:ring-2とfocus:ring-blue-500が適用されます。",
			},
		},
	},
};

/**
 * 複数ボタンの配置例
 * 実際の使用シーンを想定した配置
 */
export const InContext: Story = {
	render: () => (
		<div className="space-y-4">
			<div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
				<h2 className="text-lg font-semibold">支出・収入管理</h2>
				<NewExpenseButton onClick={action("onClick")} />
			</div>
			<div className="flex gap-2 p-4 bg-gray-50 rounded-lg">
				<NewExpenseButton onClick={action("onClick")} />
				<button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
					エクスポート
				</button>
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "実際のUIでの使用例。ヘッダーやツールバーでの配置パターンを示しています。",
			},
		},
	},
};

/**
 * レスポンシブ対応
 * 様々な画面サイズでの表示
 */
export const Responsive: Story = {
	render: () => (
		<div className="space-y-4">
			<div className="text-sm text-gray-600 mb-2">Mobile (320px)</div>
			<div className="w-80 p-4 bg-gray-50 rounded-lg">
				<NewExpenseButton onClick={action("onClick")} className="w-full" />
			</div>
			<div className="text-sm text-gray-600 mb-2 mt-4">Desktop</div>
			<div className="p-4 bg-gray-50 rounded-lg">
				<NewExpenseButton onClick={action("onClick")} />
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "モバイルでは全幅、デスクトップでは固定幅で表示する例。",
			},
		},
	},
};

/**
 * インタラクションテスト
 * ユーザー操作のシミュレーション
 */
export const InteractionTest: Story = {
	args: {
		onClick: action("onClick"),
	},
	play: async ({ canvasElement, args }) => {
		const { userEvent, within, expect } = await import("@storybook/test");
		
		const canvas = within(canvasElement);
		const button = canvas.getByRole("button", { name: "新しい支出を登録" });
		
		// ボタンが表示されていることを確認
		await expect(button).toBeInTheDocument();
		await expect(button).toHaveTextContent("新規登録");
		
		// クリックイベントのテスト
		await userEvent.click(button);
		await expect(args.onClick).toHaveBeenCalledTimes(1);
	},
};