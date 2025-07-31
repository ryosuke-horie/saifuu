/**
 * EditExpenseDialog コンポーネントのStorybook定義
 */

import type { Meta, StoryObj } from "@storybook/react";
import { HttpResponse, http } from "msw";
import { useState } from "react";
import type { Category, TransactionWithCategory } from "../../lib/api/types";
import { EditExpenseDialog } from "./EditExpenseDialog";

// モックカテゴリデータ
const mockCategories: Category[] = [
	{
		id: "1",
		name: "食費",
		type: "expense",
		color: "#FF6B6B",
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: "2",
		name: "交通費",
		type: "expense",
		color: "#4ECDC4",
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: "3",
		name: "日用品",
		type: "expense",
		color: "#FFE66D",
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
];

// モック取引データ
const mockTransaction: TransactionWithCategory = {
	id: "tx-1",
	amount: 1500,
	type: "expense",
	description: "昼食代",
	date: "2024-01-15",
	category: mockCategories[0],
	categoryId: mockCategories[0].id,
	createdAt: "2024-01-15T12:00:00Z",
	updatedAt: "2024-01-15T12:00:00Z",
};

const meta = {
	title: "Components/Expenses/EditExpenseDialog",
	component: EditExpenseDialog,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"既存の取引データを編集するためのモーダルダイアログコンポーネント。ExpenseFormを内包し、Transaction型からExpenseFormData型への変換を行います。",
			},
		},
	},
	tags: ["autodocs"],
	argTypes: {
		isOpen: {
			control: "boolean",
			description: "ダイアログの表示状態",
		},
		isSubmitting: {
			control: "boolean",
			description: "送信中の状態",
		},
		transaction: {
			control: "object",
			description: "編集対象の取引データ",
		},
		categories: {
			control: "object",
			description: "カテゴリ一覧（未指定の場合はグローバル設定から取得）",
		},
		onClose: {
			action: "onClose",
			description: "ダイアログを閉じる際のコールバック",
		},
		onSubmit: {
			action: "onSubmit",
			description: "フォーム送信時のコールバック",
		},
	},
	args: {
		isOpen: true,
		isSubmitting: false,
		transaction: mockTransaction,
		categories: mockCategories,
		onClose: () => {},
		onSubmit: () => {},
	},
} satisfies Meta<typeof EditExpenseDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 基本的な編集ダイアログ
 */
export const Default: Story = {
	args: {},
	render: (args) => {
		const [isOpen, setIsOpen] = useState(args.isOpen);

		return (
			<>
				<button
					type="button"
					onClick={() => setIsOpen(true)}
					className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
				>
					編集ダイアログを開く
				</button>
				<EditExpenseDialog
					{...args}
					isOpen={isOpen}
					onClose={() => setIsOpen(false)}
					onSubmit={async (id, data) => {
						console.log("更新データ:", { id, data });
						await new Promise((resolve) => setTimeout(resolve, 1000));
					}}
				/>
			</>
		);
	},
};

/**
 * 送信中の状態
 */
export const Submitting: Story = {
	args: {
		isSubmitting: true,
	},
};

/**
 * カテゴリなしの取引
 */
export const WithoutCategory: Story = {
	args: {
		transaction: {
			...mockTransaction,
			category: null,
			categoryId: null,
		} as TransactionWithCategory,
	},
};

/**
 * 説明なしの取引
 */
export const WithoutDescription: Story = {
	args: {
		transaction: {
			...mockTransaction,
			description: null,
		},
	},
};

/**
 * エラー状態のシミュレーション
 */
export const WithError: Story = {
	args: {},
	render: (args) => {
		const [isOpen, setIsOpen] = useState(true);

		return (
			<EditExpenseDialog
				{...args}
				isOpen={isOpen}
				onClose={() => setIsOpen(false)}
				onSubmit={async () => {
					throw new Error("ネットワークエラーが発生しました");
				}}
			/>
		);
	},
	play: async ({ canvasElement }) => {
		const { userEvent, within, expect } = await import("@storybook/test");
		const canvas = within(canvasElement);

		// 送信ボタンをクリック
		const submitButton = canvas.getByRole("button", { name: "更新" });
		await userEvent.click(submitButton);

		// エラーメッセージが表示される
		await expect(
			await canvas.findByText("更新に失敗しました"),
		).toBeInTheDocument();
	},
};

/**
 * APIとの連携（MSWを使用）
 */
export const WithAPI: Story = {
	args: {},
	parameters: {
		msw: {
			handlers: [
				http.put("/api/transactions/:id", async ({ params }) => {
					console.log("更新API呼び出し:", params.id);
					return HttpResponse.json({
						id: params.id,
						amount: 2000,
						type: "expense",
						description: "更新された昼食代",
						date: "2024-01-15",
						category: mockCategories[0],
						createdAt: "2024-01-15T12:00:00Z",
						updatedAt: new Date().toISOString(),
					});
				}),
			],
		},
	},
};

/**
 * グローバルカテゴリを使用（カテゴリpropsなし）
 */
export const WithGlobalCategories: Story = {
	args: {
		categories: undefined,
	},
};

/**
 * 長い説明文を持つ取引
 */
export const WithLongDescription: Story = {
	args: {
		transaction: {
			...mockTransaction,
			description:
				"これは非常に長い説明文です。ユーザーが詳細な情報を入力した場合のUIの動作を確認するためのテストケースです。改行も含まれています。\n\n詳細情報：\n- 場所：東京駅\n- 参加者：3名\n- 目的：ビジネスランチ",
		},
	},
};

/**
 * 高額取引の編集
 */
export const LargeAmountTransaction: Story = {
	args: {
		transaction: {
			...mockTransaction,
			type: "expense" as const,
			description: "会議費",
			amount: 5000,
			category: mockCategories[0],
			categoryId: mockCategories[0].id,
		} as TransactionWithCategory,
	},
};
