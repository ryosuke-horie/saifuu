/**
 * ページネーション関連のユーティリティ関数
 *
 * 設計方針:
 * - 純粋関数として実装
 * - 型安全性の確保
 * - テスタビリティの向上
 */

import { PAGINATION_CONFIG, URL_PARAMS } from "../constants/pagination";
import type {
	PageNumberElement,
	PageNumberGeneratorConfig,
	UrlParams,
} from "../types/pagination";

/**
 * ページ番号の配列を生成する
 *
 * @param config - ページ番号生成の設定
 * @returns ページ番号または省略記号の配列
 */
export function generatePageNumbers(
	config: PageNumberGeneratorConfig,
): PageNumberElement[] {
	const {
		currentPage,
		totalPages,
		isMobile = false,
		maxPagesWithoutEllipsis = PAGINATION_CONFIG.MAX_PAGES_WITHOUT_ELLIPSIS,
		pagesAtStart = PAGINATION_CONFIG.PAGES_AT_START,
		pagesAtEnd = PAGINATION_CONFIG.PAGES_AT_END,
		pagesAroundCurrent = PAGINATION_CONFIG.PAGES_AROUND_CURRENT,
	} = config;

	// モバイル表示では番号ボタンを表示しない
	if (isMobile) {
		return [];
	}

	// ページ数が少ない場合は全て表示
	if (totalPages <= maxPagesWithoutEllipsis) {
		return Array.from({ length: totalPages }, (_, i) => i + 1);
	}

	const pages: PageNumberElement[] = [];
	const ellipsis = PAGINATION_CONFIG.ELLIPSIS;

	// 常に最初のページを表示
	pages.push(1);

	// 現在のページが最初の方にある場合
	if (currentPage <= pagesAtStart - 1) {
		// 1 2 3 4 ... N
		for (let i = 2; i <= Math.min(pagesAtStart, totalPages - 1); i++) {
			pages.push(i);
		}
		if (pagesAtStart < totalPages - 1) {
			pages.push(ellipsis);
		}
	}
	// 現在のページが最後の方にある場合
	else if (currentPage >= totalPages - pagesAtEnd + 2) {
		// 1 ... N-3 N-2 N-1 N
		pages.push(ellipsis);
		for (
			let i = Math.max(2, totalPages - pagesAtEnd + 1);
			i < totalPages;
			i++
		) {
			pages.push(i);
		}
	}
	// 現在のページが中間にある場合
	else {
		// 1 ... current-1 current current+1 ... N
		pages.push(ellipsis);

		// 現在のページの周辺を表示
		const start = Math.max(2, currentPage - pagesAroundCurrent);
		const end = Math.min(totalPages - 1, currentPage + pagesAroundCurrent);

		for (let i = start; i <= end; i++) {
			pages.push(i);
		}

		// 最後のページとの間に省略が必要な場合
		if (end < totalPages - 1) {
			pages.push(ellipsis);
		}
	}

	// 最後のページを追加（まだ追加されていない場合）
	if (pages[pages.length - 1] !== totalPages) {
		pages.push(totalPages);
	}

	return pages;
}

/**
 * URLパラメータから数値を取得する
 *
 * @param params - URLパラメータ
 * @param key - パラメータ名
 * @param defaultValue - デフォルト値
 * @returns パラメータの値またはデフォルト値
 */
export function getNumberFromUrlParam(
	params: URLSearchParams,
	key: string,
	defaultValue: number,
): number {
	const value = params.get(key);
	if (!value) {
		return defaultValue;
	}

	const parsed = Number.parseInt(value, 10);
	return Number.isNaN(parsed) || parsed < 1 ? defaultValue : parsed;
}

/**
 * URLパラメータから文字列を取得する
 *
 * @param params - URLパラメータ
 * @param key - パラメータ名
 * @param defaultValue - デフォルト値
 * @returns パラメータの値またはデフォルト値
 */
export function getStringFromUrlParam(
	params: URLSearchParams,
	key: string,
	defaultValue: string,
): string {
	return params.get(key) || defaultValue;
}

/**
 * URLパラメータを解析してオブジェクトに変換する
 *
 * @param searchString - URL検索文字列
 * @returns パラメータオブジェクト
 */
