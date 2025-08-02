/**
 * Transformers のテスト
 *
 * Issue #53 修正対応:
 * - APIレスポンスからフロントエンド型への変換処理テスト
 * - 配列変換処理の検証（今回の修正で直接使用）
 */

import { describe, expect, it } from "vitest";
import {
	transformApiCategoriesToFrontend,
	transformApiCategoryToFrontend,
} from "../categories/transformers";
import type { ApiCategoryResponse } from "../categories/types";
import {
	transformApiSubscriptionToFrontend,
	transformFormDataToCreateRequest,
	transformFormDataToUpdateRequest,
} from "../subscriptions/transformers";
import type { ApiSubscriptionResponse } from "../subscriptions/types";
import type { Category, SubscriptionFormData } from "../types";

describe("Categories Transformers", () => {
	describe("transformApiCategoryToFrontend", () => {
		it("should transform single API category to frontend format", () => {
			const apiCategory: ApiCategoryResponse = {
				id: 1,
				name: "エンターテイメント",
				createdAt: "2025-07-05T07:06:39Z",
				updatedAt: "2025-07-05T07:06:39Z",
			};

			const result = transformApiCategoryToFrontend(apiCategory);

			expect(result).toEqual({
				id: "1", // number -> string変換
				name: "エンターテイメント",
				type: "expense", // デフォルト値
				color: undefined, // デフォルト値
				createdAt: "2025-07-05T07:06:39Z",
				updatedAt: "2025-07-05T07:06:39Z",
			});
		});
	});

	describe("transformApiCategoriesToFrontend", () => {
		it("should transform array of API categories to frontend format (Issue #53 fix)", () => {
			// 今回の修正で重要: 配列を直接処理する変換
			const apiCategories: ApiCategoryResponse[] = [
				{
					id: 1,
					name: "エンターテイメント",
					createdAt: "2025-07-05T07:06:39Z",
					updatedAt: "2025-07-05T07:06:39Z",
				},
				{
					id: 2,
					name: "仕事・ビジネス",
					createdAt: "2025-07-05T07:06:39Z",
					updatedAt: "2025-07-05T07:06:39Z",
				},
			];

			const result = transformApiCategoriesToFrontend(apiCategories);

			expect(Array.isArray(result)).toBe(true);
			expect(result).toHaveLength(2);

			expect(result[0]).toEqual({
				id: "1",
				name: "エンターテイメント",
				type: "expense",
				color: undefined,
				createdAt: "2025-07-05T07:06:39Z",
				updatedAt: "2025-07-05T07:06:39Z",
			});

			expect(result[1]).toEqual({
				id: "2",
				name: "仕事・ビジネス",
				type: "expense",
				color: undefined,
				createdAt: "2025-07-05T07:06:39Z",
				updatedAt: "2025-07-05T07:06:39Z",
			});
		});

		it("should handle empty array", () => {
			const result = transformApiCategoriesToFrontend([]);

			expect(Array.isArray(result)).toBe(true);
			expect(result).toHaveLength(0);
		});
	});
});

