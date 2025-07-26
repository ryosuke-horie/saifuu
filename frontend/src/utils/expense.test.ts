/**
 * expense.ts のテスト
 */

import { describe, expect, it } from "vitest";
import type { Transaction } from "../lib/api/types";
import { convertTransactionToFormData } from "./expense";

describe("convertTransactionToFormData", () => {
	it("取引データを正しくフォームデータに変換する", () => {
		const transaction: Transaction = {
			id: "1",
			amount: 1000,
			type: "expense",
			description: "昼食代",
			date: "2024-01-15",
			category: {
				id: "cat-1",
				name: "食費",
				type: "expense",
				color: "#FF0000",
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
			},
			createdAt: "2024-01-15T12:00:00Z",
			updatedAt: "2024-01-15T12:00:00Z",
		};

		const result = convertTransactionToFormData(transaction);

		expect(result).toEqual({
			amount: 1000,
			type: "expense",
			description: "昼食代",
			date: "2024-01-15",
			categoryId: "cat-1",
		});
	});

	it("説明がnullの場合undefinedに変換する", () => {
		const transaction: Transaction = {
			id: "2",
			amount: 2000,
			type: "expense",
			description: null,
			date: "2024-01-25",
			category: null,
			createdAt: "2024-01-25T08:00:00Z",
			updatedAt: "2024-01-25T08:00:00Z",
		};

		const result = convertTransactionToFormData(transaction);

		expect(result.description).toBeUndefined();
		expect(result.categoryId).toBeUndefined();
	});
});
