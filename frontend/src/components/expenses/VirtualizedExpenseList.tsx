/**
 * 仮想スクロール用の支出一覧コンポーネント
 *
 * 大量データ表示時のパフォーマンス最適化のための専用コンポーネント
 * ExpenseListコンポーネントから動的にインポートされる
 *
 * 設計方針:
 * - @tanstack/react-virtualによる仮想スクロール実装
 * - SSR環境では使用されない（動的インポートで回避）
 * - 100件以上のデータで自動的に有効化
 */

import { useVirtualizer } from "@tanstack/react-virtual";
import type { FC } from "react";
import { memo, useCallback, useEffect, useRef } from "react";
import type { Transaction } from "../../lib/api/types";
import { TransactionRow } from "../transactions";

// 定数定義
const VIRTUAL_ROW_HEIGHT = 60; // 各行の推定高さ（px）
const VIRTUAL_OVERSCAN = 5; // 表示範囲外にレンダリングする追加アイテム数
const VIRTUAL_CONTAINER_HEIGHT = 400; // 仮想スクロールコンテナの高さ（px）
const INITIAL_DISPLAY_COUNT = 10; // 初期表示アイテム数

interface VirtualizedExpenseListProps {
	transactions: Transaction[];
	onEdit?: (transaction: Transaction) => void;
	onDelete?: (transactionId: string) => void;
}

/**
 * 仮想スクロール対応の支出一覧コンポーネント
 *
 * 大量データ（100件以上）の高速レンダリングを実現
 * クライアントサイドでのみ動作
 */
export const VirtualizedExpenseList: FC<VirtualizedExpenseListProps> = memo(
	({ transactions, onEdit, onDelete }) => {
		// 仮想スクロール用のコンテナref
		const scrollContainerRef = useRef<HTMLDivElement>(null);

		// 仮想スクロールの設定
		const virtualizer = useVirtualizer({
			count: transactions.length,
			getScrollElement: () => scrollContainerRef.current,
			estimateSize: () => VIRTUAL_ROW_HEIGHT,
			overscan: VIRTUAL_OVERSCAN,
		});

		// measureElementのコールバックref
		const measureElement = useCallback(
			(element: HTMLDivElement | null) => {
				if (element) {
					virtualizer.measureElement(element);
				}
			},
			[virtualizer],
		);

		// 仮想化されたアイテムのレンダリング
		const virtualItems = virtualizer.getVirtualItems();

		// 仮想スクロールの初期化とリセット
		useEffect(() => {
			if (scrollContainerRef.current) {
				// スクロール位置をリセット
				scrollContainerRef.current.scrollTop = 0;
				// 仮想スクロールの再計算をトリガー
				virtualizer.measure();
			}
		}, [virtualizer]);

		// 仮想スクロール用のテーブル行レンダリング
		const renderVirtualRows = () => {
			const itemsToRender =
				virtualItems.length > 0
					? virtualItems
					: transactions.slice(0, INITIAL_DISPLAY_COUNT).map((_, index) => ({
							index,
							start: index * VIRTUAL_ROW_HEIGHT,
							key: `initial-${index}`,
							size: VIRTUAL_ROW_HEIGHT,
							lane: 0,
						}));

			return itemsToRender.map((virtualItem) => {
				const transaction = transactions[virtualItem.index];
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
		);
	},
);

VirtualizedExpenseList.displayName = "VirtualizedExpenseList";
