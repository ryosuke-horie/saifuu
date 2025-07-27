// フロントエンドでZodスキーマを活用するためのバリデーション関数

import { INCOME_CATEGORIES } from "../../../../shared/config/categories";
import {
	incomeCreateSchema,
	subscriptionCreateSchema,
	transactionCreateSchema,
} from "../../../../shared/src/validation/zod-schemas";
import type { SubscriptionFormData } from "../../lib/api/types";
import type { ExpenseFormData } from "../../types/expense";
import type { IncomeFormData } from "../../types/income";

// ExpenseFormDataをAPIで期待される形式に変換
function toApiTransactionFormat(data: ExpenseFormData) {
	return {
		amount: data.amount,
		type: data.type,
		date: data.date,
		description: data.description || undefined,
		categoryId: data.categoryId ? Number(data.categoryId) : undefined,
	};
}

// IncomeFormDataをAPIで期待される形式に変換
function toApiIncomeFormat(data: IncomeFormData) {
	// カテゴリIDをマッピング（収入カテゴリのnumericIdに変換）
	const categoryIdMap = INCOME_CATEGORIES.reduce(
		(acc, category) => {
			acc[category.id] = category.numericId;
			return acc;
		},
		{} as Record<string, number>,
	);

	return {
		amount: data.amount,
		type: data.type,
		date: data.date,
		description: data.description || undefined,
		categoryId: data.categoryId ? categoryIdMap[data.categoryId] : undefined,
	};
}

// SubscriptionFormDataをAPIで期待される形式に変換
function toApiSubscriptionFormat(data: SubscriptionFormData) {
	return {
		name: data.name,
		amount: data.amount,
		billingCycle: data.billingCycle,
		nextBillingDate: data.nextBillingDate,
		categoryId: data.categoryId ? Number(data.categoryId) : undefined,
		isActive: data.isActive,
		description: data.description || undefined,
	};
}

/**
 * 支出フォームデータのバリデーション（作成時）
 */
export function validateExpenseFormWithZod(data: ExpenseFormData): {
	success: boolean;
	errors: Record<string, string>;
} {
	const apiData = toApiTransactionFormat(data);
	const result = transactionCreateSchema.safeParse(apiData);

	if (result.success) {
		return { success: true, errors: {} };
	}

	// Zodのエラーをフォームエラー形式に変換
	const errors: Record<string, string> = {};
	result.error.errors.forEach((zodError) => {
		const field = zodError.path[0] as string;
		errors[field] = zodError.message;
	});

	return { success: false, errors };
}

/**
 * サブスクリプションフォームデータのバリデーション（作成時）
 */
export function validateSubscriptionFormWithZod(data: SubscriptionFormData): {
	success: boolean;
	errors: Record<string, string>;
} {
	const apiData = toApiSubscriptionFormat(data);
	const result = subscriptionCreateSchema.safeParse(apiData);

	if (result.success) {
		return { success: true, errors: {} };
	}

	// Zodのエラーをフォームエラー形式に変換
	const errors: Record<string, string> = {};
	result.error.errors.forEach((zodError) => {
		const field = zodError.path[0] as string;
		errors[field] = zodError.message;
	});

	return { success: false, errors };
}

/**
 * 単一フィールドのバリデーション（支出フォーム用）
 */
export function validateExpenseFieldWithZod(
	field: keyof ExpenseFormData,
	value: unknown,
	currentData: ExpenseFormData,
): string | undefined {
	// 現在のデータに新しい値をマージ
	const newData = {
		...currentData,
		[field]: value,
	};

	const result = validateExpenseFormWithZod(newData);
	return result.errors[field];
}

/**
 * 収入フォームデータのバリデーション（作成時）
 */
export function validateIncomeFormWithZod(data: IncomeFormData): {
	success: boolean;
	errors: Record<string, string>;
} {
	// フォームレベルのバリデーション
	const formErrors: Record<string, string> = {};

	// 金額のバリデーション
	if (!data.amount || data.amount <= 0) {
		formErrors.amount = "金額は0より大きい値を入力してください";
	}

	// 日付のバリデーション
	if (!data.date) {
		formErrors.date = "日付を入力してください";
	}

	// 説明のバリデーション
	if (data.description && data.description.length > 500) {
		formErrors.description = "説明は500文字以内で入力してください";
	}

	// フォームエラーがある場合は早期リターン
	if (Object.keys(formErrors).length > 0) {
		return { success: false, errors: formErrors };
	}

	// Zodスキーマでの詳細バリデーション
	const apiData = toApiIncomeFormat(data);
	const result = incomeCreateSchema.safeParse(apiData);

	if (result.success) {
		return { success: true, errors: {} };
	}

	// Zodのエラーをフォームエラー形式に変換
	const errors: Record<string, string> = {};
	result.error.errors.forEach((zodError) => {
		const field = zodError.path[0] as string;
		// 収入固有のエラーメッセージに変換
		if (field === "amount") {
			// 負の値の場合は別のメッセージ
			if (
				zodError.message.includes("1円以上") ||
				zodError.message.includes("正の数値")
			) {
				errors[field] = "収入金額は0より大きい値を入力してください";
			} else {
				// その他（必須など）
				errors[field] = "金額は0より大きい値を入力してください";
			}
		} else if (field === "date" && zodError.message.includes("必須")) {
			errors[field] = "日付を入力してください";
		} else if (
			field === "description" &&
			zodError.message.includes("500文字以下")
		) {
			errors[field] = "説明は500文字以内で入力してください";
		} else {
			errors[field] = zodError.message;
		}
	});

	return { success: false, errors };
}

/**
 * 単一フィールドのバリデーション（収入フォーム用）
 */
export function validateIncomeFieldWithZod(
	field: keyof IncomeFormData,
	value: unknown,
	_currentData: IncomeFormData,
): string | undefined {
	// フィールド単体のバリデーション（即座にエラーを返す）
	if (field === "amount") {
		const amount = Number(value);
		if (!amount || amount <= 0) {
			return "収入金額は0より大きい値を入力してください";
		}
	} else if (field === "date") {
		if (!value) {
			return "日付を入力してください";
		}
	} else if (field === "description") {
		const desc = String(value || "");
		if (desc.length > 500) {
			return "説明は500文字以内で入力してください";
		}
	}

	// Zodスキーマを使った詳細なバリデーションは必要な場合のみ
	return undefined;
}

/**
 * 単一フィールドのバリデーション（サブスクリプションフォーム用）
 */
export function validateSubscriptionFieldWithZod(
	field: keyof SubscriptionFormData,
	value: unknown,
	currentData: SubscriptionFormData,
): string | undefined {
	// 現在のデータに新しい値をマージ
	const newData = {
		...currentData,
		[field]: value,
	};

	const result = validateSubscriptionFormWithZod(newData);
	return result.errors[field];
}
