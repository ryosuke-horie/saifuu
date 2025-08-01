// トランザクション（収入・支出）共通処理を提供するサービス関数群
// バリデーション、フォーマット、統計計算などの共通ロジックを集約

import type { Category } from "@/types/category";
import type {
	FormattedTransaction,
	Transaction,
	TransactionFormData,
	TransactionStatistics,
	TransactionType,
	ValidationResult,
} from "@/types/transaction";

/**
 * トランザクションデータのバリデーション
 *
 * 設計意図: Matt Pocockの方針に従い、静的メソッドのみのクラスを関数として実装
 * 型安全性を維持しながら、より関数型プログラミングに適した設計に変更
 */
export function validateTransaction(
	data: Partial<TransactionFormData>,
): ValidationResult {
	const errors: ValidationResult["errors"] = {};

	// 金額のバリデーション
	if (!data.amount || data.amount <= 0) {
		errors.amount = "金額は1円以上で入力してください";
	} else if (data.amount > 99999999) {
		errors.amount = "金額は99,999,999円以下で入力してください";
	}

	// カテゴリのバリデーション
	if (!data.categoryId) {
		errors.categoryId = "カテゴリを選択してください";
	}

	// 日付のバリデーション
	if (!data.date) {
		errors.date = "日付を入力してください";
	} else {
		const selectedDate = new Date(data.date);
		const today = new Date();
		today.setHours(23, 59, 59, 999);

		if (selectedDate > today) {
			errors.date = "未来の日付は入力できません";
		}
	}

	// 説明のバリデーション（任意項目）
	if (data.description && data.description.length > 500) {
		errors.description = "説明は500文字以内で入力してください";
	}

	// タイプのバリデーション
	if (!data.type || !["income", "expense"].includes(data.type)) {
		errors.type = "取引タイプが不正です";
	}

	return {
		isValid: Object.keys(errors).length === 0,
		errors,
	};
}

/**
 * トランザクションデータのフォーマット
 */
export function formatTransaction(
	transaction: Transaction,
	categories: Category[],
): FormattedTransaction {
	const category = categories.find((c) => c.id === transaction.categoryId);

	return {
		...transaction,
		formattedAmount: new Intl.NumberFormat("ja-JP", {
			style: "currency",
			currency: "JPY",
		}).format(transaction.amount),
		formattedDate: new Date(transaction.date).toLocaleDateString("ja-JP", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		}),
		categoryName: category?.name || "不明なカテゴリ",
	};
}

/**
 * トランザクションの統計計算
 */
export function calculateTransactionStats(
	transactions: Transaction[],
	categories: Category[],
): TransactionStatistics {
	const total = transactions.reduce((sum, t) => sum + t.amount, 0);
	const count = transactions.length;
	const average = count > 0 ? Math.round(total / count) : 0;

	// カテゴリ別集計
	const categoryMap = new Map<string, { total: number; count: number }>();
	transactions.forEach((t) => {
		const current = categoryMap.get(t.categoryId) || { total: 0, count: 0 };
		categoryMap.set(t.categoryId, {
			total: current.total + t.amount,
			count: current.count + 1,
		});
	});

	const byCategory = Array.from(categoryMap.entries())
		.map(([categoryId, stats]) => {
			const category = categories.find((c) => c.id === categoryId);
			return {
				categoryId,
				categoryName: category?.name || "不明なカテゴリ",
				total: stats.total,
				count: stats.count,
				percentage: total > 0 ? Math.round((stats.total / total) * 100) : 0,
			};
		})
		.sort((a, b) => b.total - a.total);

	// 月別集計
	const monthMap = new Map<string, { total: number; count: number }>();
	transactions.forEach((t) => {
		const date = new Date(t.date);
		const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
		const current = monthMap.get(monthKey) || { total: 0, count: 0 };
		monthMap.set(monthKey, {
			total: current.total + t.amount,
			count: current.count + 1,
		});
	});

	const byMonth = Array.from(monthMap.entries())
		.map(([month, stats]) => ({
			month,
			total: stats.total,
			count: stats.count,
		}))
		.sort((a, b) => a.month.localeCompare(b.month));

	return {
		total,
		count,
		average,
		byCategory,
		byMonth,
	};
}

