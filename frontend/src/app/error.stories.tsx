import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { vi } from "vitest";
import ErrorPage from "./error";

/**
 * Next.jsのuseRouterをモック化
 */
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: mockPush,
	}),
}));

const meta: Meta<typeof ErrorPage> = {
	title: "Pages/ErrorPage",
	component: ErrorPage,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component: `
Next.js App Routerのページレベルエラーバウンダリ。

### 特徴
- **統一されたエラーUI**: 既存のErrorBoundaryコンポーネントのUIパターンを踏襲
- **Next.js統合**: App Routerのerror.tsx特別ファイルとして機能
- **ユーザーフレンドリー**: わかりやすいエラーメッセージと復旧アクション
- **開発支援**: 開発環境では詳細なエラー情報を表示
- **アクセシビリティ**: 適切なARIA属性とキーボード操作対応

### 使用場面
- ページコンポーネントでのエラー発生時
- APIエラーやネットワークエラー時
- 予期しない例外の捕捉時
        `,
			},
		},
	},
	argTypes: {
		error: {
			description: "発生したエラーオブジェクト",
			control: { type: "object" },
		},
		reset: {
			description: "エラー状態をリセットする関数",
			action: "reset",
		},
	},
	args: {
		error: new Error("テスト用のエラーメッセージ"),
		reset: vi.fn(),
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 基本的なエラーページ表示
 */
export const Default: Story = {
	args: {
		error: new Error("ユーザー操作に関するエラーが発生しました"),
		reset: vi.fn(),
	},
};

/**
 * ネットワークエラーの表示
 */
export const NetworkError: Story = {
	args: {
		error: new Error("Network Error: 接続に失敗しました"),
		reset: vi.fn(),
	},
};

/**
 * バリデーションエラーの表示
 */
export const ValidationError: Story = {
	args: {
		error: new Error("Validation Error: 入力データが不正です"),
		reset: vi.fn(),
	},
};

/**
 * エラーIDを含むエラー（本番環境想定）
 */
export const ErrorWithDigest: Story = {
	args: {
		error: Object.assign(new Error("サーバーエラーが発生しました"), {
			digest: "error_12345_abcdef",
		}),
		reset: vi.fn(),
	},
	parameters: {
		docs: {
			description: {
				story: "エラートラッキング用のdigest IDを含むエラー表示パターン",
			},
		},
	},
};

/**
 * 開発環境でのエラー詳細表示
 */
export const DevelopmentMode: Story = {
	args: {
		error: Object.assign(new Error("開発環境専用の詳細エラーメッセージ"), {
			digest: "dev_error_123",
		}),
		reset: vi.fn(),
	},
	parameters: {
		backgrounds: {
			default: "light",
		},
		docs: {
			description: {
				story: "開発環境では詳細なエラー情報とスタックトレースを表示",
			},
		},
	},
	beforeEach: () => {
		// 開発環境モードを設定
		const originalNodeEnv = process.env.NODE_ENV;
		// @ts-expect-error: テスト環境でのNODE_ENV変更のため
		process.env.NODE_ENV = "development";
		return () => {
			// @ts-expect-error: テスト環境でのNODE_ENV復元のため
			process.env.NODE_ENV = originalNodeEnv;
		};
	},
};

/**
 * 本番環境でのエラー表示（詳細情報なし）
 */
export const ProductionMode: Story = {
	args: {
		error: Object.assign(new Error("本番環境のエラーメッセージ"), {
			digest: "prod_error_456",
		}),
		reset: vi.fn(),
	},
	parameters: {
		docs: {
			description: {
				story:
					"本番環境では詳細なエラー情報を隠してユーザーフレンドリーな表示のみ",
			},
		},
	},
	beforeEach: () => {
		const originalNodeEnv = process.env.NODE_ENV;
		// @ts-expect-error: テスト環境でのNODE_ENV変更のため
		process.env.NODE_ENV = "production";
		return () => {
			// @ts-expect-error: テスト環境でのNODE_ENV復元のため
			process.env.NODE_ENV = originalNodeEnv;
		};
	},
};

/**
 * インタラクションテスト: 再試行ボタン
 */
export const RetryInteraction: Story = {
	args: {
		error: new Error("再試行テスト用エラー"),
		reset: vi.fn(),
	},
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);

		// 再試行ボタンを探してクリック
		const retryButton = canvas.getByRole("button", { name: "再試行" });
		await userEvent.click(retryButton);

		// reset関数が呼ばれたことを確認
		await expect(args.reset).toHaveBeenCalledTimes(1);
	},
};

/**
 * インタラクションテスト: ホームに戻るボタン
 */
export const HomeNavigationInteraction: Story = {
	args: {
		error: new Error("ナビゲーションテスト用エラー"),
		reset: vi.fn(),
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// ホームに戻るボタンをクリック
		const homeButton = canvas.getByRole("button", { name: "ホームに戻る" });
		await userEvent.click(homeButton);

		// router.pushが正しいパスで呼ばれたことを確認
		await new Promise((resolve) => setTimeout(resolve, 100));
		await expect(mockPush).toHaveBeenCalledWith("/");
	},
};

/**
 * レスポンシブデザインテスト（モバイル）
 */
export const MobileView: Story = {
	args: {
		error: new Error("モバイルビューテスト用エラー"),
		reset: vi.fn(),
	},
	parameters: {
		viewport: {
			defaultViewport: "mobile1",
		},
		docs: {
			description: {
				story: "モバイルデバイスでの表示を確認",
			},
		},
	},
};

/**
 * アクセシビリティテスト
 */
export const AccessibilityTest: Story = {
	args: {
		error: new Error("アクセシビリティテスト用エラー"),
		reset: vi.fn(),
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// role="alert"が設定されていることを確認
		const alertElement = canvas.getByRole("alert");
		await expect(alertElement).toBeInTheDocument();

		// ボタンがキーボードでアクセス可能であることを確認
		const retryButton = canvas.getByRole("button", { name: "再試行" });
		const homeButton = canvas.getByRole("button", { name: "ホームに戻る" });

		await expect(retryButton).toBeVisible();
		await expect(homeButton).toBeVisible();

		// フォーカス順序の確認
		retryButton.focus();
		await expect(retryButton).toHaveFocus();
	},
};

/**
 * 長いエラーメッセージの表示テスト
 */
export const LongErrorMessage: Story = {
	args: {
		error: new Error(
			`
      非常に長いエラーメッセージのテストです。
      このエラーは複数行にわたって表示される可能性があり、
      UIが適切に対応できるかを確認するためのテストケースです。
      エラーの詳細情報が多い場合でも、
      ユーザーが読みやすい形で表示されることが重要です。
    `.trim(),
		),
		reset: vi.fn(),
	},
	parameters: {
		docs: {
			description: {
				story: "長いエラーメッセージでもUIが崩れないことを確認",
			},
		},
	},
	beforeEach: () => {
		const originalNodeEnv = process.env.NODE_ENV;
		// @ts-expect-error: テスト環境でのNODE_ENV変更のため
		process.env.NODE_ENV = "development";
		return () => {
			// @ts-expect-error: テスト環境でのNODE_ENV復元のため
			process.env.NODE_ENV = originalNodeEnv;
		};
	},
};
