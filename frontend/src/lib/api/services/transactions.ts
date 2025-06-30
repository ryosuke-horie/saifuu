/**
 * 取引API サービス
 *
 * 取引（収入・支出）関連のAPI呼び出しを管理する
 * 取引の記録・編集・削除・統計取得を提供
 */

import { addQueryParams, apiClient } from "../client";
import { endpoints } from "../config";
import type {
	CreateTransactionRequest,
	DateRange,
	DeleteResponse,
	GetTransactionsQuery,
	MonthlyStats,
	Transaction,
	TransactionStats,
	TransactionType,
	UpdateTransactionRequest,
} from "../types";

/**
 * 取引一覧を取得する
 */
export async function getTransactions(
	query?: GetTransactionsQuery,
): Promise<Transaction[]> {
	const endpoint = addQueryParams(
		endpoints.transactions.list,
		query as Record<string, unknown>,
	);
	return apiClient.get<Transaction[]>(endpoint);
}

/**
 * 取引詳細を取得する
 */
export async function getTransaction(id: string): Promise<Transaction> {
	const endpoint = endpoints.transactions.detail(id);
	return apiClient.get<Transaction>(endpoint);
}

/**
 * 新しい取引を作成する
 */
export async function createTransaction(
	data: CreateTransactionRequest,
): Promise<Transaction> {
	const endpoint = endpoints.transactions.create;
	return apiClient.post<Transaction>(endpoint, data);
}

/**
 * 取引を更新する
 */
export async function updateTransaction(
	id: string,
	data: UpdateTransactionRequest,
): Promise<Transaction> {
	const endpoint = endpoints.transactions.update(id);
	return apiClient.put<Transaction>(endpoint, data);
}

/**
 * 取引を削除する
 */
export async function deleteTransaction(id: string): Promise<DeleteResponse> {
	const endpoint = endpoints.transactions.delete(id);
	return apiClient.delete<DeleteResponse>(endpoint);
}

/**
 * 取引統計を取得する
 */
export async function getTransactionStats(
	dateRange?: DateRange,
): Promise<TransactionStats> {
	const query = dateRange
		? {
				dateFrom: dateRange.from,
				dateTo: dateRange.to,
			}
		: undefined;

	const endpoint = addQueryParams(endpoints.transactions.stats, query);
	return apiClient.get<TransactionStats>(endpoint);
}

/**
 * 収入取引のみを取得する
 */
export async function getIncomeTransactions(
	query?: Omit<GetTransactionsQuery, "type">,
): Promise<Transaction[]> {
	return getTransactions({ ...query, type: "income" });
}

/**
 * 支出取引のみを取得する
 */
export async function getExpenseTransactions(
	query?: Omit<GetTransactionsQuery, "type">,
): Promise<Transaction[]> {
	return getTransactions({ ...query, type: "expense" });
}

/**
 * 特定のカテゴリの取引を取得する
 */
export async function getTransactionsByCategory(
	categoryId: string,
	query?: Omit<GetTransactionsQuery, "categoryId">,
): Promise<Transaction[]> {
	return getTransactions({ ...query, categoryId });
}

/**
 * 期間指定で取引を取得する
 */
export async function getTransactionsByDateRange(
	dateRange: DateRange,
	query?: Omit<GetTransactionsQuery, "dateFrom" | "dateTo">,
): Promise<Transaction[]> {
	return getTransactions({
		...query,
		dateFrom: dateRange.from,
		dateTo: dateRange.to,
	});
}

/**
 * 今月の取引を取得する
 */
export async function getCurrentMonthTransactions(): Promise<Transaction[]> {
	const now = new Date();
	const year = now.getFullYear();
	const month = now.getMonth();

	const from = new Date(year, month, 1).toISOString().split("T")[0];
	const to = new Date(year, month + 1, 0).toISOString().split("T")[0];

	return getTransactionsByDateRange({ from, to });
}

/**
 * 先月の取引を取得する
 */
export async function getLastMonthTransactions(): Promise<Transaction[]> {
	const now = new Date();
	const year = now.getFullYear();
	const month = now.getMonth();

	const from = new Date(year, month - 1, 1).toISOString().split("T")[0];
	const to = new Date(year, month, 0).toISOString().split("T")[0];

	return getTransactionsByDateRange({ from, to });
}

/**
 * 今年の取引を取得する
 */
export async function getCurrentYearTransactions(): Promise<Transaction[]> {
	const now = new Date();
	const year = now.getFullYear();

	const from = `${year}-01-01`;
	const to = `${year}-12-31`;

	return getTransactionsByDateRange({ from, to });
}

/**
 * 月別統計を取得する
 */
export async function getMonthlyStats(year?: number): Promise<MonthlyStats[]> {
	const targetYear = year || new Date().getFullYear();
	const endpoint = `/transactions/stats/monthly?year=${targetYear}`;
	return apiClient.get<MonthlyStats[]>(endpoint);
}

/**
 * 最近の取引を取得する（最新N件）
 */
export async function getRecentTransactions(
	limit = 10,
): Promise<Transaction[]> {
	return getTransactions({ limit, page: 1 });
}

/**
 * 大きな金額の取引を取得する（指定金額以上）
 */
export async function getLargeTransactions(
	threshold: number,
	type?: TransactionType,
): Promise<Transaction[]> {
	// 実際のAPIでは amount >= threshold のフィルターを実装
	const query: GetTransactionsQuery = { type };
	const endpoint = addQueryParams("/transactions/large", {
		...query,
		threshold: threshold.toString(),
	});
	return apiClient.get<Transaction[]>(endpoint);
}

/**
 * 取引の一括作成
 * CSVインポート等で使用
 */
export async function createTransactionsBatch(
	transactions: CreateTransactionRequest[],
): Promise<Transaction[]> {
	const endpoint = "/transactions/batch";
	return apiClient.post<Transaction[]>(endpoint, { transactions });
}

/**
 * 取引の一括削除
 */
export async function deleteTransactionsBatch(
	transactionIds: string[],
): Promise<DeleteResponse> {
	const endpoint = "/transactions/batch";
	// ボディ付きのDELETEリクエストのため、POSTメソッドでDELETEアクションを実行
	return apiClient.post<DeleteResponse>(endpoint, {
		action: "delete",
		ids: transactionIds,
	});
}

/**
 * 取引サービスのデフォルトエクスポート
 */
export const transactionService = {
	getTransactions,
	getTransaction,
	createTransaction,
	updateTransaction,
	deleteTransaction,
	getTransactionStats,
	getIncomeTransactions,
	getExpenseTransactions,
	getTransactionsByCategory,
	getTransactionsByDateRange,
	getCurrentMonthTransactions,
	getLastMonthTransactions,
	getCurrentYearTransactions,
	getMonthlyStats,
	getRecentTransactions,
	getLargeTransactions,
	createTransactionsBatch,
	deleteTransactionsBatch,
} as const;
