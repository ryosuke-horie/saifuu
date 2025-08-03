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
