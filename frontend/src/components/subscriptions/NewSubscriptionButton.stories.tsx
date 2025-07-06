import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
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
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);

		// ボタンが正しく描画されていることを確認
		const button = canvas.getByRole("button", {
			name: "新しいサブスクリプションを登録",
		});
		await expect(button).toBeInTheDocument();

		// 初期状態でボタンが有効であることを確認
		await expect(button).toBeEnabled();

		// ボタンのテキストが正しく表示されていることを確認
		await expect(canvas.getByText("新規登録")).toBeInTheDocument();

		// プラスアイコンが表示されていることを確認
		const svg = button.querySelector("svg");
		await expect(svg).toBeInTheDocument();

		// ボタンをクリック
		await userEvent.click(button);

		// onClickが呼ばれることを確認
		await expect(args.onClick).toHaveBeenCalled();
	},
	parameters: {
		docs: {
			description: {
				story:
					"ボタンのクリック動作をテストするためのストーリーです。ボタンの描画、クリック動作、onClickコールバックの呼び出しを確認します。",
			},
		},
	},
};

/**
 * キーボードナビゲーションテスト
 *
 * Tab、Enter、Spaceキーでのボタン操作テスト
 */
export const KeyboardNavigation: Story = {
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);

		// ボタンを取得
		const button = canvas.getByRole("button", {
			name: "新しいサブスクリプションを登録",
		});
		await expect(button).toBeInTheDocument();

		// Tabキーでボタンにフォーカス
		await userEvent.tab();
		await expect(button).toHaveFocus();

		// フォーカスリングが適用されていることを確認
		await expect(button).toHaveClass("focus:ring-2");
		await expect(button).toHaveClass("focus:ring-blue-500");

		// Enterキーでボタンを押下
		await userEvent.keyboard("{Enter}");
		await expect(args.onClick).toHaveBeenCalled();

		// Spaceキーでボタンを押下
		await userEvent.keyboard(" ");
		await expect(args.onClick).toHaveBeenCalledTimes(2);

		// Tabキーでフォーカスを外す
		await userEvent.tab();
		await expect(button).not.toHaveFocus();
	},
	parameters: {
		docs: {
			description: {
				story:
					"キーボードナビゲーションをテストするためのストーリーです。Tab、Enter、Spaceキーでのボタン操作とフォーカス管理を確認します。",
			},
		},
	},
};

/**
 * 無効状態のインタラクションテスト
 *
 * 無効状態でのマウスイベント、キーボードイベントの動作テスト
 */
export const DisabledInteraction: Story = {
	args: {
		disabled: true,
	},
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);

		// ボタンが正しく描画されていることを確認
		const button = canvas.getByRole("button", {
			name: "新しいサブスクリプションを登録",
		});
		await expect(button).toBeInTheDocument();

		// ボタンが無効状態であることを確認
		await expect(button).toBeDisabled();

		// 無効状態のスタイルが適用されていることを確認
		await expect(button).toHaveClass("disabled:opacity-50");
		await expect(button).toHaveClass("disabled:cursor-not-allowed");

		// 無効状態のボタンをクリック
		await userEvent.click(button);

		// onClickが呼ばれないことを確認
		await expect(args.onClick).not.toHaveBeenCalled();

		// キーボードイベントも無効であることを確認
		await userEvent.keyboard("{Enter}");
		await expect(args.onClick).not.toHaveBeenCalled();

		await userEvent.keyboard(" ");
		await expect(args.onClick).not.toHaveBeenCalled();
	},
	parameters: {
		docs: {
			description: {
				story:
					"無効状態でのインタラクションをテストするためのストーリーです。無効状態でのクリック、キーボード操作が適切に無効化されることを確認します。",
			},
		},
	},
};

/**
 * ホバー・フォーカス状態のテスト
 *
 * ホバー時とフォーカス時の視覚的フィードバックテスト
 */
export const HoverAndFocusStates: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// ボタンを取得
		const button = canvas.getByRole("button", {
			name: "新しいサブスクリプションを登録",
		});
		await expect(button).toBeInTheDocument();

		// 初期状態のスタイルを確認
		await expect(button).toHaveClass("bg-blue-600");

		// ホバー時のスタイルが定義されていることを確認
		await expect(button).toHaveClass("hover:bg-blue-700");

		// フォーカス時のスタイルが定義されていることを確認
		await expect(button).toHaveClass("focus:outline-none");
		await expect(button).toHaveClass("focus:ring-2");
		await expect(button).toHaveClass("focus:ring-offset-2");
		await expect(button).toHaveClass("focus:ring-blue-500");

		// トランジション効果が適用されていることを確認
		await expect(button).toHaveClass("transition-colors");

		// ボタンをフォーカス
		await userEvent.tab();
		await expect(button).toHaveFocus();

		// フォーカスリングが適用されていることを確認
		await expect(button).toHaveClass("focus:ring-2");
	},
	parameters: {
		docs: {
			description: {
				story:
					"ホバー・フォーカス状態での視覚的フィードバックをテストするためのストーリーです。スタイルクラスの適用とフォーカス管理を確認します。",
			},
		},
	},
};

/**
 * アクセシビリティテスト
 *
 * ARIA属性とセマンティクスの検証
 */
export const AccessibilityTest: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// ボタンを取得
		const button = canvas.getByRole("button", {
			name: "新しいサブスクリプションを登録",
		});
		await expect(button).toBeInTheDocument();

		// 適切なaria-labelが設定されていることを確認
		await expect(button).toHaveAttribute(
			"aria-label",
			"新しいサブスクリプションを登録",
		);

		// button要素であることを確認
		await expect(button.tagName).toBe("BUTTON");

		// type属性が設定されていることを確認
		await expect(button).toHaveAttribute("type", "button");

		// アイコンに適切なaria-hidden属性が設定されていることを確認
		const svg = button.querySelector("svg");
		await expect(svg).toHaveAttribute("aria-hidden", "true");

		// テキストコンテンツが適切に設定されていることを確認
		await expect(button).toHaveAccessibleName("新しいサブスクリプションを登録");
	},
	parameters: {
		docs: {
			description: {
				story:
					"アクセシビリティ要件をテストするためのストーリーです。ARIA属性、セマンティクス、アクセシブルネームの適切な設定を確認します。",
			},
		},
	},
};
