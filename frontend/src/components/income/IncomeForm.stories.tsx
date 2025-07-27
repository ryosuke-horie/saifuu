import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { INCOME_CATEGORIES } from "../../../../shared/config/categories";
import { IncomeForm } from "./IncomeForm";

const meta: Meta<typeof IncomeForm> = {
	title: "Components/Income/IncomeForm",
	component: IncomeForm,
	parameters: {
		layout: "padded",
		docs: {
			description: {
				component:
					"収入データを登録・編集するためのフォームコンポーネント。金額、日付、カテゴリ、説明を入力できます。",
			},
		},
	},
	argTypes: {
		onSubmit: { action: "submitted" },
		onCancel: { action: "cancelled" },
		isSubmitting: {
			control: "boolean",
			description: "送信中の状態",
		},
		initialData: {
			control: "object",
			description: "編集時の初期データ",
		},
		categories: {
			control: "object",
			description: "収入カテゴリ一覧",
		},
	},
	args: {
		categories: INCOME_CATEGORIES.map((cat) => ({
			id: cat.id,
			name: cat.name,
			type: cat.type,
			color: cat.color,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		})),
		isSubmitting: false,
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

// 基本的な新規登録フォーム
export const Default: Story = {
	args: {},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// フォーム要素が表示されていることを確認
		await expect(canvas.getByLabelText(/金額（円）/)).toBeInTheDocument();
		await expect(canvas.getByLabelText(/日付/)).toBeInTheDocument();
		await expect(canvas.getByLabelText(/説明（任意）/)).toBeInTheDocument();
		await expect(canvas.getByLabelText(/カテゴリ/)).toBeInTheDocument();
	},
};

// 編集モード
export const EditMode: Story = {
	args: {
		initialData: {
			amount: 250000,
			type: "income",
			date: "2025-01-15",
			description: "1月分給与",
			categoryId: "salary",
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// 初期値が設定されていることを確認
		await expect(canvas.getByDisplayValue("250000")).toBeInTheDocument();
		await expect(canvas.getByDisplayValue("2025-01-15")).toBeInTheDocument();
		await expect(canvas.getByDisplayValue("1月分給与")).toBeInTheDocument();
		await expect(
			canvas.getByRole("button", { name: "更新" }),
		).toBeInTheDocument();
	},
};

// 送信中状態
export const Loading: Story = {
	args: {
		isSubmitting: true,
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// フォーム要素が無効化されていることを確認
		await expect(canvas.getByLabelText(/金額（円）/)).toBeDisabled();
		await expect(canvas.getByLabelText(/日付/)).toBeDisabled();
		await expect(canvas.getByLabelText(/説明（任意）/)).toBeDisabled();
		await expect(canvas.getByLabelText(/カテゴリ/)).toBeDisabled();
		await expect(canvas.getByRole("button", { name: "登録" })).toBeDisabled();
		await expect(
			canvas.getByRole("button", { name: "キャンセル" }),
		).toBeDisabled();
	},
};

// バリデーションエラー
export const WithValidationError: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();

		// 送信ボタンをクリック（必須フィールドが空の状態）
		await user.click(canvas.getByRole("button", { name: "登録" }));

		// エラーメッセージが表示されることを確認
		await expect(
			canvas.getByText("金額は0より大きい値を入力してください"),
		).toBeInTheDocument();
		await expect(
			canvas.getByText("日付を入力してください"),
		).toBeInTheDocument();
	},
};

// 負の金額入力
export const NegativeAmountError: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();

		// 負の金額を入力
		const amountInput = canvas.getByLabelText(/金額（円）/);
		await user.type(amountInput, "-5000");
		await user.tab();

		// エラーメッセージが表示されることを確認
		await expect(
			canvas.getByText("収入金額は0より大きい値を入力してください"),
		).toBeInTheDocument();
	},
};

// 文字数制限エラー
export const DescriptionLengthError: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();

		// 500文字を超える説明を入力
		const descriptionInput = canvas.getByLabelText(/説明（任意）/);
		const longText = "あ".repeat(501);
		await user.type(descriptionInput, longText);
		await user.tab();

		// エラーメッセージが表示されることを確認
		await expect(
			canvas.getByText("説明は500文字以内で入力してください"),
		).toBeInTheDocument();
	},
};

// 正常な入力フロー
export const SuccessfulSubmission: Story = {
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();

		// フォームに入力
		await user.type(canvas.getByLabelText(/金額（円）/), "300000");
		await user.type(canvas.getByLabelText(/日付/), "2025-01-31");
		await user.type(
			canvas.getByLabelText(/説明（任意）/),
			"1月分給与と通勤手当",
		);
		await user.selectOptions(canvas.getByLabelText(/カテゴリ/), "salary");

		// 送信
		await user.click(canvas.getByRole("button", { name: "登録" }));

		// onSubmitが呼ばれることを確認
		await expect(args.onSubmit).toHaveBeenCalledWith({
			amount: 300000,
			type: "income",
			date: "2025-01-31",
			description: "1月分給与と通勤手当",
			categoryId: "salary",
		});
	},
};

// カテゴリなしの状態
export const NoCategories: Story = {
	args: {
		categories: [],
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// カテゴリが読み込み中と表示されることを確認
		await expect(
			canvas.getByText("カテゴリを読み込み中..."),
		).toBeInTheDocument();
		await expect(canvas.getByLabelText(/カテゴリ/)).toBeDisabled();
	},
};

// モバイルビュー
export const Mobile: Story = {
	parameters: {
		viewport: {
			defaultViewport: "mobile1",
		},
	},
};

// ダークモード（将来の拡張用）
export const DarkMode: Story = {
	parameters: {
		backgrounds: {
			default: "dark",
		},
	},
	decorators: [
		(Story) => (
			<div className="dark bg-gray-900 p-4">
				<Story />
			</div>
		),
	],
};
