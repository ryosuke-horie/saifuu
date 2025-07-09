import { action } from "@storybook/addon-actions";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { mockCategories } from "../../../.storybook/mocks/data/categories";
import type { SubscriptionFormData } from "../../types/subscription";
import { SubscriptionForm } from "./SubscriptionForm";

/**
 * SubscriptionFormコンポーネントのStorybookストーリー
 *
 * サブスクリプションフォームコンポーネントの各種状態を確認できるストーリー集
 *
 * ストーリー内容:
 * - Default: 新規作成モード
 * - EditMode: 編集モード
 * - Submitting: 送信中状態
 * - WithValidationErrors: バリデーションエラー表示
 * - InteractionTest: インタラクションテスト
 * - Mobile/Desktop: レスポンシブテスト
 */

const meta: Meta<typeof SubscriptionForm> = {
	title: "Components/Subscriptions/SubscriptionForm",
	component: SubscriptionForm,
	parameters: {
		layout: "padded",
		docs: {
			description: {
				component: `
## SubscriptionFormコンポーネント

サブスクリプションの新規作成・編集を行うフォームコンポーネントです。

### 特徴
- **バリデーション**: クライアントサイドでの包括的なバリデーション
- **アクセシビリティ**: ARIA属性とキーボードナビゲーション対応
- **レスポンシブ**: モバイル・デスクトップに対応
- **状態管理**: 制御されたコンポーネントによる状態管理
- **エラーハンドリング**: リアルタイムエラー表示とフィードバック

### 技術仕様
- 新規作成・編集両モードに対応
- クライアントサイドバリデーション（必須項目、文字数制限、日付制約等）
- ローディング状態の適切な表示
- 日本語ローカライゼーション対応
- TypeScriptによる型安全性
				`,
			},
		},
	},
	argTypes: {
		onSubmit: {
			description: "フォーム送信時のコールバック",
			action: "submitted",
		},
		onCancel: {
			description: "キャンセル時のコールバック",
			action: "cancelled",
		},
		isSubmitting: {
			description: "送信中の状態",
			control: { type: "boolean" },
		},
		initialData: {
			description: "編集用の初期データ",
			control: { type: "object" },
		},
		className: {
			description: "追加のCSSクラス名",
			control: { type: "text" },
		},
	},
	args: {
		onSubmit: action("form-submitted"),
		onCancel: action("form-cancelled"),
		isSubmitting: false,
		categories: mockCategories,
		className: "",
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

// サンプルデータ
const sampleFormData: SubscriptionFormData = {
	name: "Netflix",
	amount: 1480,
	billingCycle: "monthly",
	nextBillingDate: "2025-07-01",
	categoryId: "cat-1",
	isActive: true,
	description: "人気の動画配信サービス。映画やドラマ、アニメなどが見放題。",
};

/**
 * デフォルト状態（新規作成モード）
 *
 * フォームの基本的な表示状態
 */
export const Default: Story = {
	parameters: {
		docs: {
			description: {
				story:
					"新規サブスクリプション作成時のフォーム表示です。全てのフィールドが空の状態で表示されます。",
			},
		},
		visualTest: {
			description: "Clean form layout with all empty fields",
			viewports: ["mobile", "tablet", "desktop"],
		},
	},
	tags: ["autodocs", "visual-test"],
};

/**
 * 編集モード
 *
 * 既存データを編集する際の表示状態
 */
export const EditMode: Story = {
	args: {
		initialData: sampleFormData,
	},
	parameters: {
		docs: {
			description: {
				story:
					"既存のサブスクリプションを編集する際の表示です。初期データが各フィールドに設定され、ボタンが「更新」になります。",
			},
		},
		visualTest: {
			description: "Pre-filled form appearance with existing data",
			viewports: ["desktop"],
		},
	},
	tags: ["autodocs", "visual-test"],
};

/**
 * 送信中状態
 *
 * フォーム送信処理中の表示状態
 */
export const Submitting: Story = {
	args: {
		initialData: sampleFormData,
		isSubmitting: true,
	},
	parameters: {
		docs: {
			description: {
				story:
					"フォーム送信中の状態です。全ての入力フィールドとボタンが無効化され、送信ボタンにローディングスピナーが表示されます。",
			},
		},
	},
};

/**
 * バリデーションエラー表示
 *
 * フォームバリデーションエラーの表示状態
 */
export const WithValidationErrors: Story = {
	args: {
		initialData: {
			name: "", // 空文字でエラー
			amount: 0, // 0でエラー
			billingCycle: "monthly",
			nextBillingDate: "2020-01-01", // 過去日でエラー
			category: "entertainment",
			description: "a".repeat(501), // 500文字超過でエラー
		},
	},
	parameters: {
		docs: {
			description: {
				story:
					"バリデーションエラーが発生した際の表示状態です。各フィールドでエラーが発生している状態を確認できます。",
			},
		},
		visualTest: {
			description: "Form with multiple validation errors displayed",
			viewports: ["mobile", "desktop"],
			captureAfterInteraction: true,
		},
	},
	tags: ["autodocs", "visual-test"],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// エラーを発生させるためにフィールドをタッチ
		const nameInput = canvas.getByLabelText(/サービス名/);
		const amountInput = canvas.getByLabelText(/料金（円）/);
		const dateInput = canvas.getByLabelText(/次回請求日/);
		const descriptionInput = canvas.getByLabelText(/説明（任意）/);

		await userEvent.click(nameInput);
		await userEvent.tab();
		await userEvent.click(amountInput);
		await userEvent.tab();
		await userEvent.click(dateInput);
		await userEvent.tab();
		await userEvent.click(descriptionInput);
		await userEvent.tab();

		// エラーメッセージの確認
		await expect(canvas.getByText("サービス名は必須です")).toBeInTheDocument();
		await expect(
			canvas.getByText("料金は1円以上で入力してください"),
		).toBeInTheDocument();
		await expect(
			canvas.getByText("次回請求日は今日以降の日付を入力してください"),
		).toBeInTheDocument();
		await expect(
			canvas.getByText("説明は500文字以内で入力してください"),
		).toBeInTheDocument();
	},
};

/**
 * 完全なフォーム入力テスト
 *
 * フォーム入力から送信までの完全なフロー
 */
export const InteractionTest: Story = {
	parameters: {
		docs: {
			description: {
				story:
					"フォームの入力から送信までの完全なインタラクションテストです。全てのフィールドへの入力と送信処理を確認できます。",
			},
		},
	},
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);

		// フォームフィールドへの入力
		await userEvent.type(canvas.getByLabelText(/サービス名/), "Netflix");
		await userEvent.type(canvas.getByLabelText(/料金（円）/), "1480");
		await userEvent.selectOptions(
			canvas.getByLabelText(/請求サイクル/),
			"monthly",
		);
		await userEvent.type(canvas.getByLabelText(/次回請求日/), "2025-07-01");
		await userEvent.selectOptions(
			canvas.getByLabelText(/カテゴリ/),
			"entertainment",
		);
		await userEvent.type(
			canvas.getByLabelText(/説明（任意）/),
			"人気の動画配信サービス",
		);

		// 送信ボタンのクリック
		await userEvent.click(canvas.getByRole("button", { name: "登録" }));

		// onSubmitが呼ばれることを確認
		await expect(args.onSubmit).toHaveBeenCalledWith({
			name: "Netflix",
			amount: 1480,
			billingCycle: "monthly",
			nextBillingDate: "2025-07-01",
			category: "entertainment",
			description: "人気の動画配信サービス",
		});
	},
};

