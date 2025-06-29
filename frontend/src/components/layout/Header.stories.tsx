// Storybookストーリーファイル
// 注意: Storybookがインストールされていない場合は、以下のimportを有効にする必要があります
// import type { Meta, StoryObj } from "@storybook/react";
import { Header } from "./Header";

/**
 * Headerコンポーネントのストーリー
 *
 * アプリケーションの共通ヘッダーコンポーネントです。
 * 家計管理アプリの画面上部に配置され、アプリケーションタイトルとナビゲーション領域を提供します。
 *
 * 特徴:
 * - レスポンシブデザイン対応
 * - ダークモード対応
 * - アクセシビリティ対応
 * - カスタムタイトル設定可能
 *
 * Storybookインストール後の使用方法:
 * 1. @storybook/reactをインストール
 * 2. 上記のimportを有効化
 * 3. 型定義を以下に変更: const meta: Meta<typeof Header> = {
 */
const meta = {
	title: "Components/Layout/Header",
	component: Header,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component: `
### Headerコンポーネント

アプリケーション全体で使用される共通ヘッダーコンポーネントです。

#### 使用場面
- 全ページ共通のヘッダー
- アプリケーションタイトルの表示
- 将来的なナビゲーションメニューの基盤

#### 特徴
- **レスポンシブ**: モバイルファーストなデザイン
- **アクセシブル**: セマンティックHTML、適切なARIA属性
- **テーマ対応**: ライト・ダークモード対応
- **カスタマイズ可能**: タイトルとクラス名をカスタマイズ可能

#### 技術仕様
- Tailwind CSS v4使用
- TypeScript型定義完備
- セマンティックHTML要素使用
				`,
			},
		},
		viewport: {
			viewports: {
				mobile: {
					name: "Mobile",
					styles: {
						width: "375px",
						height: "812px",
					},
				},
				tablet: {
					name: "Tablet",
					styles: {
						width: "768px",
						height: "1024px",
					},
				},
				desktop: {
					name: "Desktop",
					styles: {
						width: "1280px",
						height: "720px",
					},
				},
			},
		},
	},
	argTypes: {
		title: {
			control: "text",
			description: "ヘッダーに表示するアプリケーションタイトル",
			table: {
				type: { summary: "string" },
				defaultValue: { summary: '"Saifuu"' },
			},
		},
		className: {
			control: "text",
			description: "追加のCSSクラス名",
			table: {
				type: { summary: "string" },
				defaultValue: { summary: '""' },
			},
		},
	},
	args: {
		title: "Saifuu",
		className: "",
	},
	tags: ["autodocs"],
};

export default meta;
// Storybookインストール後に有効化: type Story = StoryObj<typeof meta>;
type Story = any;

/**
 * デフォルト状態
 *
 * 最も基本的な使用パターンです。
 * デフォルトのタイトル「Saifuu」が表示されます。
 */
export const Default: Story = {};

/**
 * カスタムタイトル
 *
 * カスタムタイトルを設定した場合の表示例です。
 * 日本語のタイトルや長いタイトルでも適切に表示されます。
 */
export const CustomTitle: Story = {
	args: {
		title: "家計管理アプリ",
	},
	parameters: {
		docs: {
			description: {
				story:
					"カスタムタイトルを設定した例。アプリケーションの用途に応じてタイトルを変更できます。",
			},
		},
	},
};

/**
 * 長いタイトル
 *
 * 長いタイトルを設定した場合の表示例です。
 * レスポンシブ対応により、画面サイズに応じて適切に表示されます。
 */
export const LongTitle: Story = {
	args: {
		title: "家計管理・資産運用・投資記録アプリケーション",
	},
	parameters: {
		docs: {
			description: {
				story:
					"長いタイトルでも適切に表示されることを確認するストーリー。レスポンシブデザインの動作確認にも使用できます。",
			},
		},
	},
};

/**
 * 空のタイトル
 *
 * タイトルが空文字の場合の表示例です。
 * エラーハンドリングとして、タイトルが空でもレイアウトが崩れないことを確認します。
 */
