// トランザクション（収入・支出）共通リストコンポーネント
// typeプロパティによって収入・支出を切り替え、共通のUIを提供

"use client";

import { TransactionService } from "@/services/TransactionService";
import type { TransactionListProps } from "@/types/transaction";
import { TRANSACTION_TYPE_CONFIG } from "@/types/transaction";

// アイコンコンポーネント（簡易版）
const PencilIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
	</svg>
);

const TrashIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<polyline points="3 6 5 6 21 6" />
		<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
	</svg>
);

export function TransactionList({
	transactions,
	categories,
	onEdit,
	onDelete,
	isLoading,
	type,
}: TransactionListProps) {
	const config = TRANSACTION_TYPE_CONFIG[type];

	// トランザクションをフォーマット
	const formattedTransactions = transactions.map((transaction) =>
		TransactionService.format(transaction, categories),
	);

	if (isLoading) {
		return (
			<div className="flex justify-center items-center p-8">
				<p className="text-gray-500">読み込み中...</p>
			</div>
		);
	}

	if (formattedTransactions.length === 0) {
		return (
			<div className="text-center p-8">
				<p className="text-gray-500">{config.label}のデータがありません</p>
			</div>
		);
	}

	return (
		<div className="overflow-x-auto">
			<table className="w-full border-collapse">
				<thead>
					<tr className="border-b border-gray-200">
						<th className="text-left p-3 font-medium text-gray-700">日付</th>
						<th className="text-left p-3 font-medium text-gray-700">
							カテゴリ
						</th>
						<th className="text-right p-3 font-medium text-gray-700">金額</th>
						<th className="text-left p-3 font-medium text-gray-700">説明</th>
						<th className="text-center p-3 font-medium text-gray-700">操作</th>
					</tr>
				</thead>
				<tbody>
					{formattedTransactions.map((transaction) => (
						<tr
							key={transaction.id}
							className={`border-b border-gray-100 ${config.hoverColor} transition-colors`}
						>
							<td className="p-3 font-medium">{transaction.formattedDate}</td>
							<td className="p-3">
								<span
									className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color} ${config.borderColor} border`}
								>
									{transaction.categoryName}
								</span>
							</td>
							<td className={`p-3 text-right font-semibold ${config.color}`}>
								{transaction.formattedAmount}
							</td>
							<td className="p-3 max-w-xs truncate">
								{transaction.description || "-"}
							</td>
							<td className="p-3">
								<div className="flex justify-center gap-1">
									<button
										type="button"
										onClick={() => onEdit(transaction)}
										className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
										title={`${config.label}を編集`}
									>
										<PencilIcon />
									</button>
									<button
										type="button"
										onClick={() => onDelete(transaction.id)}
										className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
										title={`${config.label}を削除`}
									>
										<TrashIcon />
									</button>
								</div>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