describe("Subscriptions Transformers", () => {
	const mockCategories: Category[] = [
		{
			id: "1",
			name: "エンターテイメント",
			type: "expense",
			color: "#FF6B6B",
			createdAt: "2025-07-05T07:06:39Z",
			updatedAt: "2025-07-05T07:06:39Z",
		},
		{
			id: "2",
			name: "仕事・ビジネス",
			type: "expense",
			color: "#4ECDC4",
			createdAt: "2025-07-05T07:06:39Z",
			updatedAt: "2025-07-05T07:06:39Z",
		},
	];

	describe("transformApiSubscriptionToFrontend", () => {
		it("should transform API subscription to frontend format with category lookup", () => {
			const apiSubscription: ApiSubscriptionResponse = {
				id: 1,
				name: "Netflix",
				amount: 1980,
				categoryId: 1,
				billingCycle: "monthly",
				nextBillingDate: "2025-08-01T00:00:00Z",
				isActive: true,
				description: "動画ストリーミング",
				createdAt: "2025-07-05T07:06:39Z",
				updatedAt: "2025-07-05T07:06:39Z",
			};

			const result = transformApiSubscriptionToFrontend(
				apiSubscription,
				mockCategories,
			);

			expect(result).toEqual({
				id: "1",
				name: "Netflix",
				amount: 1980,
				categoryId: "1", // categoryIdフィールドを使用
				billingCycle: "monthly",
				startDate: "2025-07-05", // createdAtから日付部分を抽出
				nextBillingDate: "2025-08-01", // YYYY-MM-DD形式に変換される
				isActive: true,
				description: "動画ストリーミング",
				createdAt: "2025-07-05T07:06:39Z",
				updatedAt: "2025-07-05T07:06:39Z",
			});
		});

		it("should throw error for missing category", () => {
			const apiSubscription: ApiSubscriptionResponse = {
				id: 1,
				name: "Unknown Service",
				amount: 1000,
				categoryId: 999, // 存在しないカテゴリID
				billingCycle: "monthly",
				nextBillingDate: "2025-08-01T00:00:00Z",
				isActive: true,
				description: null,
				createdAt: "2025-07-05T07:06:39Z",
				updatedAt: "2025-07-05T07:06:39Z",
			};

			expect(() =>
				transformApiSubscriptionToFrontend(apiSubscription, mockCategories),
			).toThrow("Category with ID 999 not found");
		});

		it("should handle null description", () => {
			const apiSubscription: ApiSubscriptionResponse = {
				id: 1,
				name: "Service",
				amount: 1000,
				categoryId: 1,
				billingCycle: "monthly",
				nextBillingDate: "2025-08-01T00:00:00Z",
				isActive: true,
				description: null,
				createdAt: "2025-07-05T07:06:39Z",
				updatedAt: "2025-07-05T07:06:39Z",
			};

			const result = transformApiSubscriptionToFrontend(
				apiSubscription,
				mockCategories,
			);

			expect(result.description).toBeUndefined(); // nullはundefinedに変換される
		});
	});

	describe("transformFormDataToCreateRequest", () => {
		it("should transform form data to create request format", () => {
			const formData: SubscriptionFormData = {
				name: "Spotify",
				amount: 980,
				categoryId: "1",
				billingCycle: "monthly",
				nextBillingDate: "2025-08-01",
				isActive: true,
				description: "音楽ストリーミング",
			};

			const result = transformFormDataToCreateRequest(formData);

			expect(result).toEqual({
				name: "Spotify",
				amount: 980,
				categoryId: 1, // string -> number変換
				billingCycle: "monthly",
				nextBillingDate: "2025-08-01T00:00:00.000Z", // formatDateToISOによりISO形式に変換
				isActive: true,
				description: "音楽ストリーミング",
			});
		});

		it("should handle missing optional fields", () => {
			const formData: SubscriptionFormData = {
				name: "Service",
				amount: 1000,
				categoryId: "2",
				billingCycle: "yearly",
				nextBillingDate: "2025-12-31",
				isActive: false,
				// description は省略
			};

			const result = transformFormDataToCreateRequest(formData);

			expect(result.description).toBeUndefined();
			expect(result.isActive).toBe(false);
		});
	});

	describe("transformFormDataToUpdateRequest", () => {
		it("should transform partial form data to update request format", () => {
			const formData: Partial<SubscriptionFormData> = {
				name: "Updated Service",
				amount: 1500,
			};

			const result = transformFormDataToUpdateRequest(formData);

			expect(result).toEqual({
				name: "Updated Service",
				amount: 1500,
			});
		});

		it("should handle categoryId conversion", () => {
			const formData: Partial<SubscriptionFormData> = {
				categoryId: "3",
			};

			const result = transformFormDataToUpdateRequest(formData);

			expect(result).toEqual({
				categoryId: 3, // string -> number変換
			});
		});

		it("should handle empty partial data", () => {
			const formData: Partial<SubscriptionFormData> = {};

			const result = transformFormDataToUpdateRequest(formData);

			expect(result).toEqual({});
		});
	});
});
