/**
 * ページネーション関連のスタイル定数定義
 *
 * 設計方針:
 * - Tailwind CSSクラスの一元管理
 * - 責務の分離（スタイルに特化）
 * - as constによる厳密な型定義
 */

/**
 * ページネーションコンポーネントのスタイルクラス定数
 */
export const PAGINATION_STYLES = {
	/** コンテナ */
	CONTAINER:
		"flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-white border-t border-gray-200",
	/** ページ情報セクション */
	INFO_SECTION: "flex items-center gap-4",
	/** ページ情報テキスト */
	INFO_TEXT: "text-sm text-gray-700",
	/** 総件数テキスト */
	TOTAL_TEXT: "text-sm text-gray-500",
	/** ナビゲーションセクション */
	NAV_SECTION: "flex items-center gap-2",
	/** ページ番号ボタンコンテナ */
	PAGE_BUTTONS: "hidden sm:flex items-center gap-1",
	/** 前へ・次へボタン */
	NAV_BUTTON:
		"relative inline-flex items-center px-2 py-2 text-gray-400 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed",
	/** ページ番号ボタン（通常） */
	PAGE_BUTTON:
		"relative inline-flex items-center px-3 py-2 text-sm font-medium rounded-md bg-white border border-gray-300 text-gray-500 hover:bg-gray-50",
	/** ページ番号ボタン（現在のページ） */
	PAGE_BUTTON_ACTIVE:
		"relative inline-flex items-center px-3 py-2 text-sm font-medium rounded-md z-10 bg-indigo-50 border-indigo-500 text-indigo-600",
	/** 省略記号 */
	ELLIPSIS: "px-3 py-2 text-gray-500",
	/** 表示件数セレクタコンテナ */
	SELECT_CONTAINER: "ml-4",
	/** 表示件数セレクタ */
	SELECT:
		"block w-full rounded-md border-gray-300 py-1.5 pl-3 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500",
	/** アイコン */
	ICON: "w-5 h-5",
} as const;
