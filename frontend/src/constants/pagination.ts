/**
 * ページネーション関連の定数定義
 *
 * 設計方針:
 * - マジックナンバーの排除
 * - 設定値の一元管理
 * - as constによる厳密な型定義
 */

/**
 * 表示件数オプション
 * ドロップダウンで選択可能な表示件数の選択肢
 */
export const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100] as const;

/**
 * デフォルトの表示件数
 */
export const DEFAULT_ITEMS_PER_PAGE = 20 as const;

/**
 * デフォルトの開始ページ
 */
export const DEFAULT_PAGE = 1 as const;

/**
 * ページネーション表示設定
 */
export const PAGINATION_CONFIG = {
	/** 省略記号を使わずに全てのページ番号を表示する最大ページ数 */
	MAX_PAGES_WITHOUT_ELLIPSIS: 5,
	/** 最初のページ周辺で表示するページ数 */
	PAGES_AT_START: 4,
	/** 最後のページ周辺で表示するページ数 */
	PAGES_AT_END: 3,
	/** 現在のページ周辺で表示するページ数（片側） */
	PAGES_AROUND_CURRENT: 1,
	/** 省略記号文字 */
	ELLIPSIS: "..." as const,
} as const;

/**
 * URLパラメータ名
 */
export const URL_PARAMS = {
	PAGE: "page",
	LIMIT: "limit",
	SORT_BY: "sortBy",
	SORT_ORDER: "sortOrder",
} as const;

/**
 * ソート設定
 */
export const SORT_CONFIG = {
	/** ソートフィールド */
	FIELDS: {
		DATE: "date",
		AMOUNT: "amount",
	},
	/** ソート順序 */
	ORDER: {
		ASC: "asc",
		DESC: "desc",
	},
	/** デフォルト設定 */
	DEFAULT: {
		FIELD: "date",
		ORDER: "desc",
	},
} as const;

/**
 * スタイルクラス定数
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

/** 表示件数オプションの型 */
export type ItemsPerPageOption = (typeof ITEMS_PER_PAGE_OPTIONS)[number];

/** URLパラメータ名の型 */
export type UrlParamKey = (typeof URL_PARAMS)[keyof typeof URL_PARAMS];

/** ソートフィールドの型 */
export type SortField =
	(typeof SORT_CONFIG.FIELDS)[keyof typeof SORT_CONFIG.FIELDS];

/** ソート順序の型 */
export type SortOrder =
	(typeof SORT_CONFIG.ORDER)[keyof typeof SORT_CONFIG.ORDER];
