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
	 * 暫定対応: 100件を超える取引データに対応するため1000件に増加
	 * 将来的には月別フィルタやページネーション対応を検討する
	 *
	 * 環境変数での上書き例:
	 * process.env.NEXT_PUBLIC_DEFAULT_TRANSACTION_LIMIT || 1000
	 */
	DEFAULT_TRANSACTION_LIMIT: 1000,

	/**
	 * API呼び出しのタイムアウト時間（ミリ秒）
	 */
	REQUEST_TIMEOUT: 30000,

	/**
	 * リトライ回数
	 */
	MAX_RETRIES: 3,
} as const;
