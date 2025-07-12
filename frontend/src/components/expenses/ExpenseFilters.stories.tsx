/**
 * ExpenseFiltersコンポーネントのStorybookストーリー
 *
 * フィルタリング機能の各状態と動作を視覚的に確認できるストーリー集
 */

import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import type { ExpenseFiltersState } from "../../types/expense";
import { convertGlobalCategoriesToCategory } from "../../utils/categories";
import { ExpenseFilters } from "./ExpenseFilters";

const meta: Meta<typeof ExpenseFilters> = {
	title: "Components/Expenses/ExpenseFilters",
	component: ExpenseFilters,
	parameters: {
		layout: "padded",
		docs: {
			description: {
				component:
					"支出・収入の絞り込み機能を提供するフィルタリングコンポーネント。期間指定、カテゴリ絞り込み、種別絞り込み、金額範囲指定などの機能を提供します。",
			},
		},
	},
	argTypes: {
		onFiltersChange: { action: "onFiltersChange" },
		categories: {
			control: "object",
			description: "カテゴリ一覧",
		},
		initialFilters: {
			control: "object",
			description: "初期フィルター状態",
		},
		className: {
			control: "text",
			description: "追加のCSSクラス名",
		},
	},
	args: {
		categories: [
			...convertGlobalCategoriesToCategory("expense"),
			...convertGlobalCategoriesToCategory("income"),
		],
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * デフォルト状態
 * 全てのフィルターが未選択の初期状態
 */
export const Default: Story = {
	args: {
		onFiltersChange: (filters: ExpenseFiltersState) =>
			console.log("Filters changed:", filters),
	},
};

/**
 * フィルター適用済み
 * 各フィルターが適用された状態
 */
export const Applied: Story = {
	args: {
		initialFilters: {
			type: "expense",
			categoryIds: ["food", "transportation"],
			period: "current_month",
			minAmount: 1000,
			maxAmount: 5000,
		},
		onFiltersChange: (filters: ExpenseFiltersState) =>
			console.log("Filters changed:", filters),
	},
};

/**
 * カスタム期間指定
 * 期間をカスタムで指定する状態
 */
export const CustomPeriod: Story = {
	args: {
		initialFilters: {
			period: "custom",
			dateFrom: "2025-01-01",
			dateTo: "2025-01-31",
		},
		onFiltersChange: (filters: ExpenseFiltersState) =>
			console.log("Filters changed:", filters),
	},
};

/**
 * モバイルレイアウト
 * モバイル端末での表示確認
 */
export const Mobile: Story = {
	parameters: {
		viewport: {
			defaultViewport: "mobile1",
		},
	},
	args: {
		onFiltersChange: (filters: ExpenseFiltersState) =>
			console.log("Filters changed:", filters),
	},
};

/**
 * タブレットレイアウト
 * タブレット端末での表示確認
 */
export const Tablet: Story = {
	parameters: {
		viewport: {
			defaultViewport: "tablet",
		},
	},
	args: {
		onFiltersChange: (filters: ExpenseFiltersState) =>
			console.log("Filters changed:", filters),
	},
};

/**
 * 期間フィルターのインタラクションテスト
 */
export const PeriodFilterInteraction: Story = {
	args: {
		onFiltersChange: (filters: ExpenseFiltersState) =>
			console.log("Filters changed:", filters),
	},
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);

		// 期間選択
		const periodSelect = canvas.getByLabelText("期間");
		await userEvent.selectOptions(periodSelect, "current_month");

		// onFiltersChangeが呼ばれることを確認
		await expect(args.onFiltersChange).toHaveBeenCalledWith(
			expect.objectContaining({
				period: "current_month",
			}),
		);

		// カスタム期間を選択
		await userEvent.selectOptions(periodSelect, "custom");

		// 日付入力フィールドが表示されることを確認
		await expect(canvas.getByLabelText("開始日")).toBeInTheDocument();
		await expect(canvas.getByLabelText("終了日")).toBeInTheDocument();
	},
};

