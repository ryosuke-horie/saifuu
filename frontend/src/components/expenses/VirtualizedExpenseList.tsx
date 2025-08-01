/**
 * 仮想スクロール用の支出一覧コンポーネント
 *
 * 大量データ表示時のパフォーマンス最適化のための専用コンポーネント
 * ExpenseListコンポーネントから動的にインポートされる
 *
 * 設計方針:
 * - @tanstack/react-virtualによる仮想スクロール実装（現在無効化）
 * - SSR環境では使用されない（動的インポートで回避）
 * - 100件以上のデータで自動的に有効化
 */

import type { FC } from "react";
import { memo } from "react";
import type { Transaction } from "../../lib/api/types";

// Propsの型定義
interface VirtualizedExpenseListProps {
	/** 表示する取引データ */
	transactions: Transaction[];
	/** 編集ボタンクリック時のハンドラー */
	onEdit: (transaction: Transaction) => void;
	/** 削除ボタンクリック時のハンドラー */
	onDelete: (transactionId: string) => void;
}

/**
 * 仮想スクロール対応の支出一覧コンポーネント
 *
 * TODO: @tanstack/react-virtual依存関係不足のため一時的に無効化
 * 現在はフォールバック表示のみ提供
 */
export const VirtualizedExpenseList: FC<VirtualizedExpenseListProps> = memo(
	({ transactions }) => {
		return (
			<div className="text-center py-12">
				<div className="text-4xl mb-4">🚧</div>
				<h3 className="text-lg font-medium text-gray-900 mb-2">
					仮想スクロール機能は準備中です
				</h3>
				<p className="text-gray-600 mb-4">
					大量データ表示の最適化機能を開発中です。
					<br />
					現在は{transactions.length}件のデータが表示可能です。
				</p>
				<div className="text-sm text-gray-500">
					@tanstack/react-virtual パッケージのインストール後に有効化されます
				</div>
			</div>
		);
	},
);

VirtualizedExpenseList.displayName = "VirtualizedExpenseList";