/**
 * キャンセル処理テスト
 *
 * キャンセルボタンの動作確認
 */
export const CancelTest: Story = {
	parameters: {
		docs: {
			description: {
				story:
					"キャンセルボタンの動作テストです。キャンセルボタンをクリックしてonCancelコールバックが呼ばれることを確認します。",
			},
		},
	},
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);

		// キャンセルボタンのクリック
		await userEvent.click(canvas.getByRole("button", { name: "キャンセル" }));

		// onCancelが呼ばれることを確認
		await expect(args.onCancel).toHaveBeenCalled();
	},
};

/**
 * リアルタイムバリデーションテスト
 *
 * フィールドのブラー時にバリデーションが実行されることを確認
 */
export const RealTimeValidation: Story = {
	parameters: {
		docs: {
			description: {
				story:
					"リアルタイムバリデーションのテストです。フィールドをフォーカスしてからブラーした際にバリデーションが実行されることを確認します。",
			},
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// サービス名フィールドのバリデーション
		const nameInput = canvas.getByLabelText(/サービス名/);
		await userEvent.click(nameInput);
		await userEvent.tab(); // ブラーを発生

		// エラーメッセージが表示されることを確認
		await expect(canvas.getByText("サービス名は必須です")).toBeInTheDocument();

		// 有効な値を入力してエラーが消えることを確認
		await userEvent.type(nameInput, "Netflix");
		await userEvent.tab();

		// エラーメッセージが消えることを確認
		await expect(
			canvas.queryByText("サービス名は必須です"),
		).not.toBeInTheDocument();
	},
};

/**
 * 数値入力の境界値テスト
 *
 * 料金フィールドの境界値テスト
 */
export const AmountBoundaryTest: Story = {
	parameters: {
		docs: {
			description: {
				story:
					"料金フィールドの境界値テストです。0円、1円、100万円、100万1円の入力でバリデーションが正しく動作することを確認します。",
			},
		},
		visualTest: {
			description: "Field validation display for boundary values",
			viewports: ["desktop"],
			captureAfterInteraction: true,
		},
	},
	tags: ["autodocs", "visual-test"],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const amountInput = canvas.getByLabelText(/料金（円）/);

		// 0円でエラー
		await userEvent.clear(amountInput);
		await userEvent.type(amountInput, "0");
		await userEvent.tab();
		await expect(
			canvas.getByText("料金は1円以上で入力してください"),
		).toBeInTheDocument();

		// 1円で正常
		await userEvent.clear(amountInput);
		await userEvent.type(amountInput, "1");
		await userEvent.tab();
		await expect(
			canvas.queryByText("料金は1円以上で入力してください"),
		).not.toBeInTheDocument();

		// 100万円で正常
		await userEvent.clear(amountInput);
		await userEvent.type(amountInput, "1000000");
		await userEvent.tab();
		await expect(
			canvas.queryByText("料金は100万円以下で入力してください"),
		).not.toBeInTheDocument();

		// 100万1円でエラー
		await userEvent.clear(amountInput);
		await userEvent.type(amountInput, "1000001");
		await userEvent.tab();
		await expect(
			canvas.getByText("料金は100万円以下で入力してください"),
		).toBeInTheDocument();
	},
};

