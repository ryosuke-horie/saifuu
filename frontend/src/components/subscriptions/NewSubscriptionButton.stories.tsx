import type { Meta, StoryObj } from "@storybook/react";
import { NewSubscriptionButton } from "./NewSubscriptionButton";

/**
 * NewSubscriptionButtonコンポーネントのStorybookストーリー
 *
 * 新規サブスクリプション登録ボタンの主要な状態を確認
 */

const meta: Meta<typeof NewSubscriptionButton> = {
	title: "Components/Subscriptions/NewSubscriptionButton",
	component: NewSubscriptionButton,
	parameters: {
		layout: "centered",
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
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * デフォルト状態
 */
export const Default: Story = {};

/**
 * 無効状態
 */
export const Disabled: Story = {
	args: {
		disabled: true,
	},
};

/**
 * カスタムクリックハンドラー
 */
export const WithCustomClick: Story = {
	args: {
		onClick: () => {
			console.log("新規登録ボタンがクリックされました");
		},
	},
};

/**
 * インタラクティブ
 *
 * クリック動作を手動で確認
 */
export const Interactive: Story = {
	args: {
		onClick: () => {
			alert("新規登録ダイアログを開きます");
		},
	},
};
