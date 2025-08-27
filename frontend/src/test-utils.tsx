// テスト用ユーティリティ
// React Testing LibraryとカスタムProviderのセットアップ

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

// カスタムrender関数で必要な全Providerをラップ
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  function AllTheProviders({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: AllTheProviders, ...options });
}

// @testing-library/reactのすべてのエクスポートを再エクスポート
export * from "@testing-library/react";
export { customRender as render };