/**
 * expense.ts のテスト
 */

import { describe, expect, it } from "vitest";
import type { Transaction } from "../lib/api/types";
import { convertTransactionToFormData } from "./expense";

describe("convertTransactionToFormData", () => {
	it("カテゴリ付きの取引データを正しく変換する", () => {
		// Arrange
		const transaction: Transaction = {
			id: "1",
			amount: 1000,
			type: "expense",
			description: "昼食代",
			date: "2024-01-15",
			categoryId: "cat-1",
			createdAt: "2024-01-15T12:00:00Z",
			updatedAt: "2024-01-15T12:00:00Z",
		};

		// Act
		const result = convertTransactionToFormData(transaction);

		// Assert
		expect(result).toEqual({
			amount: 1000,
			type: "expense",
			description: "昼食代",
			date: "2024-01-15",
			categoryId: "cat-1",
		});
	});

	it("カテゴリなしの取引データを正しく変換する", () => {
		// Arrange
		const transaction: Transaction = {
			id: "2",
			amount: 5000,
			type: "income" as any, // 意図的にincomeタイプをテスト
			description: "臨時収入",
			date: "2024-01-20",
			categoryId: undefined,
			createdAt: "2024-01-20T10:00:00Z",
			updatedAt: "2024-01-20T10:00:00Z",
		};

		// Act
		const result = convertTransactionToFormData(transaction);

		// Assert
		expect(result).toEqual({
			amount: 5000,
			type: "income",
			description: "臨時収入",
			date: "2024-01-20",
			categoryId: undefined,
		});
	});

	it("説明がnullの取引データを正しく変換する", () => {
		// Arrange
		const transaction: Transaction = {
			id: "3",
			amount: 2000,
			type: "expense",
			description: undefined,
			date: "2024-01-25",
			categoryId: "cat-2",
			createdAt: "2024-01-25T08:00:00Z",
			updatedAt: "2024-01-25T08:00:00Z",
		};

		// Act
		const result = convertTransactionToFormData(transaction);

		// Assert
		expect(result).toEqual({
			amount: 2000,
			type: "expense",
			description: undefined,
			date: "2024-01-25",
			categoryId: "cat-2",
		});
	});

	it("空文字の説明を持つ取引データを正しく変換する", () => {
		// Arrange
		const transaction: Transaction = {
			id: "4",
			amount: 3000,
			type: "expense",
			description: "",
			date: "2024-01-30",
			categoryId: undefined,
			createdAt: "2024-01-30T14:00:00Z",
			updatedAt: "2024-01-30T14:00:00Z",
		};

		// Act
		const result = convertTransactionToFormData(transaction);

		// Assert
		expect(result).toEqual({
			amount: 3000,
			type: "expense",
			description: "", // 空文字はそのまま保持（フォームバリデーションで処理）
			date: "2024-01-30",
			categoryId: undefined,
		});
	});
});
