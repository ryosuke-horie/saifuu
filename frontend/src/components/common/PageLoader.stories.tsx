import type { Meta, StoryObj } from "@storybook/react";
import { PageLoader } from "./PageLoader";

const meta: Meta<typeof PageLoader> = {
	title: "Components/Common/PageLoader",
	component: PageLoader,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component: `
ページローディング時に表示するコンポーネントです。

**主な機能:**
- 中央配置されたスピナーアニメーション
- カスタマイズ可能なローディングメッセージ
- アクセシビリティ対応（role="status", aria-live="polite"）
- 適切な最小高さの設定

**使用場面:**
- ページの初期読み込み時
- データ取得中の待機画面
- 長時間処理の進行表示
        `,
			},
		},
	},
	argTypes: {
		message: {
			control: { type: "text" },
			description: "ローディング時に表示するメッセージ",
			defaultValue: "読み込み中...",
		},
	},
	args: {},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * デフォルトの表示状態
 * デフォルトメッセージ「読み込み中...」で表示されます
 */
export const Default: Story = {};

/**
 * カスタムメッセージ
 * 任意のメッセージを指定して表示できます
 */
export const CustomMessage: Story = {
	args: {
		message: "データを取得しています...",
	},
};

/**
 * 長いメッセージ
 * 長いメッセージでも適切に表示されることを確認
 */
export const LongMessage: Story = {
	args: {
		message: "大量のデータを処理しています。しばらくお待ちください。",
	},
};

/**
 * 英語メッセージ
 * 英語などの他言語でも適切に表示されることを確認
 */
export const EnglishMessage: Story = {
	args: {
		message: "Loading...",
	},
};

/**
 * API取得中のメッセージ例
 * 実際の使用例として、API取得中のメッセージパターン
 */
export const ApiLoading: Story = {
	args: {
		message: "取引データを取得中...",
	},
};

/**
 * レポート生成中のメッセージ例
 * 実際の使用例として、レポート生成中のメッセージパターン
 */
export const ReportGenerating: Story = {
	args: {
		message: "レポートを生成しています...",
	},
};
