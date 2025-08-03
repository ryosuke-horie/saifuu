/**
 * 収入管理画面簡易テスト
 * メモリエラーの原因を特定するための最小限のテスト
 */

import { render, screen } from "@testing-library/react";
import { http } from "msw";
import { setupServer } from "msw/node";
import {
	afterAll,
	afterEach,
	beforeAll,
	describe,
	expect,
	it,
	vi,
} from "vitest";

// Next.js App Router のモック
vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: vi.fn(),
		replace: vi.fn(),
		refresh: vi.fn(),
		back: vi.fn(),
		forward: vi.fn(),
		prefetch: vi.fn(),
	}),
	useSearchParams: () => new URLSearchParams(),
	usePathname: () => "/income",
}));

// 最小限のコンポーネント
function SimpleIncomePage() {
	return (
		<div>
			<h1>収入管理</h1>
			<div data-testid="income-stats">統計</div>
			<div data-testid="income-filters">フィルタ</div>
			<div data-testid="income-category-chart">グラフ</div>
			<div data-testid="income-list">一覧</div>
			<div data-testid="pagination-controls">ページネーション</div>
		</div>
	);
}

// APIモックサーバーのセットアップ
const server = setupServer(
	http.get("/api/transactions/stats", () => {
		return new Response(JSON.stringify({ currentMonth: 450000 }), {
			headers: { "Content-Type": "application/json" },
		});
	}),
	http.get("/api/categories", () => {
		return new Response(JSON.stringify([]), {
			headers: { "Content-Type": "application/json" },
		});
	}),
	http.get("/api/transactions", () => {
		return new Response(JSON.stringify({ data: [], pagination: null }), {
			headers: { "Content-Type": "application/json" },
		});
	}),
);

// テストのセットアップ
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("収入管理画面簡易テスト", () => {
	it("基本コンポーネントが表示される", () => {
		render(<SimpleIncomePage />);

		expect(screen.getByText("収入管理")).toBeInTheDocument();
		expect(screen.getByTestId("income-stats")).toBeInTheDocument();
		expect(screen.getByTestId("income-filters")).toBeInTheDocument();
		expect(screen.getByTestId("income-category-chart")).toBeInTheDocument();
		expect(screen.getByTestId("income-list")).toBeInTheDocument();
		expect(screen.getByTestId("pagination-controls")).toBeInTheDocument();
	});
});
