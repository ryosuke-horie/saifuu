/**
 * useIncomeFilters カスタムフック
 *
 * 収入フィルターの状態管理とURLパラメータとの同期を行う
 * フィルター状態の変更、リセット、URLとの双方向バインディングを提供
 */

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { debounce, throttle } from "../lib/performance";
import type { IncomeFiltersState, IncomePeriodType } from "../types/income";

/**
 * URLパラメータからフィルター状態を復元
 */
const parseFiltersFromURL = (
	searchParams: URLSearchParams,
): IncomeFiltersState => {
	const filters: IncomeFiltersState = {};

	// 期間の復元
	const period = searchParams.get("period");
	if (isValidPeriod(period)) {
		filters.period = period;
	}

	// 日付の復元
	const startDate = searchParams.get("startDate");
	if (startDate) {
		filters.startDate = startDate;
	}

	const endDate = searchParams.get("endDate");
	if (endDate) {
		filters.endDate = endDate;
	}

	// カテゴリの復元
	const categories = searchParams.get("categories");
	if (categories) {
		filters.categories = categories.split(",");
	}

	// 金額範囲の復元
	const minAmount = searchParams.get("minAmount");
	if (minAmount) {
		const amount = Number(minAmount);
		if (!Number.isNaN(amount) && amount >= 0) {
			filters.minAmount = amount;
		}
	}

	const maxAmount = searchParams.get("maxAmount");
	if (maxAmount) {
		const amount = Number(maxAmount);
		if (!Number.isNaN(amount) && amount >= 0) {
			filters.maxAmount = amount;
		}
	}

	return filters;
};

/**
 * 期間タイプのバリデーション
 */
const isValidPeriod = (period: string | null): period is IncomePeriodType => {
	return (
		period === "thisMonth" ||
		period === "lastMonth" ||
		period === "thisYear" ||
		period === "custom"
	);
};

/**
 * フィルター状態をURLパラメータに変換
 */
const buildURLParams = (filters: IncomeFiltersState): string => {
	const params = new URLSearchParams();

	if (filters.period) {
		params.set("period", filters.period);
	}

	if (filters.startDate) {
		params.set("startDate", filters.startDate);
	}

	if (filters.endDate) {
		params.set("endDate", filters.endDate);
	}

	if (filters.categories?.length) {
		params.set("categories", filters.categories.join(","));
	}

	if (filters.minAmount !== undefined) {
		params.set("minAmount", filters.minAmount.toString());
	}

	if (filters.maxAmount !== undefined) {
		params.set("maxAmount", filters.maxAmount.toString());
	}

	return params.toString();
};

/**
 * 空の値を除去
 */
const cleanFilters = (filters: IncomeFiltersState): IncomeFiltersState => {
	const cleaned = { ...filters };

	// Matt Pocock方針に従った型安全なObject.keysの使用
	(Object.keys(cleaned) as Array<keyof IncomeFiltersState>).forEach((key) => {
		const value = cleaned[key];
		if (
			value === "" ||
			value === undefined ||
			(Array.isArray(value) && value.length === 0)
		) {
			delete cleaned[key];
		}
	});

	return cleaned;
};

/**
 * useIncomeFiltersフックのオプション
 */
interface UseIncomeFiltersOptions {
	/** 初期フィルター状態 */
	initialFilters?: IncomeFiltersState;
	/** URLパラメータとの同期を無効化 */
	disableUrlSync?: boolean;
	/** フィルター変更時のコールバック */
	onFiltersChange?: (filters: IncomeFiltersState) => void;
}

/**
 * useIncomeFiltersフックの戻り値
 */
interface UseIncomeFiltersReturn {
	/** 現在のフィルター状態 */
	filters: IncomeFiltersState;
	/** フィルターを更新 */
	updateFilter: <K extends keyof IncomeFiltersState>(
		key: K,
		value: IncomeFiltersState[K],
	) => void;
	/** 複数のフィルターを一括更新 */
	updateFilters: (updates: Partial<IncomeFiltersState>) => void;
	/** フィルターをリセット */
	resetFilters: () => void;
	/** カテゴリの選択/解除 */
	toggleCategory: (categoryId: string) => void;
	/** 選択されているカテゴリ */
	selectedCategories: string[];
}

