/**
 * useBalanceSummaryフックのテスト
 *
 * 収支サマリー取得の正常系・異常系のテストケースを網羅
 */

import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getBalanceSummary } from "../lib/api/services/balance";
import type { BalanceSummary } from "../lib/api/types";
import { useBalanceSummary } from "./useBalanceSummary";

// APIモジュールをモック
vi.mock("../lib/api/services/balance");

describe("useBalanceSummary", () => {
	// モック関数の型定義
	const mockedGetBalanceSummary = vi.mocked(getBalanceSummary);

	// テストデータ
	const mockSummary: BalanceSummary = {
		income: 300000,
		expense: 200000,
		balance: 100000,
		savingsRate: 33.3,
		trend: "positive",
	};

	beforeEach(() => {
		vi.clearAllMocks();
		// console.errorをモック化してエラーログを抑制
		vi.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("初回マウント時にサマリーデータを取得する", async () => {
		// APIモックの設定
		mockedGetBalanceSummary.mockResolvedValueOnce(mockSummary);

		// フックをレンダリング
		const { result } = renderHook(() => useBalanceSummary());

		// 初期状態の確認
		expect(result.current.loading).toBe(true);
		expect(result.current.summary).toBeNull();
		expect(result.current.error).toBeNull();

		// データ取得完了を待つ
		await waitFor(() => {
			expect(result.current.loading).toBe(false);
		});

		// 取得したデータの確認
		expect(result.current.summary).toEqual(mockSummary);
		expect(result.current.error).toBeNull();
		expect(mockedGetBalanceSummary).toHaveBeenCalledTimes(1);
	});

	it("API取得エラー時にエラーメッセージを設定する", async () => {
		// エラーを返すモックの設定
		const errorMessage = "ネットワークエラー";
		mockedGetBalanceSummary.mockRejectedValueOnce(new Error(errorMessage));

		// フックをレンダリング
		const { result } = renderHook(() => useBalanceSummary());

		// エラー発生を待つ
		await waitFor(() => {
			expect(result.current.loading).toBe(false);
		});

		// エラー状態の確認
		expect(result.current.summary).toBeNull();
		expect(result.current.error).toBe(errorMessage);
		expect(console.error).toHaveBeenCalledWith(
			"収支サマリー取得エラー:",
			expect.any(Error),
		);
	});

	it("未知のエラー時にデフォルトエラーメッセージを設定する", async () => {
		// 非Errorオブジェクトを投げるモック
		mockedGetBalanceSummary.mockRejectedValueOnce("Unknown error");

		// フックをレンダリング
		const { result } = renderHook(() => useBalanceSummary());

		// エラー発生を待つ
		await waitFor(() => {
			expect(result.current.loading).toBe(false);
		});

		// 文字列エラーはそのまま返される
		expect(result.current.error).toBe("Unknown error");
	});

	it("refetch関数で再取得ができる", async () => {
		// 初回は成功、再取得時も成功（別のデータ）
		const updatedSummary: BalanceSummary = {
			income: 350000,
			expense: 250000,
			balance: 100000,
			savingsRate: 28.6,
			trend: "positive",
		};

		mockedGetBalanceSummary
			.mockResolvedValueOnce(mockSummary)
			.mockResolvedValueOnce(updatedSummary);

		// フックをレンダリング
		const { result } = renderHook(() => useBalanceSummary());

		// 初回取得を待つ
		await waitFor(() => {
			expect(result.current.loading).toBe(false);
		});

		expect(mockedGetBalanceSummary).toHaveBeenCalledTimes(1);
		expect(result.current.summary?.income).toBe(300000);

		// 再取得を実行
		await result.current.refetch();

		// 再取得完了を待つ
		await waitFor(() => {
			expect(result.current.summary?.income).toBe(350000);
		});

		// 更新されたデータの確認
		expect(result.current.summary?.income).toBe(350000);
		expect(result.current.summary?.expense).toBe(250000);
		expect(mockedGetBalanceSummary).toHaveBeenCalledTimes(2);
	});

	it("異なるトレンドタイプを正しく処理する", async () => {
		// 赤字のケース
		const negativeSummary: BalanceSummary = {
			income: 200000,
			expense: 300000,
			balance: -100000,
			savingsRate: -50.0,
			trend: "negative",
		};

		mockedGetBalanceSummary.mockResolvedValueOnce(negativeSummary);

		const { result } = renderHook(() => useBalanceSummary());

		await waitFor(() => {
			expect(result.current.loading).toBe(false);
		});

		expect(result.current.summary).toEqual(negativeSummary);
		expect(result.current.summary?.trend).toBe("negative");
	});

	it("収支均衡（neutral）のケースを処理する", async () => {
		// 収支均衡のケース
		const neutralSummary: BalanceSummary = {
			income: 250000,
			expense: 250000,
			balance: 0,
			savingsRate: 0,
			trend: "neutral",
		};

		mockedGetBalanceSummary.mockResolvedValueOnce(neutralSummary);

		const { result } = renderHook(() => useBalanceSummary());

		await waitFor(() => {
			expect(result.current.loading).toBe(false);
		});

		expect(result.current.summary).toEqual(neutralSummary);
		expect(result.current.summary?.trend).toBe("neutral");
	});
});