/**
 * 指定されたタイプのトランザクションのみをフィルタリング
 */
export function filterTransactionsByType(
	transactions: Transaction[],
	type: TransactionType,
): Transaction[] {
	return transactions.filter((t) => t.type === type);
}

/**
 * 日付範囲でフィルタリング
 */
export function filterTransactionsByDateRange(
	transactions: Transaction[],
	startDate: string,
	endDate: string,
): Transaction[] {
	const start = new Date(startDate);
	const end = new Date(endDate);
	end.setHours(23, 59, 59, 999);

	return transactions.filter((t) => {
		const date = new Date(t.date);
		return date >= start && date <= end;
	});
}

/**
 * カテゴリでフィルタリング
 */
export function filterTransactionsByCategory(
	transactions: Transaction[],
	categoryId: string,
): Transaction[] {
	return transactions.filter((t) => t.categoryId === categoryId);
}

/**
 * 複数条件でのフィルタリング
 */
export function filterTransactions(
	transactions: Transaction[],
	options: {
		type?: TransactionType;
		categoryId?: string;
		startDate?: string;
		endDate?: string;
	},
): Transaction[] {
	let filtered = [...transactions];

	if (options.type) {
		filtered = filterTransactionsByType(filtered, options.type);
	}

	if (options.categoryId) {
		filtered = filterTransactionsByCategory(filtered, options.categoryId);
	}

	if (options.startDate && options.endDate) {
		filtered = filterTransactionsByDateRange(
			filtered,
			options.startDate,
			options.endDate,
		);
	}

	return filtered;
}

/**
 * トランザクションを日付順（新しい順）でソート
 */
export function sortTransactionsByDate(
	transactions: Transaction[],
	ascending = false,
): Transaction[] {
	return [...transactions].sort((a, b) => {
		const dateA = new Date(a.date);
		const dateB = new Date(b.date);
		return ascending
			? dateA.getTime() - dateB.getTime()
			: dateB.getTime() - dateA.getTime();
	});
}

/**
 * トランザクションを金額順でソート
 */
export function sortTransactionsByAmount(
	transactions: Transaction[],
	ascending = false,
): Transaction[] {
	return [...transactions].sort((a, b) => {
		return ascending ? a.amount - b.amount : b.amount - a.amount;
	});
}

/**
 * デフォルトのフォームデータを生成
 */
export function createDefaultTransactionFormData(
	type: TransactionType,
): TransactionFormData {
	return {
		amount: 0,
		type,
		categoryId: "",
		date: new Date().toISOString().split("T")[0],
		description: "",
	};
}

/**
 * トランザクションデータをフォームデータに変換
 */
export function transactionToFormData(
	transaction: Transaction,
): TransactionFormData {
	return {
		amount: transaction.amount,
		type: transaction.type,
		categoryId: transaction.categoryId,
		date: transaction.date,
		description: transaction.description || "",
	};
}

/**
 * 後方互換性のためのクラス形式のエクスポート（非推奨）
 *
 * 設計意図: 既存コードの移行期間中のみ使用
 * 新しいコードでは個別の関数をインポートしてください
 *
 * @deprecated 個別の関数（validateTransaction, formatTransaction等）を使用してください
 */
export const TransactionService = {
	validate: validateTransaction,
	format: formatTransaction,
	calculateStats: calculateTransactionStats,
	filterByType: filterTransactionsByType,
	filterByDateRange: filterTransactionsByDateRange,
	filterByCategory: filterTransactionsByCategory,
	filter: filterTransactions,
	sortByDate: sortTransactionsByDate,
	sortByAmount: sortTransactionsByAmount,
	createDefaultFormData: createDefaultTransactionFormData,
	toFormData: transactionToFormData,
} as const;
