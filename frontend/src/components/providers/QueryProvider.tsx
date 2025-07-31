"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";

// QueryProviderのプロパティ型定義
type QueryProviderProps = {
	children: ReactNode;
};

/**
 * React Query (TanStack Query) のプロバイダーコンポーネント
 * 
 * このコンポーネントは、アプリケーション全体でReact Queryの機能を利用可能にします。
 * クライアントサイドでのみ動作し、以下の機能を提供します：
 * - データフェッチングの状態管理
 * - キャッシュ管理
 * - バックグラウンドでのデータ再取得
 * - エラーハンドリング
 * 
 * 設定の詳細：
 * - staleTime: 0ms（常に新鮮なデータを取得）
 * - gcTime: 5分（ガベージコレクションまでの時間）
 * - refetchOnWindowFocus: false（ウィンドウフォーカス時の再取得を無効化）
 * - retry: 1（エラー時の再試行回数）
 */
export function QueryProvider({ children }: QueryProviderProps) {
	// QueryClientインスタンスをステート管理
	// 再レンダリング時に新しいインスタンスが作成されないようにするため
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						// データが古いと判定されるまでの時間（0 = 常に新鮮）
						staleTime: 0,
						// ガベージコレクションまでの時間（5分）
						gcTime: 5 * 60 * 1000,
						// ウィンドウフォーカス時の再取得を無効化
						refetchOnWindowFocus: false,
						// エラー時の再試行回数
						retry: 1,
						// 再試行の遅延時間を計算する関数
						retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
					},
					mutations: {
						// ミューテーションのエラー時の再試行回数
						retry: 1,
					},
				},
			}),
	);

	return (
		<QueryClientProvider client={queryClient}>
			{children}
		</QueryClientProvider>
	);
}