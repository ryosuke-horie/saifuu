/**
 * アプリケーション全体で使用される定数
 * 
 * 環境変数や設定ファイルで上書き可能な値は、
 * 将来的に環境変数からの読み込みに対応することを考慮
 */

/**
 * API関連の定数
 */
export const API_CONFIG = {
	/**
	 * 取引一覧取得時のデフォルト取得件数
	 * 
	 * 将来的にページネーション対応を検討する際は、
	 * この値を基準にページサイズを決定する
	 * 
	 * 環境変数での上書き例:
	 * process.env.NEXT_PUBLIC_DEFAULT_TRANSACTION_LIMIT || 100
	 */
	DEFAULT_TRANSACTION_LIMIT: 100,

	/**
	 * API呼び出しのタイムアウト時間（ミリ秒）
	 */
	REQUEST_TIMEOUT: 30000,

	/**
	 * リトライ回数
	 */
	MAX_RETRIES: 3,
} as const;

/**
 * UI関連の定数
 */
export const UI_CONFIG = {
	/**
	 * トーストメッセージの表示時間（ミリ秒）
	 */
	TOAST_DURATION: 5000,

	/**
	 * ローディング表示の最小表示時間（ミリ秒）
	 * ちらつき防止用
	 */
	MIN_LOADING_TIME: 300,

	/**
	 * モーダルのアニメーション時間（ミリ秒）
	 */
	MODAL_ANIMATION_DURATION: 200,
} as const;

/**
 * バリデーション関連の定数
 */
export const VALIDATION_CONFIG = {
	/**
	 * 最大金額（円）
	 */
	MAX_AMOUNT: 99999999,

	/**
	 * 最小金額（円）
	 */
	MIN_AMOUNT: 1,

	/**
	 * 説明文の最大文字数
	 */
	MAX_DESCRIPTION_LENGTH: 255,

	/**
	 * カテゴリ名の最大文字数
	 */
	MAX_CATEGORY_NAME_LENGTH: 50,
} as const;