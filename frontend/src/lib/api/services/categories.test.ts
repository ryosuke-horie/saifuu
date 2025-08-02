/**
 * カテゴリAPIサービスのテスト
 *
 * カテゴリ関連のAPI呼び出しをテストする
 * 現在は設定ファイルベースだが、将来のAPI実装も考慮したテスト
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import * as categoriesApi from "../categories/api";
import { apiClient } from "../client";
import { endpoints } from "../config";
import type {
	Category,
	CreateCategoryRequest,
	DeleteResponse,
	UpdateCategoryRequest,
} from "../types";
import {
	type CategoryService,
	categoryService,
	createCategory,
	deleteCategory,
	getCategories,
	getCategory,
	updateCategory,
} from "./categories";

// モック設定
vi.mock("../categories/api");
vi.mock("../client", () => ({
	apiClient: {
		post: vi.fn(),
		put: vi.fn(),
		delete: vi.fn(),
	},
}));

describe("Categories Service", () => {
	const mockCategories: Category[] = [
		{
			id: "1",
			name: "家賃・水道・光熱・通信費",
			type: "expense",
			color: "#D35400",
			createdAt: "2024-01-01T00:00:00.000Z",
			updatedAt: "2024-01-01T00:00:00.000Z",
		},
		{
			id: "2",
			name: "食費",
			type: "expense",
			color: "#27AE60",
			createdAt: "2024-01-01T00:00:00.000Z",
			updatedAt: "2024-01-01T00:00:00.000Z",
		},
		{
			id: "12",
			name: "給与",
			type: "income",
			color: "#3498DB",
			createdAt: "2024-01-01T00:00:00.000Z",
			updatedAt: "2024-01-01T00:00:00.000Z",
		},
	];

	const mockCategory: Category = mockCategories[0];

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getCategories", () => {
		it("設定ファイルから全カテゴリを取得する", async () => {
			// モック設定
			vi.mocked(categoriesApi.fetchCategories).mockResolvedValue(
				mockCategories,
			);

			// 実行
			const result = await getCategories();

			// 検証
			expect(result).toEqual(mockCategories);
			expect(categoriesApi.fetchCategories).toHaveBeenCalledTimes(1);
			expect(categoriesApi.fetchCategories).toHaveBeenCalledWith();
		});

		it("空の配列を返す場合も正常に処理される", async () => {
			// モック設定
			vi.mocked(categoriesApi.fetchCategories).mockResolvedValue([]);

			// 実行
			const result = await getCategories();

			// 検証
			expect(result).toEqual([]);
			expect(categoriesApi.fetchCategories).toHaveBeenCalledTimes(1);
		});

		it("エラーが発生した場合は例外をスローする", async () => {
			// モック設定
			const error = new Error("Failed to fetch categories");
			vi.mocked(categoriesApi.fetchCategories).mockRejectedValue(error);

			// 実行と検証
			await expect(getCategories()).rejects.toThrow(
				"Failed to fetch categories",
			);
			expect(categoriesApi.fetchCategories).toHaveBeenCalledTimes(1);
		});
	});

	describe("getCategory", () => {
		it("指定したIDのカテゴリを取得する", async () => {
			// モック設定
			vi.mocked(categoriesApi.fetchCategoryById).mockResolvedValue(
				mockCategory,
			);

			// 実行
			const result = await getCategory("1");

			// 検証
			expect(result).toEqual(mockCategory);
			expect(categoriesApi.fetchCategoryById).toHaveBeenCalledTimes(1);
			expect(categoriesApi.fetchCategoryById).toHaveBeenCalledWith("1");
		});

		it("存在しないIDの場合はエラーをスローする", async () => {
			// モック設定
			const error = new Error("カテゴリID 999 が見つかりません");
			vi.mocked(categoriesApi.fetchCategoryById).mockRejectedValue(error);

			// 実行と検証
			await expect(getCategory("999")).rejects.toThrow(
				"カテゴリID 999 が見つかりません",
			);
			expect(categoriesApi.fetchCategoryById).toHaveBeenCalledTimes(1);
			expect(categoriesApi.fetchCategoryById).toHaveBeenCalledWith("999");
		});

		it("無効なID形式の場合もエラーをスローする", async () => {
			// モック設定
			const error = new Error("カテゴリID invalid が見つかりません");
			vi.mocked(categoriesApi.fetchCategoryById).mockRejectedValue(error);

			// 実行と検証
			await expect(getCategory("invalid")).rejects.toThrow(
				"カテゴリID invalid が見つかりません",
			);
			expect(categoriesApi.fetchCategoryById).toHaveBeenCalledTimes(1);
			expect(categoriesApi.fetchCategoryById).toHaveBeenCalledWith("invalid");
		});
	});

	describe("createCategory", () => {
		const createRequest: CreateCategoryRequest = {
			name: "新しいカテゴリ",
			type: "expense",
			description: "新しいカテゴリの説明",
		};

		const createdCategory: Category = {
			id: "99",
			...createRequest,
			color: "#FF5733",
			description: createRequest.description,
			createdAt: "2024-01-01T00:00:00.000Z",
			updatedAt: "2024-01-01T00:00:00.000Z",
		};

		it("新しいカテゴリを作成する", async () => {
			// モック設定
			vi.mocked(apiClient.post).mockResolvedValue(createdCategory);

			// 実行
			const result = await createCategory(createRequest);

			// 検証
			expect(result).toEqual(createdCategory);
			expect(apiClient.post).toHaveBeenCalledTimes(1);
			expect(apiClient.post).toHaveBeenCalledWith(
				endpoints.categories.create,
				createRequest,
			);
		});

		it("colorを省略した場合も正常に処理される", async () => {
			const requestWithoutColor: CreateCategoryRequest = {
				name: "色なしカテゴリ",
				type: "income",
			};

			const categoryWithoutColor: Category = {
				id: "100",
				name: requestWithoutColor.name,
				type: requestWithoutColor.type,
				color: null,
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			};

			// モック設定
			vi.mocked(apiClient.post).mockResolvedValue(categoryWithoutColor);

			// 実行
			const result = await createCategory(requestWithoutColor);

			// 検証
			expect(result).toEqual(categoryWithoutColor);
			expect(apiClient.post).toHaveBeenCalledWith(
				endpoints.categories.create,
				requestWithoutColor,
			);
		});

		it("APIエラーの場合は例外をスローする", async () => {
			// モック設定
			const error = new Error("Failed to create category");
			vi.mocked(apiClient.post).mockRejectedValue(error);

			// 実行と検証
			await expect(createCategory(createRequest)).rejects.toThrow(
				"Failed to create category",
			);
			expect(apiClient.post).toHaveBeenCalledTimes(1);
		});
	});

	describe("updateCategory", () => {
		const updateRequest: UpdateCategoryRequest = {
			name: "更新されたカテゴリ",
			description: "更新された説明",
		};

		const updatedCategory: Category = {
			...mockCategory,
			...updateRequest,
			color: "#00FF00",
			description: updateRequest.description,
			updatedAt: "2024-02-01T00:00:00.000Z",
		};

		it("既存のカテゴリを更新する", async () => {
			// モック設定
			vi.mocked(apiClient.put).mockResolvedValue(updatedCategory);

			// 実行
			const result = await updateCategory("1", updateRequest);

			// 検証
			expect(result).toEqual(updatedCategory);
			expect(apiClient.put).toHaveBeenCalledTimes(1);
			expect(apiClient.put).toHaveBeenCalledWith(
				endpoints.categories.update("1"),
				updateRequest,
			);
		});

		it("部分的な更新も正常に処理される", async () => {
			const partialUpdate: UpdateCategoryRequest = {
				name: "名前のみ更新",
			};

			const partiallyUpdatedCategory: Category = {
				...mockCategory,
				name: partialUpdate.name!,
				updatedAt: "2024-02-01T00:00:00.000Z",
			};

			// モック設定
			vi.mocked(apiClient.put).mockResolvedValue(partiallyUpdatedCategory);

			// 実行
			const result = await updateCategory("1", partialUpdate);

			// 検証
			expect(result).toEqual(partiallyUpdatedCategory);
			expect(apiClient.put).toHaveBeenCalledWith(
				endpoints.categories.update("1"),
				partialUpdate,
			);
		});

		it("空のオブジェクトを送信した場合も処理される", async () => {
			const emptyUpdate: UpdateCategoryRequest = {};

			// モック設定
			vi.mocked(apiClient.put).mockResolvedValue(mockCategory);

			// 実行
			const result = await updateCategory("1", emptyUpdate);

			// 検証
			expect(result).toEqual(mockCategory);
			expect(apiClient.put).toHaveBeenCalledWith(
				endpoints.categories.update("1"),
				emptyUpdate,
			);
		});

		it("存在しないIDの更新はエラーをスローする", async () => {
			// モック設定
			const error = new Error("Category not found");
			vi.mocked(apiClient.put).mockRejectedValue(error);

			// 実行と検証
			await expect(updateCategory("999", updateRequest)).rejects.toThrow(
				"Category not found",
			);
			expect(apiClient.put).toHaveBeenCalledTimes(1);
		});
	});

	describe("deleteCategory", () => {
		const deleteResponse: DeleteResponse = {
			success: true,
			message: "カテゴリが削除されました",
		};

		it("カテゴリを削除する", async () => {
			// モック設定
			vi.mocked(apiClient.delete).mockResolvedValue(deleteResponse);

			// 実行
			const result = await deleteCategory("1");

			// 検証
			expect(result).toEqual(deleteResponse);
			expect(apiClient.delete).toHaveBeenCalledTimes(1);
			expect(apiClient.delete).toHaveBeenCalledWith(
				endpoints.categories.delete("1"),
			);
		});

		it("存在しないIDの削除はエラーをスローする", async () => {
			// モック設定
			const error = new Error("Category not found");
			vi.mocked(apiClient.delete).mockRejectedValue(error);

			// 実行と検証
			await expect(deleteCategory("999")).rejects.toThrow("Category not found");
			expect(apiClient.delete).toHaveBeenCalledTimes(1);
			expect(apiClient.delete).toHaveBeenCalledWith(
				endpoints.categories.delete("999"),
			);
		});

		it("削除権限がない場合はエラーをスローする", async () => {
			// モック設定
			const error = new Error("Unauthorized to delete category");
			vi.mocked(apiClient.delete).mockRejectedValue(error);

			// 実行と検証
			await expect(deleteCategory("1")).rejects.toThrow(
				"Unauthorized to delete category",
			);
			expect(apiClient.delete).toHaveBeenCalledTimes(1);
		});
	});

	describe("categoryService", () => {
		it("すべての関数が含まれている", () => {
			expect(categoryService).toHaveProperty("getCategories");
			expect(categoryService).toHaveProperty("getCategory");
			expect(categoryService).toHaveProperty("createCategory");
			expect(categoryService).toHaveProperty("updateCategory");
			expect(categoryService).toHaveProperty("deleteCategory");
		});

		it("categoryServiceの関数が正しく動作する", async () => {
			// モック設定
			vi.mocked(categoriesApi.fetchCategories).mockResolvedValue(
				mockCategories,
			);

			// 実行
			const result = await categoryService.getCategories();

			// 検証
			expect(result).toEqual(mockCategories);
			expect(categoriesApi.fetchCategories).toHaveBeenCalledTimes(1);
		});

		it("categoryServiceがCategoryService型に適合している", () => {
			// 型チェック: categoryServiceがCategoryService型に適合することを確認
			// TypeScriptの型システムがコンパイル時にこれを保証する
			const service: CategoryService = categoryService;
			expect(service).toBeDefined();

			// 各メソッドの型が正しいことを確認
			expect(typeof service.getCategories).toBe("function");
			expect(typeof service.getCategory).toBe("function");
			expect(typeof service.createCategory).toBe("function");
			expect(typeof service.updateCategory).toBe("function");
			expect(typeof service.deleteCategory).toBe("function");
		});
	});
});
