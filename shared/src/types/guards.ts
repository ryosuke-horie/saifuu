// 型ガードとアサーション関数

import type {
	BalanceSummaryResponse,
	Category,
	ErrorResponse,
	StatsResponse,
	Subscription,
	Transaction,
	TransactionResponse,
} from './api'
import type { BillingCycle, CategoryType, TransactionType } from './base'

// 基本的な型ガード
export const isTransactionType = (value: unknown): value is TransactionType => {
	return value === 'income' || value === 'expense'
}

export const isCategoryType = (value: unknown): value is CategoryType => {
	return value === 'expense' || value === 'income'
}

export const isBillingCycle = (value: unknown): value is BillingCycle => {
	return value === 'monthly' || value === 'yearly' || value === 'weekly'
}

// エンティティ型ガード
export const isTransaction = (value: unknown): value is Transaction => {
	if (typeof value !== 'object' || value === null) {
		return false
	}

	const obj = value as Record<string, unknown>
	return (
		typeof obj.id === 'string' &&
		typeof obj.amount === 'number' &&
		isTransactionType(obj.type) &&
		typeof obj.date === 'string' &&
		typeof obj.createdAt === 'string' &&
		typeof obj.updatedAt === 'string'
	)
}

export const isCategory = (value: unknown): value is Category => {
	if (typeof value !== 'object' || value === null) {
		return false
	}

	const obj = value as Record<string, unknown>
	return (
		typeof obj.id === 'string' &&
		typeof obj.name === 'string' &&
		isCategoryType(obj.type) &&
		typeof obj.createdAt === 'string' &&
		typeof obj.updatedAt === 'string'
	)
}

export const isSubscription = (value: unknown): value is Subscription => {
	if (typeof value !== 'object' || value === null) {
		return false
	}

	const obj = value as Record<string, unknown>
	return (
		typeof obj.id === 'string' &&
		typeof obj.name === 'string' &&
		typeof obj.amount === 'number' &&
		isBillingCycle(obj.billingCycle) &&
		typeof obj.startDate === 'string' &&
		typeof obj.isActive === 'boolean' &&
		typeof obj.createdAt === 'string' &&
		typeof obj.updatedAt === 'string'
	)
}

// アサーション関数
export function assertTransactionType(
	value: unknown,
): asserts value is TransactionType {
	if (!isTransactionType(value)) {
		throw new Error(`Invalid transaction type: ${value}`)
	}
}

export function assertCategoryType(
	value: unknown,
): asserts value is CategoryType {
	if (!isCategoryType(value)) {
		throw new Error(`Invalid category type: ${value}`)
	}
}

export function assertBillingCycle(
	value: unknown,
): asserts value is BillingCycle {
	if (!isBillingCycle(value)) {
		throw new Error(`Invalid billing cycle: ${value}`)
	}
}

export function assertTransaction(
	value: unknown,
): asserts value is Transaction {
	if (!isTransaction(value)) {
		throw new Error('Value is not a valid Transaction')
	}
}

export function assertCategory(value: unknown): asserts value is Category {
	if (!isCategory(value)) {
		throw new Error('Value is not a valid Category')
	}
}

export function assertSubscription(
	value: unknown,
): asserts value is Subscription {
	if (!isSubscription(value)) {
		throw new Error('Value is not a valid Subscription')
	}
}

// レスポンス型ガード
export function isTransactionResponse(value: unknown): value is TransactionResponse {
	return isTransaction(value)
}

export function isStatsResponse(value: unknown): value is StatsResponse {
	return (
		typeof value === 'object' &&
		value !== null &&
		'totalExpense' in value &&
		'totalIncome' in value &&
		'balance' in value &&
		'transactionCount' in value &&
		'expenseCount' in value &&
		'incomeCount' in value
	)
}

export function isBalanceSummaryResponse(value: unknown): value is BalanceSummaryResponse {
	return (
		typeof value === 'object' &&
		value !== null &&
		'income' in value &&
		'expense' in value &&
		'balance' in value &&
		'savingsRate' in value &&
		'trend' in value &&
		typeof (value as BalanceSummaryResponse).income === 'number' &&
		typeof (value as BalanceSummaryResponse).expense === 'number' &&
		typeof (value as BalanceSummaryResponse).balance === 'number' &&
		typeof (value as BalanceSummaryResponse).savingsRate === 'number' &&
		['positive', 'negative', 'neutral'].includes((value as BalanceSummaryResponse).trend)
	)
}

export function isErrorResponse(value: unknown): value is ErrorResponse {
	return (
		typeof value === 'object' &&
		value !== null &&
		'error' in value &&
		typeof (value as ErrorResponse).error === 'string'
	)
}
