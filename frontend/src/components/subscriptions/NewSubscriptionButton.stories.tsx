import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "@storybook/test";
import { NewSubscriptionButton } from "./NewSubscriptionButton";

/**
 * NewSubscriptionButtonコンポーネントのStorybookストーリー
 *
 * 新規サブスクリプション登録ボタンの各種状態を確認できるストーリー集
 *
 * ストーリー内容:
 * - Default: 通常のボタン表示
 * - Disabled: 無効状態
 * - WithCustomClick: カスタムクリックハンドラー
 * - WithCustomClass: カスタムクラス適用
 * - Interactive: インタラクションテスト
 */

const meta: Meta<typeof NewSubscriptionButton> = {
	title: "Components/Subscriptions/NewSubscriptionButton",
	component: NewSubscriptionButton,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component: `
## NewSubscriptionButtonコンポーネント

新規サブスクリプション登録を開始するためのボタンコンポーネントです。

### 特徴
- **プライマリボタン**: 視認性の高いボタンデザイン
- **アクセシブル**: 適切なARIA属性とフォーカス管理
- **アイコン付き**: プラスアイコンで機能を明確化
- **状態管理**: 無効状態への対応

### 技術仕様
- 現在はUIのみの実装（機能は開発中）
- カスタムクリックハンドラーの設定可能
- 無効状態の適切な表示
- レスポンシブ対応
				`,
			},
		},
	},
	argTypes: {
		onClick: {
			description: "クリック時のハンドラー関数",
			action: "clicked",
		},
		disabled: {
			description: "ボタンの無効状態",
			control: { type: "boolean" },
		},
		className: {
			description: "追加のCSSクラス名",
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
 *
 * 通常の新規登録ボタン
 */
export const Default: Story = {};

/**
 * 無効状態
 *
 * ボタンが無効化されている状態
 */
export const Disabled: Story = {
	args: {
		disabled: true,
	},
	parameters: {
		docs: {
			description: {
				story:
					"ボタンが無効化されている状態です。透明度が下がり、クリックできなくなります。",
			},
		},
	},
};

/**
 * カスタムクリックハンドラー
 *
 * カスタムクリック処理を設定した状態
 */
export const WithCustomClick: Story = {
	args: {
		onClick: () => {
			alert("カスタムクリック処理が実行されました！");
		},
	},
	parameters: {
		docs: {
			description: {
				story:
					"カスタムクリックハンドラーを設定した例です。クリックすると独自の処理が実行されます。",
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
		className: "w-full text-lg py-3",
	},
	parameters: {
		docs: {
			description: {
				story:
					"カスタムCSSクラスを適用した例です。ここでは幅を100%、文字サイズを大きく、パディングを増やしています。",
			},
		},
		chromatic: {
			delay: 100,
		},
	},
};

/**
 * インタラクションテスト
 *
 * ボタンのクリック動作テスト
 */
export const Interactive: Story = {
	play: async () => {
		// ここでは自動テストは実装せず、手動でのテスト用
		// 実際のテストはJestで行う
	},
	parameters: {
		docs: {
			description: {
				story:
					"ボタンのクリック動作をテストするためのストーリーです。手動でクリックして動作を確認してください。",
			},
		},
	},
};

// Visual Testing: フォーカス状態
export const FocusState: Story = {
	parameters: {
		docs: {
			description: {
				story: "ボタンにフォーカスが当たった状態の視覚テスト",
			},
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const button = canvas.getByRole("button");

		// ボタンにフォーカスを当てる
		button.focus();

		// フォーカスリングが表示されることを確認
		await expect(button).toHaveFocus();
	},
};

// Visual Testing: ホバー状態のシミュレーション
export const HoverState: Story = {
	parameters: {
		docs: {
			description: {
				story: "ボタンのホバー状態をCSSで再現した視覚テスト",
			},
		},
	},
	args: {
		className: "hover:bg-blue-600 hover:scale-105", // ホバー状態をCSSで表現
	},
};

// Visual Testing: 異なるサイズバリエーション
export const SizeVariations: Story = {
	parameters: {
		docs: {
			description: {
				story: "ボタンの異なるサイズバリエーションの比較",
			},
		},
		layout: "padded",
	},
	render: () => (
		<div className="space-y-4">
			<NewSubscriptionButton className="text-sm py-1 px-2" />
			<NewSubscriptionButton />
			<NewSubscriptionButton className="text-lg py-3 px-6" />
			<NewSubscriptionButton className="text-xl py-4 px-8" />
		</div>
	),
};

// Visual Testing: 複数ボタンレイアウト
export const MultipleButtons: Story = {
	parameters: {
		docs: {
			description: {
				story: "複数ボタンが配置された際のレイアウト確認",
			},
		},
		layout: "padded",
	},
	render: () => (
		<div className="flex flex-col sm:flex-row gap-4">
			<NewSubscriptionButton />
			<NewSubscriptionButton disabled />
			<NewSubscriptionButton className="bg-green-500 hover:bg-green-600" />
		</div>
	),
};

// Visual Testing: モバイル特化テスト
export const MobileOptimized: Story = {
	parameters: {
		viewport: {
			defaultViewport: "mobile1",
		},
		docs: {
			description: {
				story: "モバイル画面に最適化されたボタンの表示テスト",
			},
		},
	},
	args: {
		className: "w-full py-4 text-lg", // モバイルに最適化されたサイズ
	},
};

// Visual Testing: アクセシビリティ確認
export const AccessibilityDemo: Story = {
	parameters: {
		docs: {
			description: {
				story: "アクセシビリティ要素の視覚的確認",
			},
		},
	},
	render: () => (
		<div className="space-y-4">
			<div>
				<p className="text-sm text-gray-600 mb-2">
					通常のボタン（aria-label付き）
				</p>
				<NewSubscriptionButton />
			</div>
			<div>
				<p className="text-sm text-gray-600 mb-2">高コントラストモード対応</p>
				<NewSubscriptionButton className="border-2 border-black bg-white text-black hover:bg-gray-100" />
			</div>
			<div>
				<p className="text-sm text-gray-600 mb-2">無効状態（適切な透明度）</p>
				<NewSubscriptionButton disabled />
			</div>
		</div>
	),
};
