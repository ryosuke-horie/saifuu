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

import { useVirtualizer } from "@tanstack/react-virtual";
import type { FC } from "react";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import type { ExpenseListProps } from "../../types/expense";
import { EmptyState, ErrorState } from "../common/table";
import { TransactionRow } from "../transactions";
import { LoadingState } from "../ui";

// 定数定義
const VIRTUAL_SCROLL_THRESHOLD = 100; // 仮想スクロールを有効にする閾値
const VIRTUAL_ROW_HEIGHT = 60; // 各行の推定高さ（px）
const VIRTUAL_OVERSCAN = 5; // 表示範囲外にレンダリングする追加アイテム数
const VIRTUAL_CONTAINER_HEIGHT = 400; // 仮想スクロールコンテナの高さ（px）
const INITIAL_DISPLAY_COUNT = 10; // 初期表示アイテム数

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

		// 仮想スクロール用のコンテナref
		const scrollContainerRef = useRef<HTMLDivElement>(null);

		// 仮想スクロールを使用するかの判定
		// 大量データのパフォーマンス向上のため、閾値を超えたら有効化
		const useVirtualScroll =
			sortedTransactions.length >= VIRTUAL_SCROLL_THRESHOLD;

		// 仮想スクロールの設定
		// 大量データでも高速レンダリングを実現するための最適化設定
		const virtualizer = useVirtualizer({
			count: sortedTransactions.length,
			getScrollElement: () => scrollContainerRef.current,
			estimateSize: () => VIRTUAL_ROW_HEIGHT,
			overscan: VIRTUAL_OVERSCAN,
			enabled: useVirtualScroll,
		});

		// measureElementのコールバックref
		const measureElement = useCallback(
			(element: HTMLDivElement | null) => {
				if (element && useVirtualScroll) {
					virtualizer.measureElement(element);
				}
			},
			[virtualizer, useVirtualScroll],
		);

		// 仮想化されたアイテムのレンダリング
		const virtualItems = virtualizer.getVirtualItems();

		// 仮想スクロールの初期化とリセット
		useEffect(() => {
			if (useVirtualScroll && scrollContainerRef.current) {
				// スクロール位置をリセット
				scrollContainerRef.current.scrollTop = 0;
				// 仮想スクロールの再計算をトリガー
				virtualizer.measure();
			}
		}, [useVirtualScroll, virtualizer]);

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

		// 仮想スクロール用のテーブル行レンダリング
		const renderVirtualRows = () => {
			const itemsToRender =
				virtualItems.length > 0
					? virtualItems
					: sortedTransactions
							.slice(0, INITIAL_DISPLAY_COUNT)
							.map((_, index) => ({
								index,
								start: index * VIRTUAL_ROW_HEIGHT,
								key: `initial-${index}`,
								size: VIRTUAL_ROW_HEIGHT,
								lane: 0,
							}));

			return itemsToRender.map((virtualItem) => {
				const transaction = sortedTransactions[virtualItem.index];
				return (
					<div
						key={transaction.id}
						data-index={virtualItem.index}
						ref={(el) => measureElement(el)}
						style={{
							position: "absolute",
							top: 0,
							left: 0,
							width: "100%",
							transform: `translateY(${virtualItem.start}px)`,
						}}
					>
						<table className="min-w-full">
							<tbody className="bg-white divide-y divide-gray-200">
								<TransactionRow
									transaction={transaction}
									onEdit={onEdit}
									onDelete={onDelete}
									showSign={true}
								/>
							</tbody>
						</table>
					</div>
				);
			});
		};

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
						// 仮想スクロール版（大量データ対応）
						<>
							<table className="min-w-full divide-y divide-gray-200">
								<TableHeader />
							</table>
							{/* 仮想スクロールコンテナ */}
							<div
								ref={scrollContainerRef}
								className="virtual-scroll-container overflow-y-auto"
								style={{ height: `${VIRTUAL_CONTAINER_HEIGHT}px` }}
							>
								<div
									style={{
										height: `${virtualizer.getTotalSize()}px`,
										width: "100%",
										position: "relative",
									}}
								>
									{renderVirtualRows()}
								</div>
							</div>
						</>
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
