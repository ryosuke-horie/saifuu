/**
 * 収入一覧コンポーネント
 *
 * 収入データをテーブル形式で表示する
 * レスポンシブデザインに対応し、モバイルでは適切なレイアウトに切り替わる
 *
 * 設計方針:
 * - 収入を明確に表示（緑色で金額表示）
 * - 日付降順（新しい順）でのソート
 * - 編集・削除機能の提供
 * - ローディング・エラー・空状態の適切な表示
 * - アクセシビリティを考慮したセマンティックHTML
 * - ExpenseListコンポーネントのパターンを踏襲
 */

import type { FC } from "react";
import { memo, useMemo } from "react";
import type { IncomeListProps } from "../../types/income";
import { EmptyState, ErrorState } from "../common/table";
import { TransactionRow } from "../transactions";
import { LoadingState } from "../ui";

/**
 * 収入一覧コンポーネント
 *
 * React.memoでパフォーマンス最適化
 * useMemoでソート処理の最適化
 */
export const IncomeList: FC<IncomeListProps> = memo(
	({
		transactions,
		isLoading = false,
		error = null,
		onEdit,
		onDelete,
		className = "",
	}) => {
		// 収入データを日付降順でソート（useMemoで最適化）
		const sortedTransactions = useMemo(() => {
			return [...transactions].sort((a, b) => {
				return new Date(b.date).getTime() - new Date(a.date).getTime();
			});
		}, [transactions]);

		return (
			<div className={`bg-white rounded-lg shadow ${className}`}>
				{/* テーブルヘッダー */}
				<div className="px-4 py-4 border-b border-gray-200">
					<div>
						<h2 className="text-lg font-semibold text-gray-900">収入一覧</h2>
						<p className="text-sm text-gray-600 mt-1">収入の履歴</p>
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
							{isLoading && (
								<tr>
									<td colSpan={5} className="px-4 py-8">
										<LoadingState />
									</td>
								</tr>
							)}
							{error && <ErrorState message={error} />}
							{!isLoading && !error && sortedTransactions.length === 0 && (
								<EmptyState
									message="登録されている収入がありません"
									subMessage="新規登録ボタンから追加してください"
									icon="💵"
								/>
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
	},
);

IncomeList.displayName = "IncomeList";
