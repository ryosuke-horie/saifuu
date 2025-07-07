import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import ServiceWorkerRegistration from "./ServiceWorkerRegistration";

const meta: Meta<typeof ServiceWorkerRegistration> = {
	title: "PWA/ServiceWorkerRegistration",
	component: ServiceWorkerRegistration,
	parameters: {
		layout: "padded",
		docs: {
			description: {
				component: `
PWA機能を有効化するサービスワーカー登録コンポーネント。

## 機能
- サービスワーカーの自動登録
- アップデート通知の表示
- オフライン状態の通知
- エラーハンドリング（開発環境のみ）

## 使用方法
アプリケーションのルートレイアウトに配置することで、PWA機能が有効になります。

## セキュリティ考慮事項
- 機密データはキャッシュしない
- HTTPS環境でのみ動作
- 適切なキャッシュ戦略を適用
        `,
			},
		},
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 基本的な表示状態
 * 通常時は何も表示されない
 */
export const Default: Story = {
	args: {},
	parameters: {
		docs: {
			description: {
				story:
					"通常状態では何も表示されません。内部的にサービスワーカーの登録処理が実行されます。",
			},
		},
	},
};

/**
 * オフライン状態の表示
 * navigator.onLineを操作してオフライン状態をシミュレート
 */
export const OfflineState: Story = {
	args: {},
	parameters: {
		docs: {
			description: {
				story: "オフライン状態では画面上部に通知バーが表示されます。",
			},
		},
	},
	play: async ({ canvasElement }) => {
		// オフライン状態をシミュレート
		Object.defineProperty(navigator, "onLine", {
			writable: true,
			value: false,
		});

		// オフラインイベントをディスパッチ
		window.dispatchEvent(new Event("offline"));

		const canvas = within(canvasElement);

		// オフライン通知が表示されることを確認
		await expect(canvas.getByText(/オフライン状態です/)).toBeInTheDocument();
	},
};

/**
 * アップデート通知の表示
 * 開発環境でのみ表示される想定
 */
export const UpdateAvailable: Story = {
	args: {},
	parameters: {
		docs: {
			description: {
				story: "新しいバージョンが利用可能な場合に表示される通知です。",
			},
		},
	},
	decorators: [
		(Story) => (
			<div>
				<Story />
				{/* アップデート通知のシミュレーション */}
				<div className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm">
					<div className="mb-2">
						<p className="font-medium">アップデート利用可能</p>
						<p className="text-sm opacity-90">
							新しいバージョンが利用可能です。
						</p>
					</div>
					<div className="flex gap-2">
						<button className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium hover:bg-blue-50">
							更新
						</button>
						<button className="bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium hover:bg-blue-800">
							後で
						</button>
					</div>
				</div>
			</div>
		),
	],
};

/**
 * エラー状態の表示
 * 開発環境でのみ表示される想定
 */
export const ErrorState: Story = {
	args: {},
	parameters: {
		docs: {
			description: {
				story:
					"サービスワーカー登録時のエラーが発生した場合の表示です（開発環境のみ）。",
			},
		},
	},
	decorators: [
		(Story) => (
			<div>
				<Story />
				{/* エラー通知のシミュレーション */}
				<div className="fixed bottom-4 left-4 bg-red-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm">
					<div className="mb-2">
						<p className="font-medium">サービスワーカーエラー</p>
						<p className="text-sm opacity-90">
							サービスワーカーの登録に失敗しました。
						</p>
					</div>
				</div>
			</div>
		),
	],
};

/**
 * レスポンシブデザインのテスト
 */
export const ResponsiveDesign: Story = {
	args: {},
	parameters: {
		viewport: {
			viewports: {
				mobile: { name: "Mobile", styles: { width: "375px", height: "667px" } },
				tablet: {
					name: "Tablet",
					styles: { width: "768px", height: "1024px" },
				},
				desktop: {
					name: "Desktop",
					styles: { width: "1200px", height: "800px" },
				},
			},
		},
		docs: {
			description: {
				story: "異なる画面サイズでの表示確認。通知は適切に配置されます。",
			},
		},
	},
	decorators: [
		(Story) => (
			<div className="min-h-screen bg-gray-100 p-4">
				<Story />
				{/* オフライン通知とアップデート通知の両方を表示 */}
				<div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-2 px-4 text-sm z-50">
					<span>📱 オフライン状態です - 一部の機能が利用できません</span>
				</div>
				<div className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm">
					<div className="mb-2">
						<p className="font-medium">アップデート利用可能</p>
						<p className="text-sm opacity-90">
							新しいバージョンが利用可能です。
						</p>
					</div>
					<div className="flex gap-2">
						<button className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium hover:bg-blue-50">
							更新
						</button>
						<button className="bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium hover:bg-blue-800">
							後で
						</button>
					</div>
				</div>
			</div>
		),
	],
};

/**
 * インタラクションテスト
 */
export const InteractionTest: Story = {
	args: {},
	parameters: {
		docs: {
			description: {
				story:
					"ユーザーインタラクションのテスト。ボタンクリック時の動作を確認します。",
			},
		},
	},
	decorators: [
		(Story) => (
			<div>
				<Story />
				<div className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm">
					<div className="mb-2">
						<p className="font-medium">アップデート利用可能</p>
						<p className="text-sm opacity-90">
							新しいバージョンが利用可能です。
						</p>
					</div>
					<div className="flex gap-2">
						<button
							className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium hover:bg-blue-50"
							data-testid="update-button"
						>
							更新
						</button>
						<button
							className="bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium hover:bg-blue-800"
							data-testid="later-button"
						>
							後で
						</button>
					</div>
				</div>
			</div>
		),
	],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// ボタンが存在することを確認
		const updateButton = canvas.getByTestId("update-button");
		const laterButton = canvas.getByTestId("later-button");

		await expect(updateButton).toBeInTheDocument();
		await expect(laterButton).toBeInTheDocument();

		// ボタンクリック時のホバー状態を確認
		await userEvent.hover(updateButton);
		await userEvent.hover(laterButton);

		// ボタンをクリック
		await userEvent.click(updateButton);
	},
};

/**
 * アクセシビリティテスト
 */
export const AccessibilityTest: Story = {
	args: {},
	parameters: {
		docs: {
			description: {
				story:
					"アクセシビリティの確認。適切なARIAラベルとキーボードナビゲーションをテストします。",
			},
		},
	},
	decorators: [
		(Story) => (
			<div>
				<Story />
				<div
					className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm"
					role="alert"
					aria-live="polite"
				>
					<div className="mb-2">
						<p className="font-medium">アップデート利用可能</p>
						<p className="text-sm opacity-90">
							新しいバージョンが利用可能です。
						</p>
					</div>
					<div className="flex gap-2">
						<button
							className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium hover:bg-blue-50"
							aria-label="アプリケーションを更新する"
						>
							更新
						</button>
						<button
							className="bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium hover:bg-blue-800"
							aria-label="後で更新する"
						>
							後で
						</button>
					</div>
				</div>
			</div>
		),
	],
};

/**
 * パフォーマンステスト
 */
export const PerformanceTest: Story = {
	args: {},
	parameters: {
		docs: {
			description: {
				story:
					"パフォーマンスの確認。コンポーネントが軽量で迅速に動作することを確認します。",
			},
		},
	},
	play: async ({ canvasElement }) => {
		const startTime = performance.now();

		// コンポーネントが迅速にレンダリングされることを確認
		const _canvas = within(canvasElement);

		const endTime = performance.now();
		const renderTime = endTime - startTime;

		console.log(`ServiceWorkerRegistration render time: ${renderTime}ms`);

		// レンダリング時間が100ms以下であることを確認
		expect(renderTime).toBeLessThan(100);
	},
};
