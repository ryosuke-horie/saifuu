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

// TODO: dynamic importは仮想スクロール無効化により一時的に不要
// import dynamic from "next/dynamic";
import type { FC } from "react";
import { memo, useEffect, useMemo, useState } from "react";
import type { ExpenseListProps } from "../../types/expense";
import { EmptyState, ErrorState } from "../common/table";
import { TransactionRow } from "../transactions";
import { LoadingState } from "../ui";

// 定数定義
// TODO: 仮想スクロール機能無効化により一時的に未使用
// const VIRTUAL_SCROLL_THRESHOLD = 100; // 仮想スクロールを有効にする閾値

// TODO: 仮想スクロール機能は現在無効化（@tanstack/react-virtual依存関係不足のため）
// 後で必要に応じて@tanstack/react-virtualをインストールして有効化
// const VirtualizedExpenseList = dynamic(
// 	() =>
// 		import("./VirtualizedExpenseList").then(
// 			(mod) => mod.VirtualizedExpenseList,
// 		),
// 	{
// 		ssr: false,
// 		loading: () => (
// 			<div className="text-center py-8">
// 				<p className="text-gray-500">読み込み中...</p>
// 			</div>
// 		),
// 	},
// );

// テーブルヘッダーの列定義
const TABLE_COLUMNS = [
	{ key: "date", label: "日付" },
	{ key: "amount", label: "金額" },
	{
		key: "category",
		label: (
			<>
				<span className="sm:hidden">カテ</span>
				<span className="hidden sm:inline">カテゴリ</span>
			</>
		),
	},
	{ key: "description", label: "説明" },
	{ key: "actions", label: "操作" },
] as const;

// 共通のヘッダーセルスタイル
const HEADER_CELL_CLASS =
	"px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-tighter sm:tracking-wider" as const;

/**
 * テーブルヘッダーコンポーネント
 * 仮想スクロール版と通常版で共通化
 */
const TableHeader = memo(() => (
	<thead className="bg-gray-50">
		<tr>
			{TABLE_COLUMNS.map((column) => (
				<th key={column.key} scope="col" className={HEADER_CELL_CLASS}>
					{column.label}
				</th>
			))}
		</tr>
	</thead>
));

TableHeader.displayName = "TableHeader";

/**
 * 支出一覧コンポーネント
 *
 * React.memoでパフォーマンス最適化
 * useMemoでソート処理の最適化
 * @tanstack/react-virtualで仮想スクロール実装（大量データ時のみ）
 */
export const ExpenseList: FC<ExpenseListProps> = memo(
	({
		transactions,
		isLoading = false,
		error = null,
		onEdit,
		onDelete,
		className = "",
	}) => {
		// 取引データを日付降順でソート
		// 新しい取引が上に来るようにソート（実装の詳細: Date.getTime()で数値比較）
		const sortedTransactions = useMemo(() => {
			return [...transactions].sort((a, b) => {
				const dateA = new Date(a.date).getTime();
				const dateB = new Date(b.date).getTime();
				return dateB - dateA;
			});
		}, [transactions]);

		// SSR時は仮想スクロールを無効化し、クライアントサイドでのみ有効化
		const [_isClient, setIsClient] = useState(false);

		// クライアントサイドでのみtrueになる
		useEffect(() => {
			setIsClient(true);
		}, []);

		// 仮想スクロールを使用するかの判定
		// 大量データのパフォーマンス向上のため、閾値を超えたら有効化
		// ただし、SSR時は必ず無効化する
		// TODO: 現在は@tanstack/react-virtual依存関係不足のため無効化
		const useVirtualScroll = false; // isClient && sortedTransactions.length >= VIRTUAL_SCROLL_THRESHOLD;

		// ローディング状態の表示
		if (isLoading) {
			return (
				<div className={`bg-white rounded-lg shadow ${className}`}>
					<div className="px-4 py-4 border-b border-gray-200">
						<div>
							<h2 className="text-lg font-semibold text-gray-900">支出一覧</h2>
							<p className="text-sm text-gray-600 mt-1">支出の履歴</p>
						</div>
					</div>
					<div className="px-4 py-8">
						<LoadingState />
					</div>
				</div>
			);
		}

		// エラー状態の表示
		if (error) {
			return (
				<div className={`bg-white rounded-lg shadow ${className}`}>
					<div className="px-4 py-4 border-b border-gray-200">
						<div>
							<h2 className="text-lg font-semibold text-gray-900">支出一覧</h2>
							<p className="text-sm text-gray-600 mt-1">支出の履歴</p>
						</div>
					</div>
					<div className="px-4 py-8">
						<ErrorState message={error} />
					</div>
				</div>
			);
		}

		// 空状態の表示
		if (sortedTransactions.length === 0) {
			return (
				<div className={`bg-white rounded-lg shadow ${className}`}>
					<div className="px-4 py-4 border-b border-gray-200">
						<div>
							<h2 className="text-lg font-semibold text-gray-900">支出一覧</h2>
							<p className="text-sm text-gray-600 mt-1">支出の履歴</p>
						</div>
					</div>
					<div className="px-4 py-8">
						<EmptyState
							message="登録されている取引がありません"
							subMessage="新規登録ボタンから追加してください"
							icon="💰"
						/>
					</div>
				</div>
			);
		}

		return (
			<div className={`bg-white rounded-lg shadow ${className}`}>
				{/* コンポーネントヘッダー */}
				<div className="px-4 py-4 border-b border-gray-200">
					<div>
						<h2 className="text-lg font-semibold text-gray-900">支出一覧</h2>
						<p className="text-sm text-gray-600 mt-1">支出の履歴</p>
					</div>
				</div>

				{/* テーブル本体 */}
				<div className="overflow-x-auto">
					{useVirtualScroll ? (
						// TODO: 仮想スクロール版（大量データ対応）- 現在無効化
						<div className="text-center py-8">
							<p className="text-gray-500">仮想スクロール機能は準備中です</p>
						</div>
					) : (
						// 通常版（少量データ対応）
						<table className="min-w-full divide-y divide-gray-200">
							<TableHeader />
							<tbody className="bg-white divide-y divide-gray-200">
								{sortedTransactions.map((transaction) => (
									<TransactionRow
										key={transaction.id}
										transaction={transaction}
										onEdit={onEdit}
										onDelete={onDelete}
										showSign={true}
									/>
								))}
							</tbody>
						</table>
					)}
				</div>
			</div>
		);
	},
);

ExpenseList.displayName = "ExpenseList";