export const EmptyTitle: Story = {
	args: {
		title: "",
	},
	parameters: {
		docs: {
			description: {
				story:
					"タイトルが空文字の場合のエッジケース。レイアウトが崩れないことを確認します。",
			},
		},
	},
};

/**
 * カスタムクラス
 *
 * カスタムCSSクラスを適用した場合の表示例です。
 * 追加のスタイリングが必要な場合に使用します。
 */
export const WithCustomClass: Story = {
	args: {
		title: "Saifuu",
		className: "bg-blue-100 dark:bg-blue-900",
	},
	parameters: {
		docs: {
			description: {
				story:
					"カスタムCSSクラスを適用した例。背景色を変更するなど、追加のスタイリングが可能です。",
			},
		},
	},
};

/**
 * モバイル表示
 *
 * モバイル画面サイズでの表示確認用ストーリーです。
 * レスポンシブデザインの動作を確認できます。
 */
export const Mobile: Story = {
	parameters: {
		viewport: {
			defaultViewport: "mobile",
		},
		docs: {
			description: {
				story:
					"モバイル画面サイズでの表示例。フォントサイズやパディングがモバイル向けに調整されます。",
			},
		},
	},
};

/**
 * タブレット表示
 *
 * タブレット画面サイズでの表示確認用ストーリーです。
 */
export const Tablet: Story = {
	parameters: {
		viewport: {
			defaultViewport: "tablet",
		},
		docs: {
			description: {
				story:
					"タブレット画面サイズでの表示例。中間的な画面サイズでの動作を確認します。",
			},
		},
	},
};

/**
 * デスクトップ表示
 *
 * デスクトップ画面サイズでの表示確認用ストーリーです。
 */
export const Desktop: Story = {
	parameters: {
		viewport: {
			defaultViewport: "desktop",
		},
		docs: {
			description: {
				story:
					"デスクトップ画面サイズでの表示例。最大限の画面幅でのレイアウトを確認します。",
			},
		},
	},
};

/**
 * ダークモード
 *
 * ダークモードでの表示確認用ストーリーです。
 * カラーテーマの切り替えに対応していることを確認できます。
 */
export const DarkMode: Story = {
	parameters: {
		backgrounds: {
			default: "dark",
			values: [
				{
					name: "dark",
					value: "#1f2937",
				},
			],
		},
		docs: {
			description: {
				story:
					"ダークモードでの表示例。Tailwind CSSのダークモードクラスが適切に動作することを確認します。",
			},
		},
	},
	decorators: [
		(Story: any) => (
			<div className="dark">
				<Story />
			</div>
		),
	],
};

/**
 * アクセシビリティ確認
 *
 * アクセシビリティ要素の確認用ストーリーです。
 * スクリーンリーダーや支援技術での使用を想定しています。
 */
export const AccessibilityDemo: Story = {
	args: {
		title: "アクセシビリティ対応ヘッダー",
	},
	parameters: {
		docs: {
			description: {
				story: `
アクセシビリティ機能のデモンストレーション:

- **セマンティックHTML**: \`<header>\`、\`<h1>\`、\`<nav>\`要素を使用
- **ARIAラベル**: ナビゲーションとロゴに適切な\`aria-label\`を設定
- **見出し階層**: \`<h1>\`要素でタイトルを適切にマークアップ
- **ロール属性**: ロゴに\`role="img"\`を設定
- **キーボード操作**: すべての要素がキーボードでアクセス可能

スクリーンリーダーでの読み上げやキーボードナビゲーションを確認してください。
				`,
			},
		},
	},
};

/**
 * パフォーマンス確認
 *
 * レンダリングパフォーマンスの確認用ストーリーです。
 * 大量のコンポーネントが表示される場合を想定しています。
 */
export const PerformanceTest: Story = {
	render: (_args: any) => (
		<div>
			{Array.from({ length: 10 }, (_, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: パフォーマンステスト用のストーリーで順序が変わらないため
				<Header key={`header-${i}`} title={`ヘッダー ${i + 1}`} />
			))}
		</div>
	),
	parameters: {
		docs: {
			description: {
				story:
					"複数のHeaderコンポーネントを同時にレンダリングした場合のパフォーマンステスト。メモリ使用量やレンダリング速度を確認できます。",
			},
		},
	},
};
