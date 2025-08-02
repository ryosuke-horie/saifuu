// TransactionServiceのユニットテスト
// バリデーション、フォーマット、統計計算などの共通ロジックをテスト

import { describe, expect, it } from "vitest";
import type { Category } from "@/types/category";
import type { Transaction, TransactionFormData } from "@/types/transaction";
import { TransactionService } from "../TransactionService";

// テスト用のモックデータ
const mockCategories: Category[] = [
	{
		id: "1",
		name: "食費",
		type: "expense",
		color: undefined,
		createdAt: "",
		updatedAt: "",
	},
	{
		id: "2",
		name: "給与",
		type: "income",
		color: undefined,
		createdAt: "",
		updatedAt: "",
	},
	{
		id: "3",
		name: "交通費",
		type: "expense",
		color: undefined,
		createdAt: "",
		updatedAt: "",
	},
];

const mockTransactions: Transaction[] = [
	{
		id: "1",
		amount: 1000,
		type: "expense",
		categoryId: "1",
		date: "2025-01-20",
		description: "昼食",
		createdAt: "2025-01-20T12:00:00Z",
		updatedAt: "2025-01-20T12:00:00Z",
	},
	{
		id: "2",
		amount: 300000,
		type: "income",
		categoryId: "2",
		date: "2025-01-25",
		description: "月絳",
		createdAt: "2025-01-25T09:00:00Z",
		updatedAt: "2025-01-25T09:00:00Z",
	},
	{
		id: "3",
		amount: 2000,
		type: "expense",
		categoryId: "3",
		date: "2025-01-22",
		description: "電車代",
		createdAt: "2025-01-22T18:00:00Z",
		updatedAt: "2025-01-22T18:00:00Z",
	},
];