export function parseUrlParams(searchString: string): UrlParams {
	const params = new URLSearchParams(searchString);
	return {
		page: params.get(URL_PARAMS.PAGE) || undefined,
		limit: params.get(URL_PARAMS.LIMIT) || undefined,
		sortBy: params.get(URL_PARAMS.SORT_BY) || undefined,
		sortOrder: params.get(URL_PARAMS.SORT_ORDER) || undefined,
	} satisfies UrlParams;
}

/**
 * オブジェクトをURLパラメータ文字列に変換する
 *
 * @param params - パラメータオブジェクト
 * @returns URL検索文字列
 */
export function buildUrlParams(params: UrlParams): string {
	const searchParams = new URLSearchParams();

	if (params.page) {
		searchParams.set(URL_PARAMS.PAGE, params.page);
	}
	if (params.limit) {
		searchParams.set(URL_PARAMS.LIMIT, params.limit);
	}
	if (params.sortBy) {
		searchParams.set(URL_PARAMS.SORT_BY, params.sortBy);
	}
	if (params.sortOrder) {
		searchParams.set(URL_PARAMS.SORT_ORDER, params.sortOrder);
	}

	return searchParams.toString();
}

/**
 * URLを更新する（ブラウザ履歴を変更せずに）
 *
 * @param params - 更新するパラメータ
 */
export function updateUrlWithParams(params: UrlParams): void {
	if (typeof window === "undefined") {
		return;
	}

	const url = new URL(window.location.href);
	const searchString = buildUrlParams(params);
	url.search = searchString;

	window.history.replaceState({}, "", url.toString());
}

/**
 * ページ番号が有効な範囲内かを判定する
 *
 * @param page - ページ番号
 * @param totalPages - 総ページ数
 * @returns 有効な範囲内ならtrue
 */
export function isValidPageNumber(page: number, totalPages: number): boolean {
	return Number.isInteger(page) && page >= 1 && page <= totalPages;
}

/**
 * 表示件数が有効な選択肢かを判定する
 *
 * @param itemsPerPage - 表示件数
 * @param validOptions - 有効な選択肢の配列
 * @returns 有効な選択肢ならtrue
 */
export function isValidItemsPerPage(
	itemsPerPage: number,
	validOptions: readonly number[],
): boolean {
	return validOptions.includes(itemsPerPage);
}

/**
 * 総ページ数を計算する
 *
 * @param totalItems - 総アイテム数
 * @param itemsPerPage - 1ページあたりの表示件数
 * @returns 総ページ数
 */
export function calculateTotalPages(
	totalItems: number,
	itemsPerPage: number,
): number {
	if (totalItems <= 0 || itemsPerPage <= 0) {
		return 0;
	}
	return Math.ceil(totalItems / itemsPerPage);
}

/**
 * 現在のページで表示するアイテムの開始インデックスを計算する
 *
 * @param currentPage - 現在のページ（1始まり）
 * @param itemsPerPage - 1ページあたりの表示件数
 * @returns 開始インデックス（0始まり）
 */
export function calculateStartIndex(
	currentPage: number,
	itemsPerPage: number,
): number {
	return (currentPage - 1) * itemsPerPage;
}

/**
 * 現在のページで表示するアイテムの終了インデックスを計算する
 *
 * @param currentPage - 現在のページ（1始まり）
 * @param itemsPerPage - 1ページあたりの表示件数
 * @param totalItems - 総アイテム数
 * @returns 終了インデックス（0始まり、含まない）
 */
export function calculateEndIndex(
	currentPage: number,
	itemsPerPage: number,
	totalItems: number,
): number {
	const endIndex = currentPage * itemsPerPage;
	return Math.min(endIndex, totalItems);
}

/**
 * ページ範囲のラベルを生成する
 *
 * @param currentPage - 現在のページ
 * @param itemsPerPage - 1ページあたりの表示件数
 * @param totalItems - 総アイテム数
 * @returns "1-10 of 100" のような文字列
 */
export function generatePageRangeLabel(
	currentPage: number,
	itemsPerPage: number,
	totalItems: number,
): string {
	if (totalItems === 0) {
		return "0件";
	}

	const start = calculateStartIndex(currentPage, itemsPerPage) + 1;
	const end = calculateEndIndex(currentPage, itemsPerPage, totalItems);

	return `${start}-${end} / ${totalItems}件`;
}
