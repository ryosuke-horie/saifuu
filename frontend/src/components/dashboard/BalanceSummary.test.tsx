/**
 * BalanceSummaryコンポーネントのテスト
 *
 * 収支サマリー表示の正常系・異常系のテストケースを網羅
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UseBalanceSummaryResult } from "../../hooks/useBalanceSummary";
import { useBalanceSummary } from "../../hooks/useBalanceSummary";
import type { BalanceSummary as BalanceSummaryType } from "../../lib/api/types";
import { renderWithProviders, screen } from "../../test-utils";
import { BalanceSummary } from "./BalanceSummary";

// useBalanceSummaryフックをモック
vi.mock("../../hooks/useBalanceSummary");

describe("BalanceSummary", () => {
	const mockedUseBalanceSummary = vi.mocked(useBalanceSummary);

	// テストデータ
	const mockPositiveSummary: BalanceSummaryType = {
		income: 300000,
		expense: 200000,
		balance: 100000,
		savingsRate: 33.3,
		trend: "positive",
	};

	const mockNegativeSummary: BalanceSummaryType = {
		income: 200000,
		expense: 350000,
		balance: -150000,
		savingsRate: -75.0,
		trend: "negative",
	};

	const mockNeutralSummary: BalanceSummaryType = {
		income: 250000,
		expense: 250000,
		balance: 0,
		savingsRate: 0,
		trend: "neutral",
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("黒字の収支サマリーを正しく表示する", async () => {
		// モックの設定
		mockedUseBalanceSummary.mockReturnValue({
			summary: mockPositiveSummary,
			loading: false,
			error: null,
			refetch: vi.fn(),
		} as UseBalanceSummaryResult);

		// コンポーネントをレンダリング
		renderWithProviders(<BalanceSummary />);

		// タイトルの確認
		expect(screen.getByText("今月の収支サマリー")).toBeInTheDocument();

		// 収入・支出・残高の表示確認
		expect(screen.getByText("+¥300,000")).toBeInTheDocument();
		expect(screen.getByText("-¥200,000")).toBeInTheDocument();
		expect(screen.getByText("+¥100,000")).toBeInTheDocument();

		// 貯蓄率の表示確認
		expect(screen.getByText("33.3%")).toBeInTheDocument();

		// トレンド表示の確認
		expect(screen.getByText("黒字")).toBeInTheDocument();
		expect(screen.getByText("↑")).toBeInTheDocument();
	});

	it("赤字の収支サマリーを正しく表示する", async () => {
		mockedUseBalanceSummary.mockReturnValue({
			summary: mockNegativeSummary,
			loading: false,
			error: null,
			refetch: vi.fn(),
		} as UseBalanceSummaryResult);

		renderWithProviders(<BalanceSummary />);

		// 赤字の残高表示確認
		expect(screen.getByText("-¥150,000")).toBeInTheDocument();

		// 負の貯蓄率の表示確認
		expect(screen.getByText("-75%")).toBeInTheDocument();

		// トレンド表示の確認
		expect(screen.getByText("赤字")).toBeInTheDocument();
		expect(screen.getByText("↓")).toBeInTheDocument();
	});

	it("収支均衡の状態を正しく表示する", async () => {
		mockedUseBalanceSummary.mockReturnValue({
			summary: mockNeutralSummary,
			loading: false,
			error: null,
			refetch: vi.fn(),
		} as UseBalanceSummaryResult);

		renderWithProviders(<BalanceSummary />);

		// 残高0円の表示確認
		expect(screen.getByText("+¥0")).toBeInTheDocument();

		// 貯蓄率0%の表示確認
		expect(screen.getByText("0%")).toBeInTheDocument();

		// トレンド表示の確認
		expect(screen.getByText("収支均衡")).toBeInTheDocument();
		expect(screen.getByText("→")).toBeInTheDocument();
	});

	it("ローディング状態を表示する", () => {
		mockedUseBalanceSummary.mockReturnValue({
			summary: null,
			loading: true,
			error: null,
			refetch: vi.fn(),
		} as UseBalanceSummaryResult);

		renderWithProviders(<BalanceSummary />);

		// スピナーの表示確認
		expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();

		// データが表示されていないことを確認
		expect(screen.queryByText("収入")).not.toBeInTheDocument();
	});

	it("エラー状態を表示する", () => {
		const errorMessage = "サーバーエラーが発生しました";

		mockedUseBalanceSummary.mockReturnValue({
			summary: null,
			loading: false,
			error: errorMessage,
			refetch: vi.fn(),
		} as UseBalanceSummaryResult);

		renderWithProviders(<BalanceSummary />);

		// エラーメッセージの表示確認
		expect(screen.getByText(errorMessage)).toBeInTheDocument();

		// データが表示されていないことを確認
		expect(screen.queryByText("収入")).not.toBeInTheDocument();
	});

	it("データがない状態を表示する", () => {
		mockedUseBalanceSummary.mockReturnValue({
			summary: null,
			loading: false,
			error: null,
			refetch: vi.fn(),
		} as UseBalanceSummaryResult);

		renderWithProviders(<BalanceSummary />);

		// データなしメッセージの表示確認
		expect(screen.getByText("データがありません")).toBeInTheDocument();
	});

	it("収支バランスバーを正しく表示する", () => {
		mockedUseBalanceSummary.mockReturnValue({
			summary: mockPositiveSummary,
			loading: false,
			error: null,
			refetch: vi.fn(),
		} as UseBalanceSummaryResult);

		renderWithProviders(<BalanceSummary />);

		// バランスバーのラベル確認
		expect(screen.getByText("収支バランス")).toBeInTheDocument();

		// バーの範囲表示確認
		expect(screen.getByText("0円")).toBeInTheDocument();
		expect(screen.getByText("¥300,000")).toBeInTheDocument(); // max(income, expense)
	});

	it("貯蓄率プログレスバーを表示する", () => {
		mockedUseBalanceSummary.mockReturnValue({
			summary: mockPositiveSummary,
			loading: false,
			error: null,
			refetch: vi.fn(),
		} as UseBalanceSummaryResult);

		renderWithProviders(<BalanceSummary />);

		// 貯蓄率のラベル確認
		expect(screen.getByText("貯蓄率")).toBeInTheDocument();
	});

	it("収入が0の場合でもエラーにならない", () => {
		const zeroIncomeSummary: BalanceSummaryType = {
			income: 0,
			expense: 100000,
			balance: -100000,
			savingsRate: 0,
			trend: "negative",
		};

		mockedUseBalanceSummary.mockReturnValue({
			summary: zeroIncomeSummary,
			loading: false,
			error: null,
			refetch: vi.fn(),
		} as UseBalanceSummaryResult);

		renderWithProviders(<BalanceSummary />);

		// 正常に表示されることを確認
		expect(screen.getByText("+¥0")).toBeInTheDocument(); // 収入

		// 支出の表示（複数の-¥100,000があるので、より具体的に取得）
		const expenseElement = screen.getByText("支出").parentElement;
		expect(expenseElement?.querySelector(".text-red-600")?.textContent).toBe(
			"-¥100,000",
		);

		// 残高の表示（text-2xlクラスで区別）
		const balanceElement = screen.getByText("残高").parentElement;
		expect(balanceElement?.querySelector(".text-2xl")?.textContent).toBe(
			"-¥100,000",
		);

		expect(screen.getByText("0%")).toBeInTheDocument(); // 貯蓄率
	});

	it("大きな金額も正しくフォーマットされる", () => {
		const largeSummary: BalanceSummaryType = {
			income: 10000000,
			expense: 7500000,
			balance: 2500000,
			savingsRate: 25.0,
			trend: "positive",
		};

		mockedUseBalanceSummary.mockReturnValue({
			summary: largeSummary,
			loading: false,
			error: null,
			refetch: vi.fn(),
		} as UseBalanceSummaryResult);

		renderWithProviders(<BalanceSummary />);

		// 大きな金額の表示確認
		expect(screen.getByText("+¥10,000,000")).toBeInTheDocument();
		expect(screen.getByText("-¥7,500,000")).toBeInTheDocument();
		expect(screen.getByText("+¥2,500,000")).toBeInTheDocument();
	});
});
