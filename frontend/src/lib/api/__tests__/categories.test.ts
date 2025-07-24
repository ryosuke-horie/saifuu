/**
 * Categories API のテスト
 *
 * 設定ファイルベースのカテゴリ管理に対応したテスト
 * - fetchCategories(), fetchCategoryById() の動作確認
 * - 固定カテゴリデータの検証
 */

import { describe, expect, it } from "vitest";
import { ALL_CATEGORIES } from "../../../../../shared/config/categories";
import { fetchCategories, fetchCategoryById } from "../categories/api";

describe("Categories API", () => {
	describe("fetchCategories", () => {
		it("should fetch categories from config file", async () => {
			// 設定ファイルから全カテゴリを取得
			const result = await fetchCategories();

			// 期待される総カテゴリ数（支出11個のみ、収入カテゴリは削除済み、娯楽カテゴリ追加）
			expect(result).toHaveLength(11);

			// 新しく追加されたカテゴリの確認
			const systemFee = result.find((cat) => cat.id === "6");
			expect(systemFee).toBeDefined();
			expect(systemFee?.name).toBe("システム関係費");
			expect(systemFee?.type).toBe("expense");
			expect(systemFee?.color).toBe("#9B59B6");

			const books = result.find((cat) => cat.id === "8");
			expect(books).toBeDefined();
			expect(books?.name).toBe("書籍代");
			expect(books?.type).toBe("expense");
			expect(books?.color).toBe("#1E8BC3");

			const utilities = result.find((cat) => cat.id === "1");
			expect(utilities).toBeDefined();
			expect(utilities?.name).toBe("家賃・水道・光熱・通信費");
			expect(utilities?.type).toBe("expense");
			expect(utilities?.color).toBe("#D35400");
		});

		it("should return categories with proper structure", async () => {
			// カテゴリの構造を確認
			const result = await fetchCategories();

			result.forEach((category) => {
				// 必須フィールドの存在確認
				expect(category).toHaveProperty("id");
				expect(category).toHaveProperty("name");
				expect(category).toHaveProperty("type");
				expect(category).toHaveProperty("color");
				expect(category).toHaveProperty("createdAt");
				expect(category).toHaveProperty("updatedAt");

				// 型の確認
				expect(typeof category.id).toBe("string");
				expect(typeof category.name).toBe("string");
				expect(category.type).toBe("expense");
				expect(typeof category.color).toBe("string");
			});
		});

		it("should include only expense categories", async () => {
			// 支出カテゴリのみが含まれることを確認
			const result = await fetchCategories();

			const expenseCategories = result.filter((cat) => cat.type === "expense");
			// 収入カテゴリは廃止されました

			expect(expenseCategories.length).toBe(11); // 支出カテゴリ数（娯楽カテゴリ追加）
			// 収入カテゴリは削除済み
		});
	});

	describe("fetchCategoryById", () => {
		it("should fetch single category by id", async () => {
			// ID 1（家賃・水道・光熱・通信費）を取得
			const result = await fetchCategoryById("1");

			expect(result).toEqual({
				id: "1",
				name: "家賃・水道・光熱・通信費",
				type: "expense",
				color: "#D35400",
				createdAt: expect.any(String),
				updatedAt: expect.any(String),
			});
		});

		it("should throw error for non-existent category id", async () => {
			// 存在しないIDの場合はエラーをスロー
			await expect(fetchCategoryById("999")).rejects.toThrow(
				"カテゴリID 999 が見つかりません",
			);
		});

		it("should handle invalid id format", async () => {
			// 無効なID形式の場合
			await expect(fetchCategoryById("invalid")).rejects.toThrow(
				"カテゴリID invalid が見つかりません",
			);
		});
	});
});
