/**
 * テスト用ユーティリティ
 *
 * React Queryを使用するコンポーネントのテストに必要な設定を提供
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type RenderOptions, render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

// テスト用のQueryClientを作成
// リトライを無効化し、エラーをコンソールに出力しない設定
const createTestQueryClient = () =>
	new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
			},
			mutations: {
				retry: false,
			},
		},
	});

// すべてのプロバイダーをラップするコンポーネント
export function AllTheProviders({ children }: { children: ReactNode }) {
	const testQueryClient = createTestQueryClient();
	return (
		<QueryClientProvider client={testQueryClient}>
			{children}
		</QueryClientProvider>
	);
}

// カスタムrender関数
export function renderWithProviders(
	ui: ReactElement,
	options?: Omit<RenderOptions, "wrapper">,
) {
	return render(ui, { wrapper: AllTheProviders, ...options });
}

// re-export everything
export * from "@testing-library/react";
