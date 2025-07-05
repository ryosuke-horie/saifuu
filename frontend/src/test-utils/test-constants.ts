// テスト用定数
// テスト全体で使用される共通の定数を定義
// 一貫性のあるテストIDやアクセシビリティラベルを提供

// テストID定数
export const TEST_IDS = {
	// レイアウト
	HEADER: "header",
	NAVIGATION: "navigation",
	MAIN_CONTENT: "main-content",

	// フォーム
	SUBSCRIPTION_FORM: "subscription-form",
	SUBSCRIPTION_NAME_INPUT: "subscription-name-input",
	SUBSCRIPTION_AMOUNT_INPUT: "subscription-amount-input",
	SUBSCRIPTION_CATEGORY_SELECT: "subscription-category-select",
	SUBSCRIPTION_CYCLE_SELECT: "subscription-cycle-select",
	SUBSCRIPTION_SUBMIT_BUTTON: "subscription-submit-button",

	// リスト
	SUBSCRIPTION_LIST: "subscription-list",
	SUBSCRIPTION_ITEM: "subscription-item",

	// ダイアログ
	DIALOG_OVERLAY: "dialog-overlay",
	DIALOG_CONTENT: "dialog-content",
	DIALOG_CLOSE_BUTTON: "dialog-close-button",

	// エラー
	ERROR_MESSAGE: "error-message",
	ERROR_BOUNDARY: "error-boundary",

	// 404ページ
	NOT_FOUND_PAGE: "not-found-page",
} as const;

// ARIAラベル定数
export const ARIA_LABELS = {
	// ナビゲーション
	MAIN_NAVIGATION: "メインナビゲーション",

	// フォーム
	SUBSCRIPTION_NAME: "サブスクリプション名",
	SUBSCRIPTION_AMOUNT: "月額料金",
	SUBSCRIPTION_CATEGORY: "カテゴリー",
	SUBSCRIPTION_CYCLE: "支払い周期",

	// ボタン
	ADD_SUBSCRIPTION: "新規サブスクリプションを追加",
	SAVE_SUBSCRIPTION: "サブスクリプションを保存",
	CANCEL: "キャンセル",
	CLOSE_DIALOG: "ダイアログを閉じる",

	// ステータス
	LOADING: "読み込み中",
	ERROR: "エラー",
} as const;

// テスト用のタイムアウト値
export const TEST_TIMEOUTS = {
	SHORT: 1000,
	MEDIUM: 5000,
	LONG: 10000,
} as const;

// テスト用のビューポートサイズ
export const VIEWPORT_SIZES = {
	MOBILE: { width: 375, height: 667 },
	TABLET: { width: 768, height: 1024 },
	DESKTOP: { width: 1280, height: 800 },
} as const;

// テスト用のエラーメッセージ
export const ERROR_MESSAGES = {
	REQUIRED_FIELD: "この項目は必須です",
	INVALID_AMOUNT: "金額は0より大きい数値を入力してください",
	NETWORK_ERROR: "ネットワークエラーが発生しました",
	SERVER_ERROR: "サーバーエラーが発生しました",
	UNKNOWN_ERROR: "予期しないエラーが発生しました",
} as const;
