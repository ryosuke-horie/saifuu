// Storybookストーリーファイル
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { useState } from "react";
import { Dialog } from "./Dialog";

/**
 * Dialogコンポーネントのストーリー
 *
 * モーダルダイアログを表示するUIコンポーネントです。
 * React Portalを使用してコンポーネントツリー外にレンダリングされ、
 * フォーカス管理とアクセシビリティに配慮した実装となっています。
 *
 * 特徴:
 * - React Portal使用
 * - フォーカストラップ
 * - キーボードナビゲーション対応（ESCキー）
 * - オーバーレイクリックでの閉じる機能
 * - アクセシビリティ対応（ARIA属性）
 * - スムーズなアニメーション
 */
const meta: Meta<typeof Dialog> = {
	title: "Components/UI/Dialog",
	component: Dialog,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component: `
### Dialogコンポーネント

モーダルダイアログを表示するための汎用UIコンポーネントです。

#### 使用場面
- 確認ダイアログ
- フォーム入力
- 詳細情報の表示
- アラートメッセージ
- ユーザーへの重要な通知

#### 特徴
- **React Portal**: body直下にレンダリングされ、z-indexの問題を回避
- **フォーカス管理**: ダイアログ開閉時の適切なフォーカス制御
- **キーボード対応**: ESCキーでの閉じる機能
- **アクセシブル**: ARIA属性による支援技術対応
- **カスタマイズ可能**: タイトル、閉じる動作の設定が可能

#### 技術仕様
- React Portal API使用
- Tailwind CSS v4でのスタイリング
- TypeScript型定義完備
- アニメーション対応
				`,
			},
		},
	},
	argTypes: {
		isOpen: {
			control: "boolean",
			description: "ダイアログの表示状態",
			table: {
				type: { summary: "boolean" },
				defaultValue: { summary: "false" },
			},
		},
		onClose: {
			action: "closed",
			description: "ダイアログを閉じる際のコールバック関数",
			table: {
				type: { summary: "() => void" },
			},
		},
		title: {
			control: "text",
			description: "ダイアログのタイトル（オプション）",
			table: {
				type: { summary: "string" },
				defaultValue: { summary: "undefined" },
			},
		},
		closeOnOverlayClick: {
			control: "boolean",
			description: "オーバーレイクリックでダイアログを閉じるかどうか",
			table: {
				type: { summary: "boolean" },
				defaultValue: { summary: "true" },
			},
		},
		closeOnEsc: {
			control: "boolean",
			description: "ESCキー押下でダイアログを閉じるかどうか",
			table: {
				type: { summary: "boolean" },
				defaultValue: { summary: "true" },
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
		children: {
			control: false,
			description: "ダイアログの内容",
			table: {
				type: { summary: "ReactNode" },
			},
		},
	},
	args: {
		isOpen: true,
		closeOnOverlayClick: true,
		closeOnEsc: true,
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * インタラクティブデモ用のラッパーコンポーネント
 */
const InteractiveDialog = (args: any) => {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className="flex items-center justify-center min-h-[400px]">
			<button
				type="button"
				onClick={() => setIsOpen(true)}
				className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
			>
				ダイアログを開く
			</button>
			<Dialog {...args} isOpen={isOpen} onClose={() => setIsOpen(false)} />
		</div>
	);
};

/**
 * デフォルト状態
 *
 * 最も基本的な使用パターンです。
 * タイトルなし、デフォルト設定でのダイアログ表示。
 */
export const Default: Story = {
	args: {
		children: (
			<div>
				<p>これは基本的なダイアログの内容です。</p>
				<p className="mt-2">複数の段落や要素を含めることができます。</p>
			</div>
		),
	},
	parameters: {
		chromatic: { delay: 300 }, // アニメーション完了を待つ
	},
};

/**
 * タイトル付きダイアログ
 *
 * タイトルを設定したダイアログの例です。
 * タイトルは自動的にaria-labelledbyで関連付けられます。
 */
export const WithTitle: Story = {
	args: {
		title: "確認ダイアログ",
		children: (
			<div>
				<p>本当にこの操作を実行しますか？</p>
				<p className="mt-2 text-sm text-gray-500">
					この操作は取り消すことができません。
				</p>
			</div>
		),
	},
	parameters: {
		chromatic: { delay: 300 }, // アニメーション完了を待つ
	},
};

/**
 * インタラクティブデモ
 *
 * ボタンクリックでダイアログを開閉する実際の使用例です。
 * フォーカス管理の動作を確認できます。
 */
export const Interactive: Story = {
	render: (args) => <InteractiveDialog {...args} />,
	args: {
		title: "インタラクティブダイアログ",
		children: (
			<div>
				<p>このダイアログは実際の使用例を示しています。</p>
				<ul className="mt-4 space-y-2 text-sm">
					<li>• ESCキーで閉じることができます</li>
					<li>• オーバーレイをクリックして閉じることができます</li>
					<li>• 右上の×ボタンで閉じることができます</li>
				</ul>
			</div>
		),
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// ダイアログを開くボタンをクリック
		const openButton = canvas.getByText("ダイアログを開く");
		await userEvent.click(openButton);

		// ダイアログが表示されることを確認
		await expect(canvas.getByRole("dialog")).toBeInTheDocument();
		await expect(
			canvas.getByText("インタラクティブダイアログ"),
		).toBeInTheDocument();
	},
};

/**
 * フォーム入力ダイアログ
 *
 * フォーム要素を含むダイアログの例です。
 * 実際のアプリケーションでよく使用されるパターンです。
 */
export const FormDialog: Story = {
	args: {
		title: "新規登録",
		children: (
			<form className="space-y-4">
				<div>
					<label
						htmlFor="name"
						className="block text-sm font-medium text-gray-700 mb-1"
					>
						名前
					</label>
					<input
						type="text"
						id="name"
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="山田太郎"
					/>
				</div>
				<div>
					<label
						htmlFor="email"
						className="block text-sm font-medium text-gray-700 mb-1"
					>
						メールアドレス
					</label>
					<input
						type="email"
						id="email"
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="example@email.com"
					/>
				</div>
				<div className="flex justify-end space-x-2 pt-4">
					<button
						type="button"
						className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
					>
						キャンセル
					</button>
					<button
						type="submit"
						className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
					>
						登録
					</button>
				</div>
			</form>
		),
	},
};

/**
 * 長いコンテンツ
 *
 * スクロール可能な長いコンテンツを含むダイアログの例です。
 * 最大高さが設定され、内容がスクロール可能になります。
 */
export const LongContent: Story = {
	args: {
		title: "利用規約",
		children: (
			<div className="prose prose-sm max-w-none">
				<h3>第1条（目的）</h3>
				<p>
					本規約は、当社が提供するサービスの利用条件を定めるものです。
					利用者は本規約に同意した上で、サービスを利用するものとします。
				</p>
				{Array.from({ length: 10 }, (_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: ストーリー用の静的コンテンツで順序変更がないため安全
					<div key={`section-${i}`}>
						<h3>
							第{i + 2}条（見出し{i + 2}）
						</h3>
						<p>
							ここに長い文章が入ります。スクロール動作を確認するための
							ダミーテキストです。実際のアプリケーションでは、
							利用規約やプライバシーポリシーなどの長い文書を
							表示する際に使用されます。
						</p>
					</div>
				))}
			</div>
		),
	},
	parameters: {
		chromatic: {
			delay: 300, // アニメーション完了を待つ
			diffThreshold: 0.2, // スクロールバーの差異を許容
		},
	},
};

/**
 * オーバーレイクリック無効
 *
 * オーバーレイクリックでダイアログが閉じない設定の例です。
 * 重要な操作や必須入力の場面で使用されます。
 */
export const NoOverlayClose: Story = {
	args: {
		title: "重要な確認",
		closeOnOverlayClick: false,
		children: (
			<div>
				<p className="text-red-600 font-semibold">
					このダイアログはオーバーレイクリックでは閉じません。
				</p>
				<p className="mt-2">×ボタンまたは下のボタンから閉じてください。</p>
				<div className="mt-4 flex justify-end">
					<button
						type="button"
						className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
					>
						確認しました
					</button>
				</div>
			</div>
		),
	},
};

/**
 * ESCキー無効
 *
 * ESCキーでダイアログが閉じない設定の例です。
 * データ入力中の誤操作防止などに使用されます。
 */
export const NoEscClose: Story = {
	args: {
		title: "編集中",
		closeOnEsc: false,
		children: (
			<div>
				<p className="text-yellow-600 font-semibold">
					このダイアログはESCキーでは閉じません。
				</p>
				<p className="mt-2">
					編集内容を保護するため、明示的な操作でのみ閉じることができます。
				</p>
			</div>
		),
	},
};

/**
 * カスタムスタイル
 *
 * カスタムCSSクラスを適用したダイアログの例です。
 * プロジェクトのデザインに合わせてカスタマイズできます。
 */
export const CustomStyle: Story = {
	args: {
		title: "カスタムスタイル",
		className: "bg-gradient-to-br from-purple-50 to-blue-50",
		children: (
			<div>
				<p>背景にグラデーションを適用したダイアログです。</p>
				<p className="mt-2 text-sm text-gray-600">
					classNameプロパティで自由にスタイルをカスタマイズできます。
				</p>
			</div>
		),
	},
};

/**
 * アラートダイアログ
 *
 * エラーや警告を表示するアラートダイアログの例です。
 * 重要度に応じて視覚的な強調を行います。
 */
export const AlertDialog: Story = {
	args: {
		title: "⚠️ エラーが発生しました",
		className: "border-2 border-red-200",
		children: (
			<div className="space-y-3">
				<p className="text-red-600 font-medium">
					データの保存中にエラーが発生しました。
				</p>
				<div className="bg-red-50 p-3 rounded-md">
					<p className="text-sm text-red-800">
						エラーコード: ERR_NETWORK_FAILURE
					</p>
				</div>
				<p className="text-sm text-gray-600">
					ネットワーク接続を確認してから、もう一度お試しください。
				</p>
			</div>
		),
	},
	parameters: {
		chromatic: { delay: 300 }, // アニメーション完了を待つ
	},
};

/**
 * 成功メッセージ
 *
 * 操作成功時のフィードバックダイアログの例です。
 * ポジティブな結果を視覚的に伝えます。
 */
export const SuccessDialog: Story = {
	args: {
		title: "✅ 登録完了",
		className: "border-2 border-green-200",
		children: (
			<div className="text-center space-y-3">
				<div className="text-5xl">🎉</div>
				<p className="text-green-600 font-medium">
					データが正常に登録されました！
				</p>
				<p className="text-sm text-gray-600">
					続けて他のデータを登録することもできます。
				</p>
			</div>
		),
	},
};

/**
 * 画像を含むダイアログ
 *
 * 画像やメディアコンテンツを含むダイアログの例です。
 * プレビューや詳細表示に使用されます。
 */
export const WithImage: Story = {
	args: {
		title: "画像プレビュー",
		children: (
			<div className="space-y-4">
				<div className="bg-gray-200 h-48 rounded-md flex items-center justify-center">
					<span className="text-gray-500">画像プレースホルダー</span>
				</div>
				<p className="text-sm text-gray-600">ファイル名: example-image.jpg</p>
				<p className="text-sm text-gray-600">サイズ: 1920 × 1080</p>
			</div>
		),
	},
};

/**
 * ネストされたアクション
 *
 * 複数のアクションボタンを含む複雑なダイアログの例です。
 * 実際のアプリケーションでの使用パターンを示します。
 */
export const ComplexActions: Story = {
	args: {
		title: "ファイルの削除",
		children: (
			<div className="space-y-4">
				<p>以下のファイルを削除しますか？</p>
				<div className="bg-gray-50 p-3 rounded-md">
					<p className="font-mono text-sm">important-document.pdf</p>
					<p className="text-xs text-gray-500 mt-1">最終更新: 2024年6月24日</p>
				</div>
				<div className="flex items-center space-x-2 text-sm text-yellow-600">
					<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
						<path
							fillRule="evenodd"
							d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
							clipRule="evenodd"
						/>
					</svg>
					<span>この操作は取り消せません</span>
				</div>
				<div className="flex justify-end space-x-2 pt-2">
					<button
						type="button"
						className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
					>
						キャンセル
					</button>
					<button
						type="button"
						className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
					>
						削除する
					</button>
				</div>
			</div>
		),
	},
};

/**
 * モバイル表示
 *
 * モバイル画面サイズでの表示確認用ストーリーです。
 * レスポンシブデザインの動作を確認できます。
 */
export const Mobile: Story = {
	args: {
		title: "モバイル表示",
		children: (
			<div>
				<p>モバイル画面での表示を確認するストーリーです。</p>
				<p className="mt-2 text-sm text-gray-600">
					パディングやサイズが自動的に調整されます。
				</p>
			</div>
		),
	},
	parameters: {
		viewport: {
			defaultViewport: "mobile1",
		},
		chromatic: {
			delay: 300, // アニメーション完了を待つ
			viewports: [320], // モバイルビューポート幅
		},
	},
};

/**
 * タブレット表示
 *
 * タブレット画面サイズでの表示確認用ストーリーです。
 */
export const Tablet: Story = {
	args: {
		title: "タブレット表示",
		children: (
			<div>
				<p>タブレット画面での表示を確認するストーリーです。</p>
				<p className="mt-2 text-sm text-gray-600">
					中間的な画面サイズでの動作を確認できます。
				</p>
			</div>
		),
	},
	parameters: {
		viewport: {
			defaultViewport: "ipad",
		},
		chromatic: {
			delay: 300, // アニメーション完了を待つ
			viewports: [768], // タブレットビューポート幅
		},
	},
};

/**
 * アクセシビリティ確認
 *
 * アクセシビリティ機能の確認用ストーリーです。
 * ARIA属性やキーボード操作を確認できます。
 */
export const AccessibilityDemo: Story = {
	args: {
		title: "アクセシビリティ対応ダイアログ",
		children: (
			<div className="space-y-4">
				<p>このダイアログは以下のアクセシビリティ機能を備えています：</p>
				<ul className="space-y-2 text-sm">
					<li>✓ 適切なARIA属性（role, aria-modal, aria-labelledby）</li>
					<li>✓ キーボードナビゲーション（Tab, ESC）</li>
					<li>✓ フォーカストラップ</li>
					<li>✓ スクリーンリーダー対応</li>
					<li>✓ 高コントラストモード対応</li>
				</ul>
				<p className="text-sm text-gray-600 pt-2">
					キーボードやスクリーンリーダーでの操作を確認してください。
				</p>
			</div>
		),
	},
	parameters: {
		docs: {
			description: {
				story: `
アクセシビリティ機能のデモンストレーション:

- **フォーカス管理**: ダイアログ開閉時の適切なフォーカス制御
- **キーボード操作**: Tab キーでのナビゲーション、ESC キーでの閉じる動作
- **ARIA属性**: role="dialog"、aria-modal="true"、aria-labelledby の設定
- **スクリーンリーダー**: 適切な読み上げ順序とラベル

すべてのユーザーが快適に使用できるよう配慮されています。
				`,
			},
		},
	},
};
