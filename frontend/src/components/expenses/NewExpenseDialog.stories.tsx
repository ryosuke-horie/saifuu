/**
 * NewExpenseDialogコンポーネントのStorybook
 * 
 * 関連Issue: #93 支出管理メインページ実装
 */

import type { Meta, StoryObj } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import { useState } from "react";
import { NewExpenseDialog } from "./NewExpenseDialog";
import type { Category } from "../../lib/api/types";
import type { ExpenseFormData } from "../../types/expense";

const mockCategories: Category[] = [
	{
		id: "category-1",
		name: "食費",
		type: "expense",
		color: "#FF6B6B",
		createdAt: "2024-01-01T00:00:00.000Z",
		updatedAt: "2024-01-01T00:00:00.000Z",
	},
	{
		id: "category-2",
		name: "交通費",
		type: "expense",
		color: "#4ECDC4",
		createdAt: "2024-01-01T00:00:00.000Z",
		updatedAt: "2024-01-01T00:00:00.000Z",
	},
	{
		id: "category-3",
		name: "日用品",
		type: "expense",
		color: "#45B7D1",
		createdAt: "2024-01-01T00:00:00.000Z",
		updatedAt: "2024-01-01T00:00:00.000Z",
	},
	{
		id: "category-4",
		name: "娯楽",
		type: "expense",
		color: "#FFA07A",
		createdAt: "2024-01-01T00:00:00.000Z",
		updatedAt: "2024-01-01T00:00:00.000Z",
	},
];

