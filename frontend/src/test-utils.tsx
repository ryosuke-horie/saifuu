// テスト用ユーティリティ
// React Testing LibraryとカスタムProviderのセットアップ

import { type RenderOptions, render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { vi } from "vitest";

// Next.js のnavigationモジュールをモック
vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: vi.fn(),
		replace: vi.fn(),
		back: vi.fn(),
		forward: vi.fn(),
		refresh: vi.fn(),
		prefetch: vi.fn(),
	}),
	useSearchParams: () => new URLSearchParams(),
	usePathname: () => "/",
}));

// Next.js Linkコンポーネントをモック
vi.mock("next/link", () => ({
	default: ({ children, href, className, ...props }: any) => (
		<a href={href} className={className} {...props}>
			{children}
		</a>
	),
}));

// React Query関連をモック（React 19互換性問題を回避）
vi.mock("@tanstack/react-query", () => ({
	QueryClient: vi.fn(() => ({
		getQueryData: vi.fn(),
		setQueryData: vi.fn(),
		invalidateQueries: vi.fn(),
		prefetchQuery: vi.fn(),
		fetchQuery: vi.fn(),
		clear: vi.fn(),
	})),
	QueryClientProvider: ({ children }: { children: ReactNode }) => children,
	useQuery: vi.fn(() => ({
		data: null,
		error: null,
		isLoading: false,
		isError: false,
		isSuccess: true,
		refetch: vi.fn(),
	})),
	useMutation: vi.fn(() => ({
		mutate: vi.fn(),
		mutateAsync: vi.fn(),
		isLoading: false,
		isError: false,
		isSuccess: false,
		error: null,
		data: null,
		reset: vi.fn(),
	})),
	useQueryClient: vi.fn(() => ({
		invalidateQueries: vi.fn(),
		setQueryData: vi.fn(),
		getQueryData: vi.fn(),
	})),
}));

// カスタムrender関数（QueryClientProviderなしのシンプル版）
function customRender(
	ui: ReactElement,
	options?: Omit<RenderOptions, "wrapper">,
) {
	// シンプルなWrapper（必要に応じて他のProviderを追加）
	function AllTheProviders({ children }: { children: ReactNode }) {
		return <>{children}</>;
	}

	return render(ui, { wrapper: AllTheProviders, ...options });
}

// @testing-library/reactのすべてのエクスポートを再エクスポート
export * from "@testing-library/react";
export { customRender as render };
