import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { NewSubscriptionDialog } from "./NewSubscriptionDialog";

const meta: Meta<typeof NewSubscriptionDialog> = {
	title: "Components/Subscriptions/NewSubscriptionDialog",
	component: NewSubscriptionDialog,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component: `
新規サブスクリプション登録ダイアログコンポーネント

DialogコンポーネントとSubscriptionFormコンポーネントを組み合わせて、
モーダル形式での新規サブスクリプション登録機能を提供します。

## 特徴
- フォーム送信成功時にダイアログを自動で閉じる
- キャンセル時とダイアログクローズ時の適切な処理
- 送信中はダイアログの閉じる操作を無効化
- アクセシビリティとユーザビリティを考慮した実装

## 使用場面
- サブスクリプション管理画面での新規登録
- ユーザーがプラスボタンをクリックした際の登録フロー
				`,
			},
		},
	},
	argTypes: {
		isOpen: {
			control: "boolean",
			description: "ダイアログの表示状態",
		},
		isSubmitting: {
			control: "boolean",
			description: "フォーム送信中の状態",
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
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

// 基本的な表示状態
export const Default: Story = {
	args: {
		isOpen: true,
		isSubmitting: false,
	},
};

// 送信中の状態
export const Submitting: Story = {
	args: {
		isOpen: true,
		isSubmitting: true,
	},
	parameters: {
		docs: {
			description: {
				story:
					"フォーム送信中の状態。送信ボタンにローディングアイコンが表示され、オーバーレイクリックやESCキーでの閉じる操作が無効化されます。",
			},
		},
	},
};

// 閉じた状態
export const Closed: Story = {
	args: {
		isOpen: false,
		isSubmitting: false,
	},
	parameters: {
		docs: {
			description: {
				story: "ダイアログが閉じている状態。何も表示されません。",
			},
		},
	},
};

// インタラクション: フォーム入力とキャンセル
export const InteractionCancel: Story = {
	args: {
		isOpen: true,
		isSubmitting: false,
	},
	parameters: {
		docs: {
			description: {
				story: "キャンセルボタンのクリック動作をテストします。",
			},
		},
	},
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);

		// ダイアログが表示されていることを確認
		const dialog = canvas.getByRole("dialog");
		await expect(dialog).toBeInTheDocument();

		// タイトルが正しく表示されていることを確認
		await expect(
			canvas.getByText("新規サブスクリプション登録"),
		).toBeInTheDocument();

		// キャンセルボタンをクリック
		const cancelButton = canvas.getByRole("button", { name: "キャンセル" });
		await userEvent.click(cancelButton);

		// onCloseが呼ばれることを確認
		await expect(args.onClose).toHaveBeenCalled();
	},
};

// インタラクション: フォーム送信
export const InteractionSubmit: Story = {
	args: {
		isOpen: true,
		isSubmitting: false,
	},
	parameters: {
		docs: {
			description: {
				story: "フォームの入力と送信動作をテストします。",
			},
		},
	},
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);

		// フォーム要素の存在確認
		const nameInput = canvas.getByLabelText(/サービス名/);
		const amountInput = canvas.getByLabelText(/料金/);
		const nextBillingDateInput = canvas.getByLabelText(/次回請求日/);

		// フォームに値を入力
		await userEvent.type(nameInput, "Netflix");
		await userEvent.type(amountInput, "1490");

		// 次回請求日を設定（今日から1ヶ月後）
		const nextMonth = new Date();
		nextMonth.setMonth(nextMonth.getMonth() + 1);
		const nextMonthString = nextMonth.toISOString().split("T")[0];
		await userEvent.type(nextBillingDateInput, nextMonthString);

		// 登録ボタンをクリック
		const submitButton = canvas.getByRole("button", { name: "登録" });
		await userEvent.click(submitButton);

		// onSubmitが呼ばれることを確認
		await expect(args.onSubmit).toHaveBeenCalledWith({
			name: "Netflix",
			amount: 1490,
			billingCycle: "monthly",
			nextBillingDate: nextMonthString,
			category: "other",
			description: "",
		});

		// onCloseも呼ばれることを確認（送信成功時の自動クローズ）
		await expect(args.onClose).toHaveBeenCalled();
	},
};

// インタラクション: ダイアログクローズボタン
export const InteractionCloseButton: Story = {
	args: {
		isOpen: true,
		isSubmitting: false,
	},
	parameters: {
		docs: {
			description: {
				story: "ダイアログ右上のクローズボタンの動作をテストします。",
			},
		},
	},
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);

		// ダイアログのクローズボタンをクリック
		const closeButton = canvas.getByRole("button", { name: "閉じる" });
		await userEvent.click(closeButton);

		// onCloseが呼ばれることを確認
		await expect(args.onClose).toHaveBeenCalled();
	},
};

// バリデーションエラーの表示
export const ValidationError: Story = {
	args: {
		isOpen: true,
		isSubmitting: false,
	},
	parameters: {
		docs: {
			description: {
				story: "フォームバリデーションエラーの表示をテストします。",
			},
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// 空のフォームで送信ボタンをクリック
		const submitButton = canvas.getByRole("button", { name: "登録" });
		await userEvent.click(submitButton);

		// バリデーションエラーが表示されることを確認
		await expect(canvas.getByText("サービス名は必須です")).toBeInTheDocument();
		await expect(
			canvas.getByText("料金は1円以上で入力してください"),
		).toBeInTheDocument();
		await expect(canvas.getByText("次回請求日は必須です")).toBeInTheDocument();
	},
};

// レスポンシブ表示: モバイル画面
export const MobileView: Story = {
	args: {
		isOpen: true,
		isSubmitting: false,
	},
	parameters: {
		viewport: {
			defaultViewport: "mobile1",
		},
		docs: {
			description: {
				story:
					"モバイル画面でのダイアログ表示。画面幅に応じて適切にレイアウトされます。",
			},
		},
	},
};

// レスポンシブ表示: タブレット画面
export const TabletView: Story = {
	args: {
		isOpen: true,
		isSubmitting: false,
	},
	parameters: {
		viewport: {
			defaultViewport: "tablet",
		},
		docs: {
			description: {
				story: "タブレット画面でのダイアログ表示。",
			},
		},
	},
};