/**
 * 文字数カウンター表示テスト
 *
 * 説明フィールドの文字数カウンター機能
 */
export const CharacterCounterTest: Story = {
	parameters: {
		docs: {
			description: {
				story:
					"説明フィールドの文字数カウンター機能のテストです。入力に応じて文字数が更新されることを確認します。",
			},
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// 初期状態の確認
		await expect(canvas.getByText("0/500文字")).toBeInTheDocument();

		// 文字を入力
		const descriptionInput = canvas.getByLabelText(/説明（任意）/);
		await userEvent.type(descriptionInput, "テスト説明");

		// 文字数が更新されることを確認
		await expect(canvas.getByText("5/500文字")).toBeInTheDocument();
	},
};

/**
 * モバイル表示
 *
 * モバイルデバイスでの表示確認
 */
export const Mobile: Story = {
	parameters: {
		viewport: {
			defaultViewport: "mobile1",
		},
		docs: {
			description: {
				story:
					"モバイルデバイスでの表示です。フォームがモバイル画面に適したレイアウトで表示されます。",
			},
		},
		visualTest: {
			description: "Mobile responsive form layout",
			viewports: ["mobile"],
		},
	},
	tags: ["autodocs", "visual-test"],
};

/**
 * タブレット表示
 *
 * タブレットデバイスでの表示確認
 */
export const Tablet: Story = {
	parameters: {
		viewport: {
			defaultViewport: "tablet",
		},
		docs: {
			description: {
				story:
					"タブレットデバイスでの表示です。中程度の画面サイズに最適化されたレイアウトで表示されます。",
			},
		},
		visualTest: {
			description: "Tablet responsive form layout",
			viewports: ["tablet"],
		},
	},
	tags: ["autodocs", "visual-test"],
};

/**
 * デスクトップ表示
 *
 * デスクトップでの表示確認
 */
export const Desktop: Story = {
	parameters: {
		viewport: {
			defaultViewport: "desktop",
		},
		docs: {
			description: {
				story:
					"デスクトップでの表示です。広い画面を活用した最適なレイアウトで表示されます。",
			},
		},
	},
	tags: ["autodocs"],
};

/**
 * カスタムクラス
 *
 * 追加のCSSクラスを適用した状態
 */
export const WithCustomClass: Story = {
	args: {
		className: "border-2 border-blue-200 bg-blue-50",
	},
	parameters: {
		docs: {
			description: {
				story:
					"カスタムCSSクラスを適用した例です。ここでは青いボーダーと背景色を追加しています。",
			},
		},
	},
};

/**
 * 複数カテゴリの選択確認
 *
 * 全てのカテゴリオプションが正しく表示されることを確認
 */
export const AllCategoryOptions: Story = {
	parameters: {
		docs: {
			description: {
				story:
					"全てのカテゴリオプションが正しく表示されることを確認するストーリーです。",
			},
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		const categorySelect = canvas.getByLabelText(/カテゴリ/);

		// 全てのカテゴリオプションが存在することを確認
		await expect(canvas.getByText("エンタメ")).toBeInTheDocument();
		await expect(canvas.getByText("仕事")).toBeInTheDocument();
		await expect(canvas.getByText("ライフスタイル")).toBeInTheDocument();
		await expect(canvas.getByText("その他")).toBeInTheDocument();

		// カテゴリを変更
		await userEvent.selectOptions(categorySelect, "work");
		await expect(categorySelect).toHaveValue("work");
	},
};

/**
 * 請求サイクルの選択確認
 *
 * 月額・年額の選択が正しく動作することを確認
 */
export const BillingCycleOptions: Story = {
	parameters: {
		docs: {
			description: {
				story:
					"請求サイクル（月額・年額）の選択が正しく動作することを確認するストーリーです。",
			},
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		const billingCycleSelect = canvas.getByLabelText(/請求サイクル/);

		// 請求サイクルオプションが存在することを確認
		await expect(canvas.getByText("月額")).toBeInTheDocument();
		await expect(canvas.getByText("年額")).toBeInTheDocument();

		// デフォルトは月額
		await expect(billingCycleSelect).toHaveValue("monthly");

		// 年額に変更
		await userEvent.selectOptions(billingCycleSelect, "yearly");
		await expect(billingCycleSelect).toHaveValue("yearly");
	},
};
