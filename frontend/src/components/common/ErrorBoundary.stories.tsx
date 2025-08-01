import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import type { ExtendedError, ValidationErrorDetail } from "./ErrorBoundary";
import { ErrorBoundary } from "./ErrorBoundary";

/**
 * ErrorBoundaryのStorybook設定
 *
 * 設計意図: コンポーネント分離開発による品質担保
 * - エラー状態の視覚的確認
 * - 各エラータイプの表示パターン確認
 * - インタラクション動作の確認
 */
const meta: Meta<typeof ErrorBoundary> = {
	title: "Components/ErrorBoundary",
	component: ErrorBoundary,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component: `
**ErrorBoundary** は、アプリケーション全体のエラーハンドリングを担当するコンポーネントです。

## 主な機能
- エラータイプに応じた表示分岐（network, validation, unknown）
- 開発環境での詳細エラー表示
- リトライ・ホームに戻る・エラー報告の各種アクション
- カスタムフォールバックUIの対応
- 適切なログ出力

## 使用場面
- アプリケーションのルートレベルでの全体的なエラーハンドリング
- 特定の機能単位でのエラーバウンダリ
- カスタムエラー表示が必要な場合
        `,
			},
		},
	},
	argTypes: {
		children: {
			description: "子コンポーネント",
			control: false,
		},
		fallback: {
			description: "カスタムフォールバックコンポーネント",
			control: false,
		},
		errorTypeUI: {
			description: "エラータイプ別のカスタムUI",
			control: false,
		},
		onError: {
			description: "エラー発生時のハンドラー",
			action: "error",
		},
		onRetry: {
			description: "再試行時のハンドラー",
			action: "retry",
		},
		onReport: {
			description: "エラーレポート送信時のハンドラー",
			action: "report",
		},
	},
	args: {
		onError: fn(),
		onRetry: fn(),
		onReport: fn(),
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * エラーを投げるテスト用コンポーネント
 */
const ThrowError = ({
	errorType = "unknown",
	message = "Test error",
}: {
	errorType?: "network" | "validation" | "unknown";
	message?: string;
}) => {
	const error = new Error(message) as ExtendedError;

	if (errorType === "network") {
		error.type = "network";
	} else if (errorType === "validation") {
		error.type = "validation";
		error.details = [
			{ field: "email", message: "メールアドレスが無効です" },
			{ field: "password", message: "パスワードは8文字以上必要です" },
		] as ValidationErrorDetail[];
	}

	throw error;
};

/**
 * 正常状態 - エラーが発生していない場合
 */
export const Default: Story = {
	args: {
		children: (
			<div className="p-8 text-center">
				<h1 className="text-2xl font-bold text-gray-900">正常なコンテンツ</h1>
				<p className="mt-4 text-gray-600">
					このコンテンツは正常に表示されています。エラーは発生していません。
				</p>
			</div>
		),
	},
};

/**
 * 一般的なエラー状態
 */
export const UnknownError: Story = {
	args: {
		children: (
			<ThrowError
				errorType="unknown"
				message="予期しないエラーが発生しました"
			/>
		),
	},
};

/**
 * ネットワークエラー
 */
export const NetworkError: Story = {
	args: {
		children: (
			<ThrowError errorType="network" message="Network connection failed" />
		),
	},
};

/**
 * バリデーションエラー（詳細情報付き）
 */
export const ValidationError: Story = {
	args: {
		children: <ThrowError errorType="validation" message="Validation failed" />,
	},
};

/**
 * カスタムフォールバックUI
 */
export const CustomFallback: Story = {
	args: {
		children: <ThrowError errorType="unknown" message="Custom fallback test" />,
		fallback: ({
			error,
			onRetry,
		}: {
			error: ExtendedError;
			onRetry: () => void;
		}) => (
			<div className="min-h-screen flex items-center justify-center bg-red-50">
				<div className="max-w-md mx-auto text-center p-8">
					<div className="text-6xl mb-4">🚨</div>
					<h2 className="text-2xl font-bold text-red-800 mb-4">
						カスタムエラー画面
					</h2>
					<p className="text-red-600 mb-6">{error.message}</p>
					<button
						type="button"
						onClick={onRetry}
						className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
					>
						カスタム再試行
					</button>
				</div>
			</div>
		),
	},
};

/**
 * エラータイプ別カスタムUI
 */
export const ErrorTypeCustomUI: Story = {
	args: {
		children: <ThrowError errorType="network" />,
		errorTypeUI: {
			network: (
				<div className="min-h-screen flex items-center justify-center bg-blue-50">
					<div className="max-w-md mx-auto text-center p-8">
						<div className="text-6xl mb-4">📶</div>
						<h2 className="text-2xl font-bold text-blue-800 mb-4">
							ネットワークエラー専用UI
						</h2>
						<p className="text-blue-600 mb-6">
							インターネット接続を確認してください
						</p>
					</div>
				</div>
			),
		},
	},
};

/**
 * 開発環境でのエラー詳細表示
 *
 * 注意: Storybookでは常に詳細が表示されます（NODE_ENV="development"のため）
 */
export const DevelopmentMode: Story = {
	args: {
		children: (
			<ThrowError
				errorType="unknown"
				message="Development error with stack trace"
			/>
		),
	},
	parameters: {
		docs: {
			description: {
				story: `
開発環境では、エラーの詳細情報（メッセージ、エラーID）が表示されます。
本番環境では、セキュリティ上の理由で詳細情報は表示されません。
        `,
			},
		},
	},
};

/**
 * インタラクション可能なエラー画面
 *
 * 各種ボタンの動作確認用
 */
export const Interactive: Story = {
	args: {
		children: (
			<ThrowError errorType="unknown" message="Interactive error example" />
		),
	},
	parameters: {
		docs: {
			description: {
				story: `
各種ボタンをクリックして動作を確認できます：
- **再試行**: エラー状態をリセット
- **ホームに戻る**: ルートページへ遷移（Storybookでは動作しません）
- **エラーを報告**: レポートフォームを表示
        `,
			},
		},
	},
};
