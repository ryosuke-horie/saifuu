import type { Transaction, Category } from "../api/types";
import { isTransaction as isBaseTransaction, isCategory as isBaseCategory } from "@shared/types";
import type { TransactionWithCategory } from "../api/types";

/**
 * カテゴリ情報付きの取引かを判定する型ガード
 */
export function isTransactionWithCategory(
  value: unknown,
): value is TransactionWithCategory {
  return (
    isBaseTransaction(value) &&
    (value.category === undefined || value.category === null || isBaseCategory(value.category))
  );
}

/**
 * 取引配列かを判定する型ガード
 */
export function isTransactionArray(value: unknown): value is Transaction[] {
  return Array.isArray(value) && value.every(isBaseTransaction);
}

/**
 * カテゴリ配列かを判定する型ガード
 */
export function isCategoryArray(value: unknown): value is Category[] {
  return Array.isArray(value) && value.every(isBaseCategory);
}

/**
 * カテゴリ情報付きの取引配列かを判定する型ガード
 */
export function isTransactionWithCategoryArray(
  value: unknown,
): value is TransactionWithCategory[] {
  return Array.isArray(value) && value.every(isTransactionWithCategory);
}

