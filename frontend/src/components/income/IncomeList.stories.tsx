/**
 * IncomeListコンポーネントのStorybookストーリー
 *
 * 収入一覧表示の各種状態を視覚的に確認するためのストーリー
 * - デフォルト状態（収入データあり）
 * - ローディング状態
 * - エラー状態
 * - 空状態
 * - 多数データ
 * - インタラクティブ（編集・削除操作）
 */

import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import type { Transaction } from "../../lib/api/types";
import { IncomeList } from "./IncomeList";

const meta: Meta<typeof IncomeList> = {
	title: "Income/IncomeList",
	component: IncomeList,
	parameters: {
		layout: "padded",
		docs: {
			description: {
				component:
					"収入データを一覧表示するテーブルコンポーネント。緑系統のアクセントカラーで収入を視覚的に識別。",
			},
		},
	},
	argTypes: {
		isLoading: {
			control: "boolean",
			description: "ローディング状態の制御",
		},
		error: {
			control: "text",
			description: "エラーメッセージ",
		},
		onEdit: {
			action: "onEdit",
			description: "編集ボタンクリック時のコールバック",
		},
		onDelete: {
			action: "onDelete",
			description: "削除ボタンクリック時のコールバック",
		},
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

// モックデータ
const mockIncomeData: Transaction[] = [
	{
		id: "1",
		amount: 300000,
		type: "income",
		description: "12月給与",
		date: "2024-12-25",
		category: {
			id: "salary",
			name: "給与",
			type: "income",
			color: "#10b981",
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		},
		createdAt: "2024-12-25T00:00:00Z",
		updatedAt: "2024-12-25T00:00:00Z",
	},
	{
		id: "2",
		amount: 100000,
		type: "income",
		description: "冬季ボーナス",
		date: "2024-12-10",
		category: {
			id: "bonus",
			name: "ボーナス",
			type: "income",
			color: "#059669",
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		},
		createdAt: "2024-12-10T00:00:00Z",
		updatedAt: "2024-12-10T00:00:00Z",
	},
	{
		id: "3",
		amount: 15000,
		type: "income",
		description: "ブログ執筆料",
		date: "2024-12-05",
		category: {
			id: "side_business",
			name: "副業",
			type: "income",
			color: "#34d399",
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		},
		createdAt: "2024-12-05T00:00:00Z",
		updatedAt: "2024-12-05T00:00:00Z",
	},
	{
		id: "4",
		amount: 5000,
		type: "income",
		description: "株式配当",
		date: "2024-11-30",
		category: {
			id: "investment",
			name: "投資収益",
			type: "income",
			color: "#6ee7b7",
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		},
		createdAt: "2024-11-30T00:00:00Z",
		updatedAt: "2024-11-30T00:00:00Z",
	},
];

// 基本的な表示
export const Default: Story = {
	args: {
		transactions: mockIncomeData,
	},
};

// ローディング状態
export const Loading: Story = {
	args: {
		transactions: [],
		isLoading: true,
	},
};

// エラー状態
export const ErrorState: Story = {
	args: {
		transactions: [],
		error: "収入データの取得に失敗しました。時間をおいて再度お試しください。",
	},
};

// 空状態
export const Empty: Story = {
	args: {
		transactions: [],
	},
};

// 多数のデータ
export const ManyItems: Story = {
	args: {
		transactions: Array.from({ length: 20 }, (_, i) => ({
			id: `${i + 1}`,
			amount: Math.floor(Math.random() * 500000) + 10000,
			type: "income" as const,
			description: i % 3 === 0 ? null : `収入項目 ${i + 1}`,
			date: new Date(2024, 11 - Math.floor(i / 5), 28 - (i % 28))
				.toISOString()
				.split("T")[0],
			category: mockIncomeData[i % 4].category,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		})),
	},
};

// インタラクティブ（編集・削除可能）
export const Interactive: Story = {
	args: {
		transactions: mockIncomeData,
		onEdit: (transaction: Transaction) => {
			console.log("Edit clicked:", transaction);
		},
		onDelete: (id: string) => {
			console.log("Delete clicked:", id);
		},
	},
};

// インタラクションテスト - 編集ボタン
export const EditInteraction: Story = {
	args: {
		...Interactive.args,
	},
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);

		// 編集ボタンを探してクリック
		const editButtons = await canvas.findAllByText("編集");
		await userEvent.click(editButtons[0]);

		// コールバックが呼ばれたことを確認
		await expect(args.onEdit).toHaveBeenCalledWith(mockIncomeData[0]);
	},
};

// インタラクションテスト - 削除ボタン
export const DeleteInteraction: Story = {
	args: {
		...Interactive.args,
	},
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);

		// 削除ボタンを探してクリック
		const deleteButtons = await canvas.findAllByText("削除");
		await userEvent.click(deleteButtons[0]);

		// コールバックが呼ばれたことを確認
		await expect(args.onDelete).toHaveBeenCalledWith("1");
	},
};

// レスポンシブ表示（モバイル）
export const Mobile: Story = {
	args: {
		transactions: mockIncomeData.slice(0, 2),
	},
	parameters: {
		viewport: {
			defaultViewport: "mobile1",
		},
	},
};

// レスポンシブ表示（タブレット）
export const Tablet: Story = {
	args: {
		transactions: mockIncomeData,
	},
	parameters: {
		viewport: {
			defaultViewport: "tablet",
		},
	},
};
