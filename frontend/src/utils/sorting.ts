/**
 * ソート関連のユーティリティ関数
 *
 * 設計方針:
 * - 純粋関数として実装
 * - ジェネリック型で汎用性を確保
 * - 型安全性の向上
 */

import type { Transaction } from "../lib/api/types";

/**
 * 日付でソートする比較関数を生成
 *
 * @param order - ソート順序 (asc: 昇順, desc: 降順)
 * @returns 比較関数
 */
export function createDateComparator(
	order: "asc" | "desc" = "desc",
): (a: Transaction, b: Transaction) => number {
	return (a: Transaction, b: Transaction) => {
		const dateA = new Date(a.date).getTime();
		const dateB = new Date(b.date).getTime();
		return order === "asc" ? dateA - dateB : dateB - dateA;
	};
}

/**
 * 金額でソートする比較関数を生成
 *
 * @param order - ソート順序 (asc: 昇順, desc: 降順)
 * @returns 比較関数
 */
export function createAmountComparator(
	order: "asc" | "desc" = "desc",
): (a: Transaction, b: Transaction) => number {
	return (a: Transaction, b: Transaction) => {
		return order === "asc" ? a.amount - b.amount : b.amount - a.amount;
	};
}

/**
 * トランザクションをソートする
 *
 * @param transactions - ソート対象のトランザクション配列
 * @param sortBy - ソートフィールド
 * @param sortOrder - ソート順序
 * @returns ソート済みの新しい配列
 */
export function sortTransactions(
	transactions: readonly Transaction[],
	sortBy: "date" | "amount" = "date",
	sortOrder: "asc" | "desc" = "desc",
): Transaction[] {
	const comparator =
		sortBy === "date"
			? createDateComparator(sortOrder)
			: createAmountComparator(sortOrder);

	return [...transactions].sort(comparator);
}

/**
 * 配列がソート済みかを判定する
 *
 * @param transactions - 判定対象の配列
 * @param sortBy - ソートフィールド
 * @param sortOrder - ソート順序
 * @returns ソート済みならtrue
 */
export function isSorted(
	transactions: readonly Transaction[],
	sortBy: "date" | "amount" = "date",
	sortOrder: "asc" | "desc" = "desc",
): boolean {
	if (transactions.length <= 1) return true;

	const comparator =
		sortBy === "date"
			? createDateComparator(sortOrder)
			: createAmountComparator(sortOrder);

	for (let i = 0; i < transactions.length - 1; i++) {
		if (comparator(transactions[i], transactions[i + 1]) > 0) {
			return false;
		}
	}

	return true;
}
