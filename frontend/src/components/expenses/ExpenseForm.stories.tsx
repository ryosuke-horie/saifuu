import { action } from "@storybook/addon-actions";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { mockCategories } from "../../../.storybook/mocks/data/categories";
import type { ExpenseFormData } from "../../types/expense";
import { ExpenseForm } from "./ExpenseForm";

/**
 * ExpenseFormコンポーネントのStorybookストーリー
 *
 * 支出・収入フォームコンポーネントの各種状態を確認できるストーリー集
 *
 * ストーリー内容:
 * - Default: 新規作成モード
 * - EditMode: 編集モード
 * - Submitting: 送信中状態
 * - WithValidationErrors: バリデーションエラー表示
 * - InteractionTest: インタラクションテスト
 * - Mobile/Desktop: レスポンシブテスト
 */

const meta: Meta<typeof ExpenseForm> = {
	title: "Components/Expenses/ExpenseForm",
	component: ExpenseForm,
	parameters: {
		layout: "padded",
		docs: {
			description: {
				component: `
## ExpenseFormコンポーネント

支出・収入の新規作成・編集を行うフォームコンポーネントです。

### 特徴
- **バリデーション**: クライアントサイドでの包括的なバリデーション
- **アクセシビリティ**: ARIA属性とキーボードナビゲーション対応
- **レスポンシブ**: モバイル・デスクトップに対応
- **状態管理**: 制御されたコンポーネントによる状態管理
- **エラーハンドリング**: リアルタイムエラー表示とフィードバック

### 技術仕様
- 新規作成・編集両モードに対応
- クライアントサイドバリデーション（必須項目、文字数制限、金額制約等）
- ローディング状態の適切な表示
- 日本語ローカライゼーション対応
- TypeScriptによる型安全性
- カテゴリ別フィルタリング（収入・支出それぞれのカテゴリ）
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
		categories: {
			description: "カテゴリ一覧",
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
const sampleExpenseData: ExpenseFormData = {
	amount: 1000,
	type: "expense",
	date: "2025-07-09",
	description: "コンビニ弁当",
	categoryId: "cat-1",
};

const sampleIncomeData: ExpenseFormData = {
	amount: 300000,
	type: "income",
	date: "2025-07-01",
	description: "給与",
	categoryId: "cat-5",
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
					"新規支出・収入作成時のフォーム表示です。全てのフィールドが空の状態で表示されます。",
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
 * 編集モード（支出）
 *
 * 既存の支出データを編集する際の表示状態
 */
export const EditExpenseMode: Story = {
	args: {
		initialData: sampleExpenseData,
	},
	parameters: {
		docs: {
			description: {
				story:
					"既存の支出を編集する際の表示です。初期データが各フィールドに設定され、ボタンが「更新」になります。",
			},
		},
		visualTest: {
			description: "Pre-filled form appearance with existing expense data",
			viewports: ["desktop"],
		},
	},
	tags: ["autodocs", "visual-test"],
};

/**
 * 編集モード（収入）
 *
 * 既存の収入データを編集する際の表示状態
 */
export const EditIncomeMode: Story = {
	args: {
		initialData: sampleIncomeData,
	},
	parameters: {
		docs: {
			description: {
				story:
					"既存の収入を編集する際の表示です。初期データが各フィールドに設定され、収入カテゴリが表示されます。",
			},
		},
		visualTest: {
			description: "Pre-filled form appearance with existing income data",
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
		initialData: sampleExpenseData,
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
			amount: 0, // 0でエラー
			type: "", // 空文字でエラー
			date: "", // 空文字でエラー
			description: "a".repeat(501), // 500文字超過でエラー
			categoryId: "",
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
		const amountInput = canvas.getByLabelText(/金額（円）/);
		const typeSelect = canvas.getByLabelText(/種別/);
		const dateInput = canvas.getByLabelText(/日付/);
		const descriptionInput = canvas.getByLabelText(/説明/);

		await userEvent.click(amountInput);
		await userEvent.tab();
		await userEvent.click(typeSelect);
		await userEvent.tab();
		await userEvent.click(dateInput);
		await userEvent.tab();
		await userEvent.click(descriptionInput);
		await userEvent.tab();

		// エラーメッセージの確認
		await expect(
			canvas.getByText("金額は1円以上で入力してください"),
		).toBeInTheDocument();
		await expect(canvas.getByText("種別は必須です")).toBeInTheDocument();
		await expect(canvas.getByText("日付は必須です")).toBeInTheDocument();
		await expect(
			canvas.getByText("説明は500文字以内で入力してください"),
		).toBeInTheDocument();
	},
};

/**
 * 完全なフォーム入力テスト（支出）
 *
 * 支出フォーム入力から送信までの完全なフロー
 */
export const ExpenseInteractionTest: Story = {
	parameters: {
		docs: {
			description: {
				story:
					"支出フォームの入力から送信までの完全なインタラクションテストです。全てのフィールドへの入力と送信処理を確認できます。",
			},
		},
	},
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);

		// フォームフィールドへの入力
		await userEvent.type(canvas.getByLabelText(/金額（円）/), "1000");
		await userEvent.selectOptions(canvas.getByLabelText(/種別/), "expense");
		await userEvent.type(canvas.getByLabelText(/日付/), "2025-07-09");
		await userEvent.type(canvas.getByLabelText(/説明/), "コンビニ弁当");
		await userEvent.selectOptions(canvas.getByLabelText(/カテゴリ/), "cat-1");

		// 送信ボタンのクリック
		await userEvent.click(canvas.getByRole("button", { name: "登録" }));

		// onSubmitが呼ばれることを確認
		await expect(args.onSubmit).toHaveBeenCalledWith({
			amount: 1000,
			type: "expense",
			date: "2025-07-09",
			description: "コンビニ弁当",
			categoryId: "cat-1",
		});
	},
};

/**
 * 完全なフォーム入力テスト（収入）
 *
 * 収入フォーム入力から送信までの完全なフロー
 */
export const IncomeInteractionTest: Story = {
	parameters: {
		docs: {
			description: {
				story:
					"収入フォームの入力から送信までの完全なインタラクションテストです。収入カテゴリの選択も含めて確認できます。",
			},
		},
	},
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);

		// フォームフィールドへの入力
		await userEvent.type(canvas.getByLabelText(/金額（円）/), "300000");
		await userEvent.selectOptions(canvas.getByLabelText(/種別/), "income");
		await userEvent.type(canvas.getByLabelText(/日付/), "2025-07-01");
		await userEvent.type(canvas.getByLabelText(/説明/), "給与");
		await userEvent.selectOptions(canvas.getByLabelText(/カテゴリ/), "cat-5");

		// 送信ボタンのクリック
		await userEvent.click(canvas.getByRole("button", { name: "登録" }));

		// onSubmitが呼ばれることを確認
		await expect(args.onSubmit).toHaveBeenCalledWith({
			amount: 300000,
			type: "income",
			date: "2025-07-01",
			description: "給与",
			categoryId: "cat-5",
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

		// 金額フィールドのバリデーション
		const amountInput = canvas.getByLabelText(/金額（円）/);
		await userEvent.click(amountInput);
		await userEvent.tab(); // ブラーを発生

		// エラーメッセージが表示されることを確認
		await expect(
			canvas.getByText("金額は1円以上で入力してください"),
		).toBeInTheDocument();

		// 有効な値を入力してエラーが消えることを確認
		await userEvent.type(amountInput, "1000");
		await userEvent.tab();

		// エラーメッセージが消えることを確認
		await expect(
			canvas.queryByText("金額は1円以上で入力してください"),
		).not.toBeInTheDocument();
	},
};

/**
 * 金額入力の境界値テスト
 *
 * 金額フィールドの境界値テスト
 */
export const AmountBoundaryTest: Story = {
	parameters: {
		docs: {
			description: {
				story:
					"金額フィールドの境界値テストです。0円、1円、100万円、100万1円の入力でバリデーションが正しく動作することを確認します。",
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
		const amountInput = canvas.getByLabelText(/金額（円）/);

		// 0円でエラー
		await userEvent.clear(amountInput);
		await userEvent.type(amountInput, "0");
		await userEvent.tab();
		await expect(
			canvas.getByText("金額は1円以上で入力してください"),
		).toBeInTheDocument();

		// 1円で正常
		await userEvent.clear(amountInput);
		await userEvent.type(amountInput, "1");
		await userEvent.tab();
		await expect(
			canvas.queryByText("金額は1円以上で入力してください"),
		).not.toBeInTheDocument();

		// 100万円で正常
		await userEvent.clear(amountInput);
		await userEvent.type(amountInput, "1000000");
		await userEvent.tab();
		await expect(
			canvas.queryByText("金額は100万円以下で入力してください"),
		).not.toBeInTheDocument();

		// 100万1円でエラー
		await userEvent.clear(amountInput);
		await userEvent.type(amountInput, "1000001");
		await userEvent.tab();
		await expect(
			canvas.getByText("金額は100万円以下で入力してください"),
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
		const descriptionInput = canvas.getByLabelText(/説明/);
		await userEvent.type(descriptionInput, "テスト説明");

		// 文字数が更新されることを確認
		await expect(canvas.getByText("5/500文字")).toBeInTheDocument();
	},
};

/**
 * カテゴリフィルタリングテスト
 *
 * 種別選択によるカテゴリフィルタリング機能
 */
export const CategoryFilteringTest: Story = {
	parameters: {
		docs: {
			description: {
				story:
					"種別選択によるカテゴリフィルタリング機能のテストです。支出・収入を選択した際に対応するカテゴリのみが表示されることを確認します。",
			},
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		const typeSelect = canvas.getByLabelText(/種別/);

		// 最初は種別未選択のため、カテゴリは「カテゴリを選択してください」のみ
		await expect(
			canvas.getByText("カテゴリを選択してください"),
		).toBeInTheDocument();

		// 支出を選択
		await userEvent.selectOptions(typeSelect, "expense");

		// 支出カテゴリが表示されることを確認
		await expect(canvas.getByText("エンターテイメント")).toBeInTheDocument();
		await expect(canvas.getByText("仕事・ビジネス")).toBeInTheDocument();
		await expect(canvas.getByText("ライフスタイル")).toBeInTheDocument();
		await expect(canvas.getByText("その他")).toBeInTheDocument();

		// 収入を選択
		await userEvent.selectOptions(typeSelect, "income");

		// 収入カテゴリが表示されることを確認
		await expect(canvas.getByText("給与")).toBeInTheDocument();
		// 支出カテゴリは表示されない
		await expect(
			canvas.queryByText("エンターテイメント"),
		).not.toBeInTheDocument();
	},
};

/**
 * 日付フィールドテスト
 *
 * 日付入力フィールドの動作確認
 */
export const DateFieldTest: Story = {
	parameters: {
		docs: {
			description: {
				story:
					"日付入力フィールドの動作確認です。日付の入力と表示が正しく行われることを確認します。",
			},
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		const dateInput = canvas.getByLabelText(/日付/);

		// 日付を入力
		await userEvent.type(dateInput, "2025-07-09");

		// 入力された日付が表示されることを確認
		await expect(dateInput).toHaveValue("2025-07-09");
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
		className: "border-2 border-green-200 bg-green-50",
	},
	parameters: {
		docs: {
			description: {
				story:
					"カスタムCSSクラスを適用した例です。ここでは緑いボーダーと背景色を追加しています。",
			},
		},
	},
};

/**
 * 空のカテゴリリスト
 *
 * カテゴリデータが空の場合の表示
 */
export const EmptyCategories: Story = {
	args: {
		categories: [],
	},
	parameters: {
		docs: {
			description: {
				story:
					"カテゴリデータが空の場合の表示です。カテゴリセレクトボックスがローディング状態になります。",
			},
		},
	},
};
