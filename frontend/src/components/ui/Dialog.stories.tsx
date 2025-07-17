import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Dialog } from "./Dialog";

/**
 * Dialogコンポーネントのストーリー
 *
 * モーダルダイアログの主要な使用パターンを確認
 */
const meta: Meta<typeof Dialog> = {
	title: "Components/UI/Dialog",
	component: Dialog,
	parameters: {
		layout: "centered",
	},
	argTypes: {
		isOpen: {
			control: "boolean",
			description: "ダイアログの表示状態",
		},
		onClose: {
			action: "closed",
			description: "ダイアログを閉じる際のコールバック関数",
		},
		title: {
			control: "text",
			description: "ダイアログのタイトル（オプション）",
		},
		closeOnOverlayClick: {
			control: "boolean",
			description: "オーバーレイクリックでダイアログを閉じるかどうか",
		},
		closeOnEsc: {
			control: "boolean",
			description: "ESCキー押下でダイアログを閉じるかどうか",
		},
		className: {
			control: "text",
			description: "追加のCSSクラス名",
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
};

/**
 * タイトル付き
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
};

/**
 * インタラクティブ
 *
 * ボタンクリックで開閉する実際の使用例
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
};

/**
 * フォーム入力
 *
 * フォーム要素を含む実用的な例
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
 * スクロール可能な長いコンテンツの例
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
				{Array.from({ length: 5 }, (_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: ストーリー用の静的コンテンツで順序変更がないため安全
					<div key={`section-${i}`}>
						<h3>
							第{i + 2}条（見出し{i + 2}）
						</h3>
						<p>
							ここに長い文章が入ります。スクロール動作を確認するための
							ダミーテキストです。
						</p>
					</div>
				))}
			</div>
		),
	},
};

/**
 * オーバーレイクリック無効
 *
 * 重要な操作で使用するパターン
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
