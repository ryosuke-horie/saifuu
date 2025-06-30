import type { Meta, StoryObj } from "@storybook/react";
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