/**
 * useIncomeFilters カスタムフック
 */
export const useIncomeFilters = ({
	initialFilters = {},
	disableUrlSync = false,
	onFiltersChange,
}: UseIncomeFiltersOptions = {}): UseIncomeFiltersReturn => {
	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();

	const [filters, setFilters] = useState<IncomeFiltersState>(() => {
		if (!disableUrlSync) {
			return { ...initialFilters, ...parseFiltersFromURL(searchParams) };
		}
		return initialFilters;
	});

	const [selectedCategories, setSelectedCategories] = useState<string[]>(
		() => filters.categories || [],
	);

	// 初回レンダリングかどうかを追跡
	const isFirstRender = useRef(true);
	// URL更新中かどうかを追跡（循環を防ぐため）
	const isUpdatingUrl = useRef(false);

	// URLパラメータの変更を監視
	useEffect(() => {
		if (!disableUrlSync && !isUpdatingUrl.current) {
			const urlFilters = parseFiltersFromURL(searchParams);
			setFilters((prev) => ({ ...prev, ...urlFilters }));
			if (urlFilters.categories) {
				setSelectedCategories(urlFilters.categories);
			}
		}
	}, [searchParams, disableUrlSync]);

	// URL更新関数をdebounceで最適化（300ms遅延）
	// 頻繁なURL更新を防ぎ、パフォーマンスを向上
	const debouncedUrlUpdate = useMemo(
		() =>
			debounce((cleanedFilters: IncomeFiltersState) => {
				if (!disableUrlSync) {
					isUpdatingUrl.current = true;
					const queryString = buildURLParams(cleanedFilters);
					const newURL = queryString ? `${pathname}?${queryString}` : pathname;
					router.replace(newURL);
					// URL更新完了後にフラグをリセット
					setTimeout(() => {
						isUpdatingUrl.current = false;
					}, 100);
				}
			}, 300),
		[router, pathname, disableUrlSync],
	);

	// コールバック関数をthrottleで最適化（500ms間隔）
	// 頻繁なコールバック実行を制限し、パフォーマンスを向上
	const throttledCallback = useMemo(
		() => (onFiltersChange ? throttle(onFiltersChange, 500) : undefined),
		[onFiltersChange],
	);

	// フィルター変更時の処理
	// biome-ignore lint/correctness/useExhaustiveDependencies: <throttledCallbackとdebouncedUrlUpdateは意図的に除外>
	useEffect(() => {
		// 初回レンダリング時はスキップ
		if (isFirstRender.current) {
			isFirstRender.current = false;
			return;
		}

		const cleanedFilters = cleanFilters({
			...filters,
			categories:
				selectedCategories.length > 0 ? selectedCategories : undefined,
		});

		// スロットルされたコールバックを実行
		throttledCallback?.(cleanedFilters);

		// デバウンスされたURL更新を実行
		debouncedUrlUpdate(cleanedFilters);
	}, [filters, selectedCategories]);

	// フィルターを更新
	const updateFilter = useCallback(
		<K extends keyof IncomeFiltersState>(
			key: K,
			value: IncomeFiltersState[K],
		) => {
			setFilters((prev) => ({ ...prev, [key]: value }));
		},
		[],
	);

	// 複数のフィルターを一括更新
	const updateFilters = useCallback((updates: Partial<IncomeFiltersState>) => {
		setFilters((prev) => ({ ...prev, ...updates }));
	}, []);

	// フィルターをリセット
	const resetFilters = useCallback(() => {
		setFilters({});
		setSelectedCategories([]);

		if (!disableUrlSync) {
			router.replace(pathname);
		}
	}, [router, pathname, disableUrlSync]);

	// カテゴリの選択/解除
	const toggleCategory = useCallback((categoryId: string) => {
		setSelectedCategories((prev) =>
			prev.includes(categoryId)
				? prev.filter((id) => id !== categoryId)
				: [...prev, categoryId],
		);
	}, []);

	return {
		filters,
		updateFilter,
		updateFilters,
		resetFilters,
		toggleCategory,
		selectedCategories,
	};
};
