import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as categoriesApi from "../lib/api/categories";
import type { Category } from "../types/category";
import { useCategories } from "./useCategories";

// APIモック
vi.mock("../lib/api/categories");

// モックデータ
const mockCategories: Category[] = [
	{
		id: "1",
		name: "食費",
		type: "expense" as const,
		color: "#FF6B6B",
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: "2",
		name: "交通費",
		type: "expense" as const,
		color: "#4ECDC4",
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: "3",
		name: "娯楽",
		type: "expense" as const,
		color: "#45B7D1",
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
];

// 簡素化されたテスト: 重複と過剰なエッジケースを削除
describe("useCategories (Simplified)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// デフォルトで成功レスポンスを返す
		vi.mocked(categoriesApi.fetchCategories).mockResolvedValue(mockCategories);
	});

	describe("基本機能", () => {
		it("初期状態が正しく設定される", () => {
			const { result } = renderHook(() => useCategories());

			// 初期状態の確認
			expect(result.current.categories).toEqual([]);
			expect(result.current.loading).toBe(true);
			expect(result.current.error).toBeNull();
			expect(result.current.refetch).toBeInstanceOf(Function);
		});

		it("カテゴリデータを正常に取得できる", async () => {
			const { result } = renderHook(() => useCategories());

			// データ取得を待つ
			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			// 結果の確認
			expect(result.current.categories).toEqual(mockCategories);
			expect(result.current.error).toBeNull();
			expect(categoriesApi.fetchCategories).toHaveBeenCalledTimes(1);
		});

		it("APIエラーを適切にハンドリングする", async () => {
			const errorMessage = "ネットワークエラー";
			vi.mocked(categoriesApi.fetchCategories).mockRejectedValue(
				new Error(errorMessage),
			);

			const { result } = renderHook(() => useCategories());

			// エラーが設定されるまで待つ
			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			// エラー状態の確認
			expect(result.current.categories).toEqual([]);
			expect(result.current.error).toContain(errorMessage);
		});

		it("refetch でデータを再取得できる", async () => {
			const { result } = renderHook(() => useCategories());

			// 初回取得を待つ
			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			// API呼び出しをクリア
			vi.clearAllMocks();

			// refetchを実行
			await result.current.refetch();

			// 再度APIが呼ばれる
			expect(categoriesApi.fetchCategories).toHaveBeenCalledTimes(1);
			expect(result.current.categories).toEqual(mockCategories);
		});
	});
});
