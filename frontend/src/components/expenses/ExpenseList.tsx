/**
 * 支出一覧コンポーネント
 *
 * 支出データをテーブル形式で表示する
 * レスポンシブデザインに対応し、モバイルでは適切なレイアウトに切り替わる
 *
 * 設計方針:
 * - 支出を明確に表示（負の金額表示）
 * - 日付降順（新しい順）でのソート
 * - 編集・削除機能の提供
 * - ローディング・エラー・空状態の適切な表示
 * - アクセシビリティを考慮したセマンティックHTML
 * - SubscriptionListコンポーネントのパターンを踏襲
 */

import type { FC } from "react";
import type { Transaction } from "../../lib/api/types";
import type { ExpenseListProps } from "../../types/expense";
import {
	formatCategoryName,
	formatCurrency,
	formatDate,
} from "../../utils/format";

/**
 * 単一の取引行コンポーネント
 */
const TransactionRow: FC<{
	transaction: Transaction;
	onEdit?: (transaction: Transaction) => void;
	onDelete?: (transactionId: string) => void;
}> = ({ transaction, onEdit, onDelete }) => {
	// 金額の色を取得（支出は赤）
	const getAmountColor = (): string => {
		return "text-red-600";
	};

	return (
		<tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
			<td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-900">
				{formatDate(transaction.date)}
			</td>
			<td
				className={`px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium ${getAmountColor()}`}
			>
				{formatCurrency(transaction.amount, true)}
			</td>
			<td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-700 max-w-[80px] sm:max-w-none truncate">
				{formatCategoryName(transaction.category)}
			</td>
			<td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-700 max-w-[120px] sm:max-w-none truncate">
				{transaction.description || ""}
			</td>
			<td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-700">
				<div className="flex flex-col gap-1">
					{onEdit && (
						<button
							type="button"
							onClick={() => onEdit(transaction)}
							className="text-blue-600 hover:text-blue-800 transition-colors text-xs sm:text-sm whitespace-nowrap"
						>
							編集
						</button>
					)}
					{onDelete && (
						<button
							type="button"
							onClick={() => onDelete(transaction.id)}
							className="text-red-600 hover:text-red-800 transition-colors text-xs sm:text-sm whitespace-nowrap"
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
 * 支出一覧コンポーネント
 */
export const ExpenseList: FC<ExpenseListProps> = ({
	transactions,
	isLoading = false,
	error = null,
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
				<div>
					<h2 className="text-lg font-semibold text-gray-900">取引一覧</h2>
					<p className="text-sm text-gray-600 mt-1">支出の履歴</p>
				</div>
			</div>

			{/* テーブル本体 */}
			<div className="overflow-x-auto">
				<table className="min-w-full divide-y divide-gray-200">
					<thead className="bg-gray-50">
						<tr>
							<th
								scope="col"
								className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-tighter sm:tracking-wider"
							>
								日付
							</th>
							<th
								scope="col"
								className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-tighter sm:tracking-wider"
							>
								金額
							</th>
							<th
								scope="col"
								className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-tighter sm:tracking-wider"
							>
								<span className="sm:hidden">カテ</span>
								<span className="hidden sm:inline">カテゴリ</span>
							</th>
							<th
								scope="col"
								className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-tighter sm:tracking-wider"
							>
								説明
							</th>
							<th
								scope="col"
								className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-tighter sm:tracking-wider"
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
