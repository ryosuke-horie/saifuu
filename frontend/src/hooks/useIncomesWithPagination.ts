/**
 * ページネーション対応の収入管理カスタムフック
 *
 * 収入データの取得、ページネーション、ソート機能を提供
 * URL同期機能も含む
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
	DEFAULT_ITEMS_PER_PAGE,
	DEFAULT_PAGE,
	SORT_CONFIG,
	URL_PARAMS,
} from "../constants/pagination";
import { apiClient } from "../lib/api/client";
import type {
	PaginationResponse,
	TransactionWithCategory,
} from "../lib/api/types";
import type {
	UseIncomesWithPaginationReturn,
	UsePaginationParams,
} from "../types/pagination";
import {
	getNumberFromUrlParam,
	updateUrlWithParams,
} from "../utils/pagination";

/**
 * ページネーション対応の収入データ管理フック
 *
 * Matt Pocock氏の型定義方針に準拠:
 * - 戻り値の型定義を明確に
 * - パラメータにはUsePaginationParams型を使用
 * - 内部関数はuseCallbackでメモ化
 */
export function useIncomesWithPagination({
	itemsPerPage = DEFAULT_ITEMS_PER_PAGE,
	syncWithUrl = false,
	sortBy = SORT_CONFIG.DEFAULT.FIELD as "date",
	sortOrder = SORT_CONFIG.DEFAULT.ORDER as "desc",
}: UsePaginationParams = {}): UseIncomesWithPaginationReturn {
	// URL同期が有効な場合はURLパラメータから初期値を取得
	const getInitialPage = useCallback(() => {
		if (syncWithUrl && typeof window !== "undefined") {
			const params = new URLSearchParams(window.location.search);
			return getNumberFromUrlParam(params, URL_PARAMS.PAGE, DEFAULT_PAGE);
		}
		return DEFAULT_PAGE;
	}, [syncWithUrl]);

	const getInitialLimit = useCallback(() => {
		if (syncWithUrl && typeof window !== "undefined") {
			const params = new URLSearchParams(window.location.search);
			return getNumberFromUrlParam(params, URL_PARAMS.LIMIT, itemsPerPage);
		}
		return itemsPerPage;
	}, [syncWithUrl, itemsPerPage]);

	// 状態管理（readonlyな配列として管理）
	const [incomes, setIncomes] = useState<readonly TransactionWithCategory[]>(
		[],
	);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [pagination, setPagination] = useState<PaginationResponse | null>(null);
	const [currentPage, setCurrentPage] = useState(getInitialPage());
	const [currentItemsPerPage, setCurrentItemsPerPage] = useState(
		getInitialLimit(),
	);

	// 初回取得フラグ
	const isInitialMount = useRef(true);

	// データ取得関数
	const fetchIncomes = useCallback(
		async (page: number, limit: number) => {
			try {
				setLoading(true);
				setError(null);

				const response = await apiClient.transactions.list({
					type: "income",
					page,
					limit,
					sort: sortBy,
					order: sortOrder,
				});

				setIncomes(response.data as TransactionWithCategory[]);
				setPagination(response.pagination || null);
			} catch (err) {
				const message =
					err instanceof Error ? err.message : "データの取得に失敗しました";
				setError(message);
				setIncomes([]);
				setPagination(null);
			} finally {
				setLoading(false);
			}
		},
		[sortBy, sortOrder],
	);

	// URL更新関数（ユーティリティ関数を使用）
	const updateUrl = useCallback(
		(page: number, limit: number) => {
			if (!syncWithUrl) return;

			updateUrlWithParams({
				page: page.toString(),
				limit: limit.toString(),
				sortBy,
				sortOrder,
			});
		},
		[syncWithUrl, sortBy, sortOrder],
	);

	// ページ変更ハンドラー
	const onPageChange = useCallback(
		(page: number) => {
			setCurrentPage(page);
			updateUrl(page, currentItemsPerPage);
			fetchIncomes(page, currentItemsPerPage);
		},
		[currentItemsPerPage, fetchIncomes, updateUrl],
	);

	// 表示件数変更ハンドラー
	const onItemsPerPageChange = useCallback(
		(newItemsPerPage: number) => {
			setCurrentItemsPerPage(newItemsPerPage);
			setCurrentPage(1); // 表示件数変更時は1ページ目に戻る
			updateUrl(1, newItemsPerPage);
			fetchIncomes(1, newItemsPerPage);
		},
		[fetchIncomes, updateUrl],
	);

	// データ再取得
	const refetch = useCallback(async () => {
		await fetchIncomes(currentPage, currentItemsPerPage);
	}, [currentPage, currentItemsPerPage, fetchIncomes]);

	// 初回データ取得のみ（ページやアイテム数の変更はハンドラー経由で行う）
	// biome-ignore lint/correctness/useExhaustiveDependencies: <初回マウント時のみ実行するため依存配列は空>
	useEffect(() => {
		if (isInitialMount.current) {
			isInitialMount.current = false;
			fetchIncomes(currentPage, currentItemsPerPage);
		}
	}, []);

	// UseIncomesWithPaginationReturn型に準拠した戻り値
	return {
		incomes,
		items: incomes, // UsePaginationReturn互換性のため
		loading,
		error,
		pagination: pagination
			? {
					currentPage: pagination.currentPage,
					totalPages: pagination.totalPages,
					totalItems: pagination.totalItems,
					itemsPerPage: pagination.itemsPerPage,
				}
			: null,
		currentPage,
		onPageChange,
		onItemsPerPageChange,
		refetch,
	} satisfies UseIncomesWithPaginationReturn;
}
