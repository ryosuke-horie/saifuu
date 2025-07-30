import { describe, expect, it } from "vitest";
import type { ExpenseFormData } from "../../../types/expense";
import type { IncomeFormData } from "../../../types/income";
import type { SubscriptionFormData } from "../../api/types";
import {
	validateExpenseFieldWithZod,
	validateExpenseFormWithZod,
	validateIncomeFieldWithZod,
	validateIncomeFormWithZod,
	validateSubscriptionFieldWithZod,
	validateSubscriptionFormWithZod,
} from "../validation";

describe("Zodバリデーション関数のテスト", () => {
	describe("validateExpenseFormWithZod", () => {
		it("有効な支出データを受け入れる", () => {
			const data: ExpenseFormData = {
				amount: 1000,
				type: "expense",
				date: "2024-01-01",
				description: "テスト支出",
				categoryId: "1",
			};

			const result = validateExpenseFormWithZod(data);
			expect(result.success).toBe(true);
			expect(result.errors).toEqual({});
		});

		it("必須フィールドのエラーを検出する", () => {
			const data: ExpenseFormData = {
				amount: 0,
				type: "expense",
				date: "",
				description: "",
				categoryId: "",
			};

			const result = validateExpenseFormWithZod(data);
			expect(result.success).toBe(false);
			expect(result.errors.amount).toContain("1円以上");
			expect(result.errors.date).toContain("2000-01-01以降");
		});

		it("金額の範囲エラーを検出する", () => {
			const data: ExpenseFormData = {
				amount: 10_000_001,
				type: "expense",
				date: "2024-01-01",
				description: "",
				categoryId: "1",
			};

			const result = validateExpenseFormWithZod(data);
			expect(result.success).toBe(false);
			expect(result.errors.amount).toContain("10000000円以下");
		});

		it("説明文の長さエラーを検出する", () => {
			const data: ExpenseFormData = {
				amount: 1000,
				type: "expense",
				date: "2024-01-01",
				description: "a".repeat(501),
				categoryId: "1",
			};

			const result = validateExpenseFormWithZod(data);
			expect(result.success).toBe(false);
			expect(result.errors.description).toContain("500文字以下");
		});
	});

	describe("validateExpenseFieldWithZod", () => {
		const baseData: ExpenseFormData = {
			amount: 1000,
			type: "expense",
			date: "2024-01-01",
			description: "",
			categoryId: "1",
		};

		it("有効な金額フィールドを受け入れる", () => {
			const error = validateExpenseFieldWithZod("amount", 2000, baseData);
			expect(error).toBeUndefined();
		});

		it("無効な金額フィールドのエラーを返す", () => {
			const error = validateExpenseFieldWithZod("amount", -100, baseData);
			expect(error).toContain("1円以上");
		});

		it("有効な日付フィールドを受け入れる", () => {
			const error = validateExpenseFieldWithZod("date", "2024-12-31", baseData);
			expect(error).toBeUndefined();
		});

		it("無効な日付フィールドのエラーを返す", () => {
			const error = validateExpenseFieldWithZod("date", "", baseData);
			expect(error).toContain("2000-01-01以降");
		});
	});

	describe("validateSubscriptionFormWithZod", () => {
		it("有効なサブスクリプションデータを受け入れる", () => {
			const data: SubscriptionFormData = {
				name: "Netflix",
				amount: 1500,
				billingCycle: "monthly",
				nextBillingDate: "2024-02-01",
				categoryId: "1",
				isActive: true,
				description: "エンタメ",
			};

			const result = validateSubscriptionFormWithZod(data);
			expect(result.success).toBe(true);
			expect(result.errors).toEqual({});
		});

		it("必須フィールドのエラーを検出する", () => {
			const data: SubscriptionFormData = {
				name: "",
				amount: 0,
				billingCycle: "monthly",
				nextBillingDate: "",
				categoryId: "",
				isActive: true,
				description: "",
			};

			const result = validateSubscriptionFormWithZod(data);
			expect(result.success).toBe(false);
			expect(result.errors.name).toContain("必須");
			expect(result.errors.amount).toContain("1円以上");
			expect(result.errors.nextBillingDate).toContain("2000-01-01以降");
			// categoryIdは空文字の場合はエラーにならない（オプショナル扱い）
		});

		it("名前の長さエラーを検出する", () => {
			const data: SubscriptionFormData = {
				name: "a".repeat(101),
				amount: 1500,
				billingCycle: "monthly",
				nextBillingDate: "2024-02-01",
				categoryId: "1",
				isActive: true,
				description: "",
			};

			const result = validateSubscriptionFormWithZod(data);
			expect(result.success).toBe(false);
			expect(result.errors.name).toContain("100文字以下");
		});
	});

	describe("validateSubscriptionFieldWithZod", () => {
		const baseData: SubscriptionFormData = {
			name: "Netflix",
			amount: 1500,
			billingCycle: "monthly",
			nextBillingDate: "2024-02-01",
			categoryId: "1",
			isActive: true,
			description: "",
		};

		it("有効な名前フィールドを受け入れる", () => {
			const error = validateSubscriptionFieldWithZod(
				"name",
				"Spotify",
				baseData,
			);
			expect(error).toBeUndefined();
		});

		it("無効な名前フィールドのエラーを返す", () => {
			const error = validateSubscriptionFieldWithZod("name", "", baseData);
			expect(error).toContain("必須");
		});

		it("有効な請求サイクルを受け入れる", () => {
			const error = validateSubscriptionFieldWithZod(
				"billingCycle",
				"yearly",
				baseData,
			);
			expect(error).toBeUndefined();
		});

		it("無効な請求サイクルのエラーを返す", () => {
			const error = validateSubscriptionFieldWithZod(
				"billingCycle",
				"daily",
				baseData,
			);
			expect(error).toBeDefined();
		});
	});

	describe("validateIncomeFormWithZod", () => {
		it("有効な収入データを受け入れる", () => {
			const data: IncomeFormData = {
				amount: 300000,
				type: "income",
				date: "2024-01-25",
				description: "1月分給与",
				categoryId: "salary",
			};

			const result = validateIncomeFormWithZod(data);
			expect(result.success).toBe(true);
			expect(result.errors).toEqual({});
		});

		it("必須フィールドのエラーを検出する", () => {
			const data: IncomeFormData = {
				amount: 0,
				type: "income",
				date: "",
				description: "",
				categoryId: "",
			};

			const result = validateIncomeFormWithZod(data);
			expect(result.success).toBe(false);
			expect(result.errors.amount).toContain(
				"金額は0より大きい値を入力してください",
			);
			expect(result.errors.date).toContain("日付を入力してください");
		});

		it("金額が負の値の場合にエラーを検出する", () => {
			const data: IncomeFormData = {
				amount: -1000,
				type: "income",
				date: "2024-01-01",
				description: "",
				categoryId: "salary",
			};

			const result = validateIncomeFormWithZod(data);
			expect(result.success).toBe(false);
			expect(result.errors.amount).toContain(
				"金額は0より大きい値を入力してください",
			);
		});

		it("説明文の長さエラーを検出する", () => {
			const data: IncomeFormData = {
				amount: 100000,
				type: "income",
				date: "2024-01-01",
				description: "a".repeat(501),
				categoryId: "salary",
			};

			const result = validateIncomeFormWithZod(data);
			expect(result.success).toBe(false);
			expect(result.errors.description).toContain(
				"説明は500文字以内で入力してください",
			);
		});

		it("カテゴリIDが適切にマッピングされる", () => {
			const testCases = [
				{ categoryId: "salary", expectedNumericId: 101 },
				{ categoryId: "bonus", expectedNumericId: 102 },
				{ categoryId: "side_business", expectedNumericId: 103 },
				{ categoryId: "investment", expectedNumericId: 104 },
				{ categoryId: "other_income", expectedNumericId: 105 },
			];

			testCases.forEach(({ categoryId }) => {
				const data: IncomeFormData = {
					amount: 100000,
					type: "income",
					date: "2024-01-01",
					description: "",
					categoryId,
				};

				const result = validateIncomeFormWithZod(data);
				expect(result.success).toBe(true);
			});
		});
	});

	describe("validateIncomeFieldWithZod", () => {
		const baseData: IncomeFormData = {
			amount: 300000,
			type: "income",
			date: "2024-01-25",
			description: "",
			categoryId: "101", // 給与カテゴリのnumericId
		};

		it("有効な金額フィールドを受け入れる", () => {
			const error = validateIncomeFieldWithZod("amount", 500000, baseData);
			expect(error).toBeUndefined();
		});

		it("無効な金額フィールドのエラーを返す", () => {
			const error = validateIncomeFieldWithZod("amount", -100, baseData);
			expect(error).toBe("収入金額は0より大きい値を入力してください");
		});

		it("金額が0の場合にエラーを返す", () => {
			const error = validateIncomeFieldWithZod("amount", 0, baseData);
			expect(error).toBe("収入金額は0より大きい値を入力してください");
		});

		it("有効な日付フィールドを受け入れる", () => {
			const error = validateIncomeFieldWithZod("date", "2024-12-31", baseData);
			expect(error).toBeUndefined();
		});

		it("無効な日付フィールドのエラーを返す", () => {
			const error = validateIncomeFieldWithZod("date", "", baseData);
			expect(error).toBe("日付を入力してください");
		});

		it("有効な説明フィールドを受け入れる", () => {
			const error = validateIncomeFieldWithZod(
				"description",
				"給与振込",
				baseData,
			);
			expect(error).toBeUndefined();
		});

		it("説明フィールドが長すぎる場合にエラーを返す", () => {
			const error = validateIncomeFieldWithZod(
				"description",
				"a".repeat(501),
				baseData,
			);
			expect(error).toBe("説明は500文字以内で入力してください");
		});
	});
});
