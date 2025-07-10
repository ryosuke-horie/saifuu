/**
 * 支出・収入一覧コンポーネント
 *
 * 取引データをテーブル形式で表示する
 * レスポンシブデザインに対応し、モバイルでは適切なレイアウトに切り替わる
 *
 * 設計方針:
 * - 収入/支出を明確に区別した表示（正負の金額表示）
 * - 日付降順（新しい順）でのソート
 * - 編集・削除機能の提供
 * - ローディング・エラー・空状態の適切な表示
 * - アクセシビリティを考慮したセマンティックHTML
 * - SubscriptionListコンポーネントのパターンを踏襲
 */

import type { FC } from "react";
import type { Transaction } from "../../lib/api/types";
import type { ExpenseListProps } from "../../types/expense";

/**
 * 単一の取引行コンポーネント
 */
const TransactionRow: FC<{ 
	transaction: Transaction; 
	onEdit?: (transaction: Transaction) => void;
	onDelete?: (transactionId: string) => void;
}> = ({ transaction, onEdit, onDelete }) => {
	// 金額を日本円形式でフォーマット（収入は正、支出は負で表示）
	const formatAmount = (amount: number, type: "income" | "expense"): string => {
		const sign = type === "income" ? "+" : "-";
		const formattedAmount = new Intl.NumberFormat("ja-JP", {
			style: "currency",
			currency: "JPY",
		}).format(amount);
		return `${sign}${formattedAmount}`;
	};

	// 日付をフォーマット（YYYY/MM/DD形式）
	const formatDate = (dateString: string): string => {
		const date = new Date(dateString);
		return date.toLocaleDateString("ja-JP", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		});
	};

	// カテゴリ名を取得
	const getCategoryName = (transaction: Transaction): string => {
		if (transaction.category && typeof transaction.category === "object") {
			return transaction.category.name;
		}
		return "未分類";
	};

	// 金額の色を取得（収入は緑、支出は赤）
	const getAmountColor = (type: "income" | "expense"): string => {
		return type === "income" ? "text-green-600" : "text-red-600";
	};

	return (
		<tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
			<td className="px-4 py-3 text-sm text-gray-900">
				{formatDate(transaction.date)}
			</td>
			<td className={`px-4 py-3 text-sm font-medium ${getAmountColor(transaction.type)}`}>
				{formatAmount(transaction.amount, transaction.type)}
			</td>
			<td className="px-4 py-3 text-sm text-gray-700 hidden md:table-cell">
				{getCategoryName(transaction)}
			</td>
			<td className="px-4 py-3 text-sm text-gray-700 hidden sm:table-cell">
				{transaction.description || ""}
			</td>
			<td className="px-4 py-3 text-sm text-gray-700">
				<div className="flex space-x-2">
					{onEdit && (
						<button
							type="button"
							onClick={() => onEdit(transaction)}
							className="text-blue-600 hover:text-blue-800 transition-colors"
						>
							編集
						</button>
					)}
					{onDelete && (
						<button
							type="button"
							onClick={() => onDelete(transaction.id)}
							className="text-red-600 hover:text-red-800 transition-colors"
						>
							削除
						</button>
					)}
				</div>
			</td>
		</tr>
	);
};

/**
 * ローディング状態の表示コンポーネント
 */
const LoadingState: FC = () => (
	<tr>
		<td colSpan={5} className="px-4 py-8 text-center text-gray-500">
			<div className="flex items-center justify-center space-x-2">
				<div 
					className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" 
					data-testid="loading-spinner"
				/>
				<span>読み込み中...</span>
			</div>
		</td>
	</tr>
);

/**
 * エラー状態の表示コンポーネント
 */
const ErrorState: FC<{ message: string }> = ({ message }) => (
	<tr>
		<td colSpan={5} className="px-4 py-8 text-center text-red-600">
			<div className="flex items-center justify-center space-x-2">
				<span className="text-xl">⚠️</span>
				<span>エラー: {message}</span>
			</div>
		</td>
	</tr>
);

/**
 * 空状態の表示コンポーネント
 */
const EmptyState: FC = () => (
	<tr>
		<td colSpan={5} className="px-4 py-8 text-center text-gray-500">
			<div className="flex flex-col items-center space-y-2">
				<span className="text-3xl">💰</span>
				<span>登録されている取引がありません</span>
				<span className="text-sm text-gray-400">
					新規登録ボタンから追加してください
				</span>
			</div>
		</td>
	</tr>
);

/**
 * 支出・収入一覧コンポーネント
 */
export const ExpenseList: FC<ExpenseListProps> = ({
	transactions,
	isLoading = false,
	error = null,
	onRefresh,
	onEdit,
	onDelete,
	className = "",
}) => {
	// 取引データを日付降順でソート
	const sortedTransactions = [...transactions].sort((a, b) => {
		return new Date(b.date).getTime() - new Date(a.date).getTime();
	});

	return (
		<div className={`bg-white rounded-lg shadow ${className}`}>
			{/* テーブルヘッダー */}
			<div className="px-4 py-4 border-b border-gray-200">
				<div className="flex items-center justify-between">
					<div>
						<h2 className="text-lg font-semibold text-gray-900">
							取引一覧
						</h2>
						<p className="text-sm text-gray-600 mt-1">
							支出・収入の履歴
						</p>
					</div>
					{onRefresh && (
						<button
							type="button"
							onClick={onRefresh}
							disabled={isLoading}
							className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isLoading ? (
								<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2" />
							) : (
								<span className="mr-2">🔄</span>
							)}
							更新
						</button>
					)}
				</div>
			</div>

			{/* テーブル本体 */}
			<div className="overflow-x-auto">
				<table className="min-w-full divide-y divide-gray-200" role="table">
					<thead className="bg-gray-50">
						<tr>
							<th
								scope="col"
								className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
							>
								日付
							</th>
							<th
								scope="col"
								className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
							>
								金額
							</th>
							<th
								scope="col"
								className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell"
							>
								カテゴリ
							</th>
							<th
								scope="col"
								className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell"
							>
								説明
							</th>
							<th
								scope="col"
								className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
							>
								操作
							</th>
						</tr>
					</thead>
					<tbody className="bg-white divide-y divide-gray-200">
						{isLoading && <LoadingState />}
						{error && <ErrorState message={error} />}
						{!isLoading && !error && sortedTransactions.length === 0 && (
							<EmptyState />
						)}
						{!isLoading &&
							!error &&
							sortedTransactions.map((transaction) => (
								<TransactionRow
									key={transaction.id}
									transaction={transaction}
									onEdit={onEdit}
									onDelete={onDelete}
								/>
							))}
					</tbody>
				</table>
			</div>
		</div>
	);
};