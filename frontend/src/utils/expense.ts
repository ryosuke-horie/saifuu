/**
 * 支出・収入関連のユーティリティ関数
 *
 * 取引データの変換やフォーマットを行う関数を提供
 */

import type { Transaction } from "../lib/api/types";
import type { ExpenseFormData } from "../types/expense";

/**
 * Transaction型からExpenseFormData型への変換
 *
 * 編集ダイアログで使用するため、APIから取得した取引データを
 * フォームで扱える形式に変換する
 *
 * @param transaction - 変換元の取引データ
 * @returns フォーム用のデータ形式
 */
export function convertTransactionToFormData(
	transaction: Transaction,
): ExpenseFormData {
	return {
		amount: transaction.amount,
		type: transaction.type,
		description: transaction.description ?? undefined,
		date: transaction.date,
		categoryId: transaction.categoryId ?? undefined,
	};
}
