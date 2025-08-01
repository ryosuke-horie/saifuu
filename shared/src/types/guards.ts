// 型ガードとアサーション関数

import type { Category, Subscription, Transaction } from './api'
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
