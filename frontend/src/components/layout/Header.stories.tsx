// Storybookストーリーファイル
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { Header } from "./Header";

// Next.js usePathnameをモック（将来のストーリーで使用予定）
const _mockUsePathname = (pathname: string) => {
	const { usePathname } = require("next/navigation");
	usePathname.mockReturnValue(pathname);
};

/**
 * Headerコンポーネントのストーリー
 *
 * アプリケーションの共通ヘッダーコンポーネントです。
 * 家計管理アプリの画面上部に配置され、アプリケーションタイトルとナビゲーション領域を提供します。
 *
 * 特徴:
 * - レスポンシブデザイン対応
 * - アクセシビリティ対応
 * - カスタムタイトル設定可能
 *
 * Storybookインストール後の使用方法:
 * 1. @storybook/reactをインストール
 * 2. 上記のimportを有効化
 * 3. 型定義を以下に変更: const meta: Meta<typeof Header> = {
 */
const meta: Meta<typeof Header> = {
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
type Story = StoryObj<typeof meta>;

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
		className: "bg-blue-100",
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

/**
 * インタラクティブテスト
 *
 * ナビゲーション、アクティブ状態、キーボード操作、レスポンシブ動作の
 * 包括的なインタラクションテストを実行します。
 */
export const Interactive: Story = {
	parameters: {
		docs: {
			description: {
				story: `
インタラクティブテストストーリー:

- **ナビゲーションリンク**: 各リンクのクリック動作を検証
- **アクティブ状態**: 現在のパスに基づくアクティブ状態のハイライト
- **キーボードナビゲーション**: Tabキーでのフォーカス移動とEnterキーでの選択
- **レスポンシブ動作**: 画面サイズに応じたラベル表示/非表示の切り替え
- **フォーカス管理**: 適切なフォーカス状態とアクセシビリティ機能
- **ARIA属性**: スクリーンリーダーサポートの検証

テストは自動的に実行され、各機能の動作を確認します。
				`,
			},
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// ========================
		// 1. 基本要素の存在確認
		// ========================

		// ヘッダー要素の存在確認
		const header = canvas.getByRole("banner");
		await expect(header).toBeInTheDocument();

		// タイトルの存在確認
		const title = canvas.getByRole("heading", { level: 1 });
		await expect(title).toBeInTheDocument();
		await expect(title).toHaveTextContent("Saifuu");

		// ロゴの存在確認
		const logo = canvas.getByRole("img", { name: "Saifuuロゴ" });
		await expect(logo).toBeInTheDocument();

		// ナビゲーションの存在確認
		const nav = canvas.getByRole("navigation", {
			name: "メインナビゲーション",
		});
		await expect(nav).toBeInTheDocument();

		// ========================
		// 2. ナビゲーションリンクの確認
		// ========================

		// ホームリンクの存在確認
		const homeLink = canvas.getByRole("link", { name: /ホーム/i });
		await expect(homeLink).toBeInTheDocument();
		await expect(homeLink).toHaveAttribute("href", "/");

		// サブスクリンクの存在確認
		const subscriptionsLink = canvas.getByRole("link", {
			name: /サブスク管理/i,
		});
		await expect(subscriptionsLink).toBeInTheDocument();
		await expect(subscriptionsLink).toHaveAttribute("href", "/subscriptions");

		// ========================
		// 3. アクティブ状態の確認
		// ========================

		// デフォルトでホームリンクがアクティブ状態（pathname="/"をモック）
		await expect(homeLink).toHaveAttribute("aria-current", "page");
		await expect(homeLink).toHaveClass("bg-blue-100", "text-blue-700");

		// サブスクリンクは非アクティブ状態
		await expect(subscriptionsLink).not.toHaveAttribute("aria-current");
		await expect(subscriptionsLink).toHaveClass("text-gray-600");

		// ========================
		// 4. キーボードナビゲーションテスト
		// ========================

		// Tabキーでナビゲーションリンクにフォーカス
		await userEvent.tab();
		await expect(homeLink).toHaveFocus();

		// 次のリンクへのTab移動
		await userEvent.tab();
		await expect(subscriptionsLink).toHaveFocus();

		// フォーカスリング（アウトライン）のスタイルが適用されているか確認
		await expect(subscriptionsLink).toHaveClass(
			"focus:ring-2",
			"focus:ring-blue-500",
		);

		// Enterキーでリンクをアクティベート（実際のナビゲーションはStorybookでは制限されるため、フォーカス状態のみ確認）
		await userEvent.keyboard("{Enter}");
		await expect(subscriptionsLink).toHaveFocus();

		// ========================
		// 5. ホバー状態の確認
		// ========================

		// ホバー状態のスタイルクラスが適用されているか確認
		await expect(homeLink).toHaveClass(
			"hover:bg-gray-100",
			"hover:text-gray-900",
		);
		await expect(subscriptionsLink).toHaveClass(
			"hover:bg-gray-100",
			"hover:text-gray-900",
		);

		// マウスホバーでのスタイル変更（視覚的確認）
		await userEvent.hover(subscriptionsLink);
		await userEvent.unhover(subscriptionsLink);

		// ========================
		// 6. アクセシビリティ属性の確認
		// ========================

		// ナビゲーションのaria-labelが正しく設定されているか
		await expect(nav).toHaveAttribute("aria-label", "メインナビゲーション");

		// ロゴのaria-labelが正しく設定されているか
		await expect(logo).toHaveAttribute("aria-label", "Saifuuロゴ");

		// アイコンがaria-hidden="true"で装飾的要素として適切にマークされているか
		const homeIcon = canvas.getByText("🏠");
		await expect(homeIcon).toHaveAttribute("aria-hidden", "true");

		const subscriptionsIcon = canvas.getByText("📱");
		await expect(subscriptionsIcon).toHaveAttribute("aria-hidden", "true");

		// ========================
		// 7. レスポンシブ動作の確認
		// ========================

		// モバイル画面でのラベル非表示の確認
		// Note: Storybookでは実際のCSSメディアクエリーのテストは制限されるため、
		// クラス名の存在確認で代替
		const homeLabel = canvas.getByText("ホーム");
		const subscriptionsLabel = canvas.getByText("サブスク管理");

		// レスポンシブクラスが正しく適用されているか確認
		await expect(homeLabel).toHaveClass("hidden", "sm:inline");
		await expect(subscriptionsLabel).toHaveClass("hidden", "sm:inline");

		// ========================
		// 8. 構造とセマンティクスの確認
		// ========================

		// ヘッダーがsticky位置に配置されているか
		await expect(header).toHaveClass("sticky", "top-0");

		// 背景のblur効果が適用されているか
		await expect(header).toHaveClass("backdrop-blur-md");

		// 適切なz-indexが設定されているか（オーバーレイ対応）
		await expect(header).toHaveClass("z-50");

		// ========================
		// 9. レイアウトの確認
		// ========================

		// コンテナの最大幅設定
		const container = header.querySelector(".container");
		await expect(container).toBeInTheDocument();
		await expect(container).toHaveClass("mx-auto");

		// フレックスボックスレイアウトの確認
		const flexContainer = header.querySelector(
			".flex.items-center.justify-between",
		);
		await expect(flexContainer).toBeInTheDocument();
		await expect(flexContainer).toHaveClass("h-16");

		// ========================
		// 10. 最終的な統合確認
		// ========================

		// 全体的なレイアウトが崩れていないか確認
		await expect(header).toBeVisible();
		await expect(title).toBeVisible();
		await expect(homeLink).toBeVisible();
		await expect(subscriptionsLink).toBeVisible();

		// コンポーネントが正常に機能することを示すために、
		// 最後にもう一度キーボード操作をテスト
		await userEvent.tab();
		await userEvent.tab();
		await expect(homeLink).toHaveFocus();
	},
};
