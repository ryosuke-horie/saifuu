/**
 * 汎用APIクエリフック
 *
 * APIの共通パターンを抽象化し、重複を排除する基盤フック
 * - 共通の状態管理（data, isLoading, error）
 * - 共通のfetch処理
 * - 共通のエラーハンドリング
 * - 共通のuseEffect
 * - 統一された戻り値形式
 */

import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { handleApiError } from "../index";

/**
 * useApiQueryフックのオプション
 *
 * 汎用APIクエリフックの設定を定義する型。
 * すべてのAPIクエリフックで共通的に使用される。
 */
export interface UseApiQueryOptions<TData> {
	/** APIを呼び出す関数 - 非同期でデータを取得する */
	queryFn: () => Promise<TData>;
	/** 初期データ - フェッチ前に表示されるデフォルト値 */
	initialData: TData;
	/** エラーコンテキスト - エラーメッセージ生成時に使用される文脈情報 */
	errorContext: string;
	/** フェッチを実行するかどうか（デフォルト: true） - falseの場合、自動フェッチをスキップ */
	shouldFetch?: boolean;
	/** 依存関係配列 - queryFnの依存関係を明示的に指定 */
	deps?: React.DependencyList;
}

/**
 * useApiQueryフックの戻り値型
 *
 * データ取得の状態と操作関数を含む統一された戻り値形式。
 * 既存のuseSubscriptions、useSubscription、useSubscriptionStatsと
 * 同じインターフェースを提供する。
 */
export interface UseApiQueryResult<TData> {
	/** 取得されたデータ */
	data: TData;
	/** ローディング状態 - trueの場合、データ取得中 */
	isLoading: boolean;
	/** エラーメッセージ - 取得失敗時に設定される */
	error: string | null;
	/** データを再取得する関数 - 手動でデータを再フェッチする */
	refetch: () => Promise<void>;
}

/**
 * 汎用APIクエリフック
 *
 * APIの共通パターンを抽象化した基盤フック。
 * 既存のuseSubscriptions、useSubscription、useSubscriptionStatsの
 * 重複コードを解消するために設計された。
 *
 * 【設計意図】
 * - 疎結合：各フックが独立して動作し、相互依存を最小化
 * - 高凝集：APIクエリに関する責務を一箇所に集約
 * - 再利用性：様々なAPIエンドポイントで使用可能
 * - 型安全性：TypeScriptジェネリクスで型安全を保証
 *
 * 【使用例】
 * ```typescript
 * const { data, isLoading, error, refetch } = useApiQuery({
 *   queryFn: () => subscriptionService.getSubscriptions(query),
 *   initialData: [],
 *   errorContext: "サブスクリプション一覧取得",
 *   deps: [query] // queryパラメータの変更を追跡
 * });
 * ```
 *
 * @template TData - 取得するデータの型
 * @param options - フックのオプション
 * @returns データ取得の状態と操作関数
 */
export function useApiQuery<TData>({
	queryFn,
	initialData,
	errorContext,
	shouldFetch = true,
	deps = [],
}: UseApiQueryOptions<TData>): UseApiQueryResult<TData> {
	// 共通のstate管理
	// 既存フックと同じ状態管理パターンを踏襲
	const [data, setData] = useState<TData>(initialData);
	const [isLoading, setIsLoading] = useState<boolean>(shouldFetch);
	const [error, setError] = useState<string | null>(null);

	// 共通のfetch処理
	// queryFn、errorContext、およびカスタム依存関係が変更されたときのみ再作成される
	// queryパラメータなどの外部依存関係も適切に追跡する
	const fetchData = useCallback(async () => {
		// ローディング開始とエラーリセット
		setIsLoading(true);
		setError(null);

		try {
			// APIクエリ実行
			const result = await queryFn();
			setData(result);
		} catch (err) {
			// 共通のエラーハンドリング
			// handleApiError関数により統一されたエラー処理を実行
			const apiError = handleApiError(err, errorContext);
			setError(apiError.message);
			// エラー発生時も前回のデータは保持される（UX向上）
		} finally {
			// 成功・失敗に関わらずローディング状態を解除
			setIsLoading(false);
		}
	}, [queryFn, errorContext, ...deps]);

	// refetch関数
	// 手動でデータ再取得を行う際に使用
	// fetchDataの依存関係のみで、不要な再作成を防ぐ
	const refetch = useCallback(async () => {
		await fetchData();
	}, [fetchData]);

	// 共通のuseEffect（初回フェッチとqueryFn変更時の再フェッチを統合）
	// shouldFetchがfalseの場合、自動フェッチをスキップ
	// queryFnが変更された場合、自動的に再フェッチを実行
	useEffect(() => {
		if (shouldFetch) {
			fetchData();
		}
	}, [fetchData, shouldFetch]);

	// 統一された戻り値形式
	// 既存のuseSubscriptions、useSubscription、useSubscriptionStatsと
	// 同じインターフェースを提供することで、置き換えが容易
	return {
		data,
		isLoading,
		error,
		refetch,
	};
}
