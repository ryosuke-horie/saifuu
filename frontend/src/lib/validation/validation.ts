// フロントエンドでZodスキーマを活用するためのバリデーション関数

import {
	subscriptionCreateSchema,
	subscriptionUpdateSchema,
	transactionCreateSchema,
	transactionUpdateSchema,
} from "../../../../shared/src/validation/zod-schemas";
import type { SubscriptionFormData } from "../../lib/api/types";
import type { ExpenseFormData } from "../../types/expense";

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
 * 支出フォームデータのバリデーション（更新時）
 */
export function validateExpenseUpdateFormWithZod(
	data: Partial<ExpenseFormData>,
): {
	success: boolean;
	errors: Record<string, string>;
} {
	const apiData =
		data.amount !== undefined ||
		data.type !== undefined ||
		data.date !== undefined ||
		data.description !== undefined ||
		data.categoryId !== undefined
			? toApiTransactionFormat(data as ExpenseFormData)
			: {};

	const result = transactionUpdateSchema.safeParse(apiData);

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
 * サブスクリプションフォームデータのバリデーション（更新時）
 */
export function validateSubscriptionUpdateFormWithZod(
	data: Partial<SubscriptionFormData>,
): {
	success: boolean;
	errors: Record<string, string>;
} {
	const apiData =
		data.name !== undefined ||
		data.amount !== undefined ||
		data.billingCycle !== undefined ||
		data.nextBillingDate !== undefined ||
		data.categoryId !== undefined ||
		data.isActive !== undefined ||
		data.description !== undefined
			? toApiSubscriptionFormat(data as SubscriptionFormData)
			: {};

	const result = subscriptionUpdateSchema.safeParse(apiData);

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
