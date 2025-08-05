/**
 * ページネーション関連の型定義
 *
 * 設計方針:
 * - Matt Pocock氏の型定義方針に準拠
 * - satisfies演算子の活用
 * - 型推論の最大化
 * - ブランド型による型安全性の向上
 */

import type { TransactionWithCategory } from "../lib/api/types";

/**
 * ページ番号の型
 * 1以上の整数を想定
 */
export type PageNumber = number;

/**
 * ページネーションの基本情報
 */
export interface PaginationInfo {
	/** 現在のページ番号（1始まり） */
	readonly currentPage: number;
	/** 総ページ数 */
	readonly totalPages: number;
	/** 総アイテム数 */
	readonly totalItems: number;
	/** 1ページあたりの表示件数 */
	readonly itemsPerPage: number;
}

/**
 * ページネーションのイベントハンドラー
 */
export interface PaginationHandlers {
	/** ページ変更時のコールバック */
	readonly onPageChange: (page: number) => void;
	/** 表示件数変更時のコールバック */
	readonly onItemsPerPageChange: (itemsPerPage: number) => void;
}

/**
 * ページネーションコンポーネントのプロパティ
 */
export interface PaginationProps extends PaginationInfo, PaginationHandlers {
	/** モバイル表示フラグ */
	readonly isMobile?: boolean;
	/** 追加のCSSクラス */
	readonly className?: string;
}

/**
 * ページ番号の表示要素
 * 数値または省略記号
 */
export type PageNumberElement = number | "...";

/**
 * ページネーションフックのパラメータ
 */
export interface UsePaginationParams {
	/** 1ページあたりの表示件数 */
	readonly itemsPerPage?: number;
	/** URLとの同期を有効にするか */
	readonly syncWithUrl?: boolean;
	/** ソートフィールド */
	readonly sortBy?: "date" | "amount";
	/** ソート順序 */
	readonly sortOrder?: "asc" | "desc";
}

/**
 * ページネーションフックの戻り値
 */
export interface UsePaginationReturn<T> {
	/** データ配列 */
	readonly items: readonly T[];
	/** 読み込み中フラグ */
	readonly loading: boolean;
	/** エラーメッセージ */
	readonly error: string | null;
	/** ページネーション情報 */
	readonly pagination: PaginationInfo | null;
	/** 現在のページ */
	readonly currentPage: number;
	/** ページ変更ハンドラー */
	readonly onPageChange: (page: number) => void;
	/** 表示件数変更ハンドラー */
	readonly onItemsPerPageChange: (itemsPerPage: number) => void;
	/** データ再取得 */
	readonly refetch: () => Promise<void>;
}

/**
 * URLパラメータの型
 */
export interface UrlParams {
	readonly page?: string;
	readonly limit?: string;
	readonly sortBy?: string;
	readonly sortOrder?: string;
}

/**
 * ソート設定の型
 */
export interface SortConfig {
	readonly field: "date" | "amount";
	readonly order: "asc" | "desc";
}

/**
 * 収入用のページネーションフック戻り値
 */
export type UseIncomesWithPaginationReturn =
	UsePaginationReturn<TransactionWithCategory> & {
		/** 収入データ（エイリアス） */
		readonly incomes: readonly TransactionWithCategory[];
	};

/**
 * 支出用のページネーションフック戻り値
 */
export type UseExpensesWithPaginationReturn =
	UsePaginationReturn<TransactionWithCategory> & {
		/** 支出データ（エイリアス） */
		readonly expenses: readonly TransactionWithCategory[];
	};

/**
 * ページ番号生成ロジックの設定
 */
export interface PageNumberGeneratorConfig {
	/** 現在のページ */
	readonly currentPage: number;
	/** 総ページ数 */
	readonly totalPages: number;
	/** モバイル表示フラグ */
	readonly isMobile?: boolean;
	/** 省略記号なしで表示する最大ページ数 */
	readonly maxPagesWithoutEllipsis?: number;
	/** 最初のページ周辺で表示するページ数 */
	readonly pagesAtStart?: number;
	/** 最後のページ周辺で表示するページ数 */
	readonly pagesAtEnd?: number;
	/** 現在のページ周辺で表示するページ数 */
	readonly pagesAroundCurrent?: number;
}

/**
 * ページネーション状態管理の型
 */
export interface PaginationState {
	/** 現在のページ */
	readonly currentPage: number;
	/** 1ページあたりの表示件数 */
	readonly itemsPerPage: number;
	/** ソート設定 */
	readonly sort: SortConfig;
}

/**
 * ページネーションアクションの型
 */
export type PaginationAction =
	| { readonly type: "SET_PAGE"; readonly payload: number }
	| { readonly type: "SET_ITEMS_PER_PAGE"; readonly payload: number }
	| { readonly type: "SET_SORT"; readonly payload: SortConfig }
	| { readonly type: "RESET" };
