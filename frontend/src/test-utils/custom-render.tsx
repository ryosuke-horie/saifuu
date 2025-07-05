// カスタムレンダリング関数
// プロバイダーやグローバル設定を含めてコンポーネントをレンダリング
// 代替案: 各テストでプロバイダーを個別に設定することも可能だが、重複を避けるため集約

import { type RenderOptions, render } from "@testing-library/react";
import type { ReactElement } from "react";

// 将来的にプロバイダーを追加する際のラッパーコンポーネント
// 現在はプロバイダーがないが、今後のために準備
interface ProvidersProps {
	children: React.ReactNode;
}

function AllTheProviders({ children }: ProvidersProps) {
	// 今後、以下のようなプロバイダーを追加可能:
	// - ThemeProvider
	// - RouterProvider
	// - AuthProvider
	// - QueryClientProvider
	return <>{children}</>;
}

// カスタムレンダリング関数
// Testing Libraryのrender関数をラップし、プロバイダーを自動的に適用
const customRender = (
	ui: ReactElement,
	options?: Omit<RenderOptions, "wrapper">,
) => render(ui, { wrapper: AllTheProviders, ...options });

// re-export everything
// eslint-disable-next-line react-refresh/only-export-components
export * from "@testing-library/react";

// override render method
export { customRender as render };
