import {
	EXPENSE_CATEGORIES,
	getCategoryById,
	getCategoryByName,
} from "@shared/config/categories";
import { describe, expect, it } from "vitest";

describe("カテゴリ設定", () => {
	describe("支出カテゴリ", () => {
		it("必要な支出カテゴリが全て存在すること", () => {
			// Issue #282で追加が必要なカテゴリ
			const requiredCategories = [
				{ id: "system_fee", name: "システム関係日" },
				{ id: "books", name: "書籍代" },
				{ id: "utilities", name: "家賃・水道・光熱・通信費" },
			];

			requiredCategories.forEach(({ id, name }) => {
				const categoryById = getCategoryById(id);
				const categoryByName = getCategoryByName(name);

				// IDで検索できることを確認
				expect(categoryById).toBeDefined();
				expect(categoryById?.name).toBe(name);
				expect(categoryById?.type).toBe("expense");

				// 名前で検索できることを確認
				expect(categoryByName).toBeDefined();
				expect(categoryByName?.id).toBe(id);
			});
		});

		it("新しいカテゴリに適切な色が設定されていること", () => {
			const newCategories = ["system_fee", "books", "utilities"];

			newCategories.forEach((id) => {
				const category = getCategoryById(id);
				expect(category?.color).toBeDefined();
				expect(category?.color).toMatch(/^#[0-9A-F]{6}$/i);
			});
		});

		it("新しいカテゴリに適切な説明が設定されていること", () => {
			const expectedDescriptions = {
				system_fee: "システム利用料、サブスクリプション費用",
				books: "書籍、電子書籍、雑誌",
				utilities: "家賃、電気、ガス、水道、インターネット、携帯電話",
			};

			Object.entries(expectedDescriptions).forEach(([id, expectedDesc]) => {
				const category = getCategoryById(id);
				expect(category?.description).toBe(expectedDesc);
			});
		});
	});

	describe("カテゴリ数の確認", () => {
		it("支出カテゴリが12個存在すること", () => {
			// 既存の9個 + 新規3個 = 12個
			expect(EXPENSE_CATEGORIES).toHaveLength(12);
		});
	});
});
