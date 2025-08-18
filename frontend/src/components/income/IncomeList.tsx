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
import {
	DEFAULT_ITEMS_PER_PAGE,
	SORT_CONFIG,
} from "../../constants/pagination";
import { useIncomesWithPagination } from "../../hooks/useIncomesWithPagination";
import type { TransactionWithCategory } from "../../lib/api/types";
import { sortTransactions } from "../../utils/sorting";
import { EmptyState, ErrorState } from "../common/table";
import { TransactionRow } from "../transactions";
import { LoadingState, Pagination } from "../ui";

/**
 * IncomeListのプロパティ定義
 *
 * Matt Pocock氏の型定義方針に準拠:
 * - readonly修飾子で不変性を明示
 * - オプショナルプロパティを明確に定義
 * - 型エイリアスではなくインターフェースを使用
 */
export interface IncomeListProps {
	/** 取引データ（ページネーション無効時に使用） */
	readonly transactions?: readonly TransactionWithCategory[];
	/** ローディング状態（ページネーション無効時に使用） */
	readonly isLoading?: boolean;
	/** エラーメッセージ（ページネーション無効時に使用） */
	readonly error?: string | null;
	/** 編集ハンドラー */
	readonly onEdit?: (transaction: TransactionWithCategory) => void;
	/** 削除ハンドラー */
	readonly onDelete?: (id: string) => void;
	/** 追加のCSSクラス */
	readonly className?: string;
	/** ページネーション有効フラグ */
	readonly enablePagination?: boolean;
	/** 1ページあたりの表示件数 */
	readonly itemsPerPage?: number;
	/** URLとの同期を有効にするか */
	readonly syncWithUrl?: boolean;
	/** ソートフィールド */
	readonly sortBy?: "date" | "amount";
	/** ソート順序 */
	readonly sortOrder?: "asc" | "desc";
}

/**
 * 収入一覧コンポーネント
 *
 * React.memoでパフォーマンス最適化
 * useMemoでソート処理の最適化
 *
 * デフォルト値の設定:
 * - 定数から取得して一元管理
 * - as constで型推論を維持
 */
export const IncomeList: FC<IncomeListProps> = memo(
	({
		transactions: propTransactions = [],
		isLoading: propIsLoading = false,
		error: propError = null,
		onEdit,
		onDelete,
		className = "",
		enablePagination = false,
		itemsPerPage = DEFAULT_ITEMS_PER_PAGE,
		syncWithUrl = false,
		sortBy = SORT_CONFIG.DEFAULT.FIELD as "date",
		sortOrder = SORT_CONFIG.DEFAULT.ORDER as "desc",
	}) => {
		// ページネーション対応のフックを使用
		const paginationHook = useIncomesWithPagination({
			itemsPerPage,
			syncWithUrl,
			sortBy,
			sortOrder,
		});

		// ページネーションの有無によってデータソースを切り替え
		const transactions = enablePagination
			? paginationHook.incomes
			: propTransactions;
		const isLoading = enablePagination ? paginationHook.loading : propIsLoading;
		const error = enablePagination ? paginationHook.error : propError;

		// 収入データのソート処理（共通ユーティリティ関数を使用）
		// ページネーション有効時はAPIでソート済みなのでスキップ
		const sortedTransactions = useMemo(() => {
			if (enablePagination) {
				return transactions as TransactionWithCategory[]; // APIでソート済み
			}
			// ソート用ユーティリティ関数を使用して重複コードを削除
			return sortTransactions(transactions, sortBy, sortOrder);
		}, [transactions, enablePagination, sortBy, sortOrder]);

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
										<LoadingState testId="loading-spinner" />
									</td>
								</tr>
							)}
							{error && <ErrorState message={error} />}
							{!isLoading && !error && sortedTransactions.length === 0 && (
								<EmptyState
									message="登録されている収入がありません"
									subMessage="新規登録ボタンから追加してください"
									icon="💵"
									variant="table"
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

				{/* ページネーションコンポーネント */}
				{enablePagination && paginationHook.pagination && (
					<Pagination
						{...paginationHook.pagination}
						currentPage={paginationHook.currentPage}
						onPageChange={paginationHook.onPageChange}
						onItemsPerPageChange={paginationHook.onItemsPerPageChange}
					/>
				)}
			</div>
		);
	},
);

IncomeList.displayName = "IncomeList";