const meta: Meta<typeof NewExpenseDialog> = {
	title: "Components/Expenses/NewExpenseDialog",
	component: NewExpenseDialog,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component: `
新規支出登録ダイアログコンポーネント

DialogコンポーネントとExpenseFormコンポーネントを組み合わせて、
モーダル形式での新規支出・収入登録機能を提供します。

### 機能
- モーダルダイアログとしての支出登録フォーム
- フォーム送信成功時の自動クローズ
- エラーハンドリングとエラー表示
- 送信中の状態管理
- カテゴリの自動取得（グローバル設定またはprops）

### 使用例
\`\`\`tsx
const [isOpen, setIsOpen] = useState(false);

<NewExpenseDialog
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onSubmit={handleSubmit}
  categories={categories}
/>
\`\`\`
				`,
			},
		},
	},
	argTypes: {
		isOpen: {
			description: "ダイアログの表示状態",
			control: { type: "boolean" },
		},
		onClose: {
			description: "ダイアログを閉じる際のコールバック関数",
			action: "onClose",
		},
		onSubmit: {
			description: "フォーム送信時のコールバック関数",
			action: "onSubmit",
		},
		isSubmitting: {
			description: "送信処理中の状態",
			control: { type: "boolean" },
			defaultValue: false,
		},
		categories: {
			description: "カテゴリリスト（省略時はグローバル設定を使用）",
			control: { type: "object" },
		},
	},
	args: {
		isOpen: true,
		isSubmitting: false,
		categories: mockCategories,
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * デフォルト状態
 * ダイアログが開いた通常の状態
 */
export const Default: Story = {
	args: {
		onClose: action("onClose"),
		onSubmit: action("onSubmit"),
	},
};

/**
 * 送信中状態
 * フォーム送信処理中の状態
 */
export const Submitting: Story = {
	args: {
		onClose: action("onClose"),
		onSubmit: action("onSubmit"),
		isSubmitting: true,
	},
	parameters: {
		docs: {
			description: {
				story: "送信処理中はボタンが無効化され、オーバーレイクリックやESCキーでの閉じるが無効になります。",
			},
		},
	},
};

/**
 * エラー状態
 * 送信エラーが発生した状態
 */
export const WithError: Story = {
	render: (args) => {
		const [showError, setShowError] = useState(true);
		
		return (
			<div>
				{/* エラーを表示するためのモック実装 */}
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg shadow-xl max-w-2xl w-full m-4 max-h-[90vh] overflow-hidden">
						<div className="p-6">
							<h2 className="text-lg font-semibold mb-4">新規取引登録</h2>
							{showError && (
								<div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
									<div className="flex">
										<div className="flex-shrink-0">
											<span className="text-red-400">⚠️</span>
										</div>
										<div className="ml-3">
											<h3 className="text-sm font-medium text-red-800">
												登録に失敗しました
											</h3>
											<div className="mt-2 text-sm text-red-700">
												<p>サーバーとの通信中にエラーが発生しました。</p>
											</div>
										</div>
									</div>
								</div>
							)}
							<div className="text-gray-600">
								フォームコンテンツ（省略）
							</div>
							<div className="mt-4 flex justify-end gap-2">
								<button
									onClick={() => setShowError(false)}
									className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
								>
									エラーをクリア
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	},
	parameters: {
		docs: {
			description: {
				story: "送信エラーが発生した場合のエラー表示例。",
			},
		},
	},
};

/**
 * カテゴリなし
 * カテゴリがpropsで提供されない場合
 */
export const WithoutCategories: Story = {
	args: {
		onClose: action("onClose"),
		onSubmit: action("onSubmit"),
		categories: undefined,
	},
	parameters: {
		docs: {
			description: {
				story: "categoriesプロパティが未指定の場合、グローバル設定からカテゴリを取得します。",
			},
		},
	},
};

/**
 * インタラクティブな例
 * 開閉を制御できる実装例
 */
export const Interactive: Story = {
	render: () => {
		const [isOpen, setIsOpen] = useState(false);
		const [isSubmitting, setIsSubmitting] = useState(false);
		const [submitCount, setSubmitCount] = useState(0);
		
		const handleSubmit = async (data: ExpenseFormData) => {
			setIsSubmitting(true);
			action("onSubmit")(data);
			
			// 送信処理のシミュレーション
			await new Promise(resolve => setTimeout(resolve, 1500));
			
			setIsSubmitting(false);
			setSubmitCount(prev => prev + 1);
			setIsOpen(false);
		};
		
		return (
			<div className="space-y-4">
				<div className="text-center">
					<button
						onClick={() => setIsOpen(true)}
						className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
					>
						ダイアログを開く
					</button>
					{submitCount > 0 && (
						<p className="mt-2 text-sm text-gray-600">
							送信回数: {submitCount}
						</p>
					)}
				</div>
				
				<NewExpenseDialog
					isOpen={isOpen}
					onClose={() => setIsOpen(false)}
					onSubmit={handleSubmit}
					isSubmitting={isSubmitting}
					categories={mockCategories}
				/>
			</div>
		);
	},
	parameters: {
		docs: {
			description: {
				story: "実際の使用例に近い、開閉を制御できるインタラクティブな実装例。",
			},
		},
	},
};

/**
 * 長いカテゴリリスト
 * カテゴリが多数ある場合の表示
 */
export const ManyCategories: Story = {
	args: {
		onClose: action("onClose"),
		onSubmit: action("onSubmit"),
		categories: [
			...mockCategories,
			{
				id: "category-5",
				name: "医療費",
				type: "expense",
				color: "#9B59B6",
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			},
			{
				id: "category-6",
				name: "教育費",
				type: "expense",
				color: "#3498DB",
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			},
			{
				id: "category-7",
				name: "通信費",
				type: "expense",
				color: "#1ABC9C",
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			},
			{
				id: "category-8",
				name: "その他",
				type: "expense",
				color: "#95A5A6",
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			},
		],
	},
	parameters: {
		docs: {
			description: {
				story: "カテゴリが多数ある場合の表示例。スクロール可能なドロップダウンで表示されます。",
			},
		},
	},
};

/**
 * モバイル表示
 * 小さい画面での表示例
 */
export const Mobile: Story = {
	args: {
		onClose: action("onClose"),
		onSubmit: action("onSubmit"),
	},
	parameters: {
		viewport: {
			defaultViewport: "mobile1",
		},
		docs: {
			description: {
				story: "モバイル画面での表示例。ダイアログは画面幅に合わせて調整されます。",
			},
		},
	},
};