describe("TransactionService", () => {
	describe("validate", () => {
		it("有効なデータの場合、isValidがtrueを返す", () => {
			const validData: TransactionFormData = {
				amount: 1000,
				type: "expense",
				categoryId: "1",
				date: "2025-01-20",
				description: "テスト",
			};

			const result = TransactionService.validate(validData);
			expect(result.isValid).toBe(true);
			expect(result.errors).toEqual({});
		});

		it("金額が0以下の場合、エラーを返す", () => {
			const invalidData: Partial<TransactionFormData> = {
				amount: 0,
				type: "expense",
				categoryId: "1",
				date: "2025-01-20",
			};

			const result = TransactionService.validate(invalidData);
			expect(result.isValid).toBe(false);
			expect(result.errors.amount).toBe("金額は1円以上で入力してください");
		});

		it("金額が上限を超える場合、エラーを返す", () => {
			const invalidData: Partial<TransactionFormData> = {
				amount: 100000000,
				type: "expense",
				categoryId: "1",
				date: "2025-01-20",
			};

			const result = TransactionService.validate(invalidData);
			expect(result.isValid).toBe(false);
			expect(result.errors.amount).toBe(
				"金額は99,999,999円以下で入力してください",
			);
		});

		it("カテゴリが未選択の場合、エラーを返す", () => {
			const invalidData: Partial<TransactionFormData> = {
				amount: 1000,
				type: "expense",
				categoryId: "",
				date: "2025-01-20",
			};

			const result = TransactionService.validate(invalidData);
			expect(result.isValid).toBe(false);
			expect(result.errors.categoryId).toBe("カテゴリを選択してください");
		});

		it("未来の日付の場合、エラーを返す", () => {
			// ローカルタイムゾーンで明日の日付を確実に作成
			const today = new Date();
			const tomorrow = new Date(
				today.getFullYear(),
				today.getMonth(),
				today.getDate() + 1,
			);
			// YYYY-MM-DD形式に変換（ローカルタイムゾーン）
			const year = tomorrow.getFullYear();
			const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
			const day = String(tomorrow.getDate()).padStart(2, "0");
			const tomorrowStr = `${year}-${month}-${day}`;

			const invalidData: Partial<TransactionFormData> = {
				amount: 1000,
				type: "expense",
				categoryId: "1",
				date: tomorrowStr,
			};

			const result = TransactionService.validate(invalidData);
			expect(result.isValid).toBe(false);
			expect(result.errors.date).toBe("未来の日付は入力できません");
		});

		it("説明が500文字を超える場合、エラーを返す", () => {
			const invalidData: Partial<TransactionFormData> = {
				amount: 1000,
				type: "expense",
				categoryId: "1",
				date: "2025-01-20",
				description: "a".repeat(501),
			};

			const result = TransactionService.validate(invalidData);
			expect(result.isValid).toBe(false);
			expect(result.errors.description).toBe(
				"説明は500文字以内で入力してください",
			);
		});

		it("不正なタイプの場合、エラーを返す", () => {
			const invalidData = {
				amount: 1000,
				type: "invalid" as any,
				categoryId: "1",
				date: "2025-01-20",
			};

			const result = TransactionService.validate(invalidData);
			expect(result.isValid).toBe(false);
			expect(result.errors.type).toBe("取引タイプが不正です");
		});
	});

	describe("format", () => {
		it("トランザクションを正しくフォーマットする", () => {
			const transaction = mockTransactions[0];
			const formatted = TransactionService.format(transaction, mockCategories);

			expect(formatted.formattedAmount).toBe("￥1,000");
			expect(formatted.formattedDate).toBe("2025/01/20");
			expect(formatted.categoryName).toBe("食費");
		});

		it("カテゴリが見つからない場合、「不明なカテゴリ」を返す", () => {
			const transaction = { ...mockTransactions[0], categoryId: "999" };
			const formatted = TransactionService.format(transaction, mockCategories);

			expect(formatted.categoryName).toBe("不明なカテゴリ");
		});
	});

	describe("calculateStats", () => {
		it("統計情報を正しく計算する", () => {
			const stats = TransactionService.calculateStats(
				mockTransactions,
				mockCategories,
			);

			expect(stats.total).toBe(303000);
			expect(stats.count).toBe(3);
			expect(stats.average).toBe(101000);
		});

		it("カテゴリ別の統計を正しく計算する", () => {
			const expenseTransactions = mockTransactions.filter(
				(t) => t.type === "expense",
			);
			const stats = TransactionService.calculateStats(
				expenseTransactions,
				mockCategories,
			);

			expect(stats.byCategory).toHaveLength(2);
			expect(stats.byCategory[0].categoryId).toBe("3"); // 交通費（金額が大きい方）
			expect(stats.byCategory[0].total).toBe(2000);
			expect(stats.byCategory[1].categoryId).toBe("1"); // 食費
			expect(stats.byCategory[1].total).toBe(1000);
		});

		it("月別の統計を正しく計算する", () => {
			const stats = TransactionService.calculateStats(
				mockTransactions,
				mockCategories,
			);

			expect(stats.byMonth).toHaveLength(1);
			expect(stats.byMonth[0].month).toBe("2025-01");
			expect(stats.byMonth[0].total).toBe(303000);
			expect(stats.byMonth[0].count).toBe(3);
		});

		it("空の配列の場合、ゼロの統計を返す", () => {
			const stats = TransactionService.calculateStats([], mockCategories);

			expect(stats.total).toBe(0);
			expect(stats.count).toBe(0);
			expect(stats.average).toBe(0);
			expect(stats.byCategory).toHaveLength(0);
			expect(stats.byMonth).toHaveLength(0);
		});
	});

	describe("filterByType", () => {
		it("指定したタイプのトランザクションのみを返す", () => {
			const incomes = TransactionService.filterByType(
				mockTransactions,
				"income",
			);
			expect(incomes).toHaveLength(1);
			expect(incomes[0].type).toBe("income");

			const expenses = TransactionService.filterByType(
				mockTransactions,
				"expense",
			);
			expect(expenses).toHaveLength(2);
			expect(expenses.every((t) => t.type === "expense")).toBe(true);
		});
	});

	describe("filterByDateRange", () => {
		it("指定した日付範囲のトランザクションのみを返す", () => {
			const filtered = TransactionService.filterByDateRange(
				mockTransactions,
				"2025-01-21",
				"2025-01-25",
			);

			expect(filtered).toHaveLength(2);
			expect(filtered.some((t) => t.date === "2025-01-22")).toBe(true);
			expect(filtered.some((t) => t.date === "2025-01-25")).toBe(true);
		});
	});

	describe("filterByCategory", () => {
		it("指定したカテゴリのトランザクションのみを返す", () => {
			const filtered = TransactionService.filterByCategory(
				mockTransactions,
				"1",
			);

			expect(filtered).toHaveLength(1);
			expect(filtered[0].categoryId).toBe("1");
		});
	});

	describe("filter", () => {
		it("複数条件でフィルタリングできる", () => {
			const filtered = TransactionService.filter(mockTransactions, {
				type: "expense",
				categoryId: "1",
			});

			expect(filtered).toHaveLength(1);
			expect(filtered[0].type).toBe("expense");
			expect(filtered[0].categoryId).toBe("1");
		});
	});

	describe("sortByDate", () => {
		it("日付の新しい順（デフォルト）でソートする", () => {
			const sorted = TransactionService.sortByDate(mockTransactions);

			expect(sorted[0].date).toBe("2025-01-25");
			expect(sorted[1].date).toBe("2025-01-22");
			expect(sorted[2].date).toBe("2025-01-20");
		});

		it("日付の古い順でソートする", () => {
			const sorted = TransactionService.sortByDate(mockTransactions, true);

			expect(sorted[0].date).toBe("2025-01-20");
			expect(sorted[1].date).toBe("2025-01-22");
			expect(sorted[2].date).toBe("2025-01-25");
		});
	});

	describe("sortByAmount", () => {
		it("金額の大きい順（デフォルト）でソートする", () => {
			const sorted = TransactionService.sortByAmount(mockTransactions);

			expect(sorted[0].amount).toBe(300000);
			expect(sorted[1].amount).toBe(2000);
			expect(sorted[2].amount).toBe(1000);
		});

		it("金額の小さい順でソートする", () => {
			const sorted = TransactionService.sortByAmount(mockTransactions, true);

			expect(sorted[0].amount).toBe(1000);
			expect(sorted[1].amount).toBe(2000);
			expect(sorted[2].amount).toBe(300000);
		});
	});

	describe("createDefaultFormData", () => {
		it("デフォルトのフォームデータを生成する", () => {
			const defaultData = TransactionService.createDefaultFormData("expense");

			expect(defaultData.amount).toBe(0);
			expect(defaultData.type).toBe("expense");
			expect(defaultData.categoryId).toBe("");
			expect(defaultData.date).toBe(new Date().toISOString().split("T")[0]);
			expect(defaultData.description).toBe("");
		});
	});

	describe("toFormData", () => {
		it("トランザクションをフォームデータに変換する", () => {
			const transaction = mockTransactions[0];
			const formData = TransactionService.toFormData(transaction);

			expect(formData.amount).toBe(transaction.amount);
			expect(formData.type).toBe(transaction.type);
			expect(formData.categoryId).toBe(transaction.categoryId);
			expect(formData.date).toBe(transaction.date);
			expect(formData.description).toBe(transaction.description);
		});

		it("説明がnullの場合、空文字列に変換する", () => {
			const transaction = { ...mockTransactions[0], description: undefined };
			const formData = TransactionService.toFormData(transaction);

			expect(formData.description).toBe("");
		});
	});
});