/**
 * カテゴリフィルターのインタラクションテスト
 */
export const CategoryFilterInteraction: Story = {
	args: {
		onFiltersChange: (filters: ExpenseFiltersState) =>
			console.log("Filters changed:", filters),
	},
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);

		// カテゴリチェックボックスをクリック
		const foodCheckbox = canvas.getByRole("checkbox", { name: "食費" });
		const transportCheckbox = canvas.getByRole("checkbox", { name: "交通費" });

		await userEvent.click(foodCheckbox);
		await userEvent.click(transportCheckbox);

		// onFiltersChangeが呼ばれることを確認
		await expect(args.onFiltersChange).toHaveBeenCalledWith(
			expect.objectContaining({
				categoryIds: ["food", "transportation"],
			}),
		);
	},
};

/**
 * 金額範囲フィルターのインタラクションテスト
 */
export const AmountRangeInteraction: Story = {
	args: {
		onFiltersChange: (filters: ExpenseFiltersState) =>
			console.log("Filters changed:", filters),
	},
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);

		// 最小金額を入力
		const minAmountInput = canvas.getByLabelText("最小金額");
		await userEvent.clear(minAmountInput);
		await userEvent.type(minAmountInput, "1000");

		// 最大金額を入力
		const maxAmountInput = canvas.getByLabelText("最大金額");
		await userEvent.clear(maxAmountInput);
		await userEvent.type(maxAmountInput, "5000");

		// onFiltersChangeが呼ばれることを確認
		await expect(args.onFiltersChange).toHaveBeenCalledWith(
			expect.objectContaining({
				minAmount: 1000,
				maxAmount: 5000,
			}),
		);
	},
};

/**
 * リセット機能のインタラクションテスト
 */
export const ResetInteraction: Story = {
	args: {
		initialFilters: {
			type: "expense",
			categoryIds: ["food"],
			minAmount: 1000,
		},
		onFiltersChange: (filters: ExpenseFiltersState) =>
			console.log("Filters changed:", filters),
	},
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);

		// 初期状態の確認
		const typeSelect = canvas.getByLabelText("種別");
		await expect((typeSelect as unknown as HTMLSelectElement).value).toBe(
			"expense",
		);

		// リセットボタンをクリック
		const resetButton = canvas.getByRole("button", { name: "リセット" });
		await userEvent.click(resetButton);

		// フィルターがクリアされることを確認
		await expect(args.onFiltersChange).toHaveBeenCalledWith({});
		await expect((typeSelect as unknown as HTMLSelectElement).value).toBe("");
	},
};

/**
 * エラー状態
 * 無効な金額入力時のエラー表示
 */
export const ErrorState: Story = {
	args: {
		onFiltersChange: (filters: ExpenseFiltersState) =>
			console.log("Filters changed:", filters),
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// 無効な金額を入力
		const minAmountInput = canvas.getByLabelText("最小金額");
		await userEvent.clear(minAmountInput);
		await userEvent.type(minAmountInput, "-100");

		// エラーメッセージが表示されることを確認
		await expect(
			canvas.getByText("金額は0以上の数値を入力してください"),
		).toBeInTheDocument();
	},
};

/**
 * キーボードナビゲーション
 * Tab キーでの操作確認
 */
export const KeyboardNavigation: Story = {
	args: {
		onFiltersChange: (filters: ExpenseFiltersState) =>
			console.log("Filters changed:", filters),
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Tab キーで各要素にフォーカス
		await userEvent.tab();
		const periodSelect = canvas.getByLabelText("期間");
		await expect(periodSelect).toHaveFocus();

		// カテゴリの最初のチェックボックスにフォーカス
		await userEvent.tab();
		const firstCategoryCheckbox = canvas.getAllByRole("checkbox")[0];
		await expect(firstCategoryCheckbox).toHaveFocus();

		await userEvent.tab();
		const typeSelect = canvas.getByLabelText("種別");
		await expect(typeSelect).toHaveFocus();
	},
};
