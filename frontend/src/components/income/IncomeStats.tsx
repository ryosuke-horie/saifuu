/**
 * 収入統計カードコンポーネント
 * 今月・先月・今年の収入と前月比を表示
 *
 * リファクタリング内容:
 * - 定数の外部化による保守性向上
 * - コンポーネント分割による責務の明確化
 * - React.memoによるパフォーマンス最適化
 * - カスタムフックによるロジックの分離
 * - Matt Pocock氏の型定義方針に準拠
 */
import React from "react";
import type { IncomeStatsProps } from "@/types/income";
import { AmountDisplay } from "./AmountDisplay";
import { CategoryBreakdownSection } from "./CategoryBreakdownSection";
import { STAT_LABELS, STYLES } from "./constants";
import { ErrorState } from "./ErrorState";
import { LoadingState } from "./LoadingState";
import { StatCard } from "./StatCard";
import { TrendIndicator } from "./TrendIndicator";

/**
 * 収入統計コンポーネント
 * React.memoで最適化し、プロパティが変更されない限り再レンダリングを防ぐ
 */
export const IncomeStats = React.memo<IncomeStatsProps>(
	({ stats, isLoading = false, error = null }) => {
		// エラー状態の処理
		// エラーが存在する場合は早期リターン
		if (error) {
			return <ErrorState error={error} />;
		}

		// ローディング状態の処理
		// データ取得中はスケルトンを表示
		if (isLoading) {
			return <LoadingState />;
		}

		// 統計データの構造化
		// satisfiesを使用して型推論を活用しつつ型安全性を確保
		const statsData = [
			{
				title: STAT_LABELS.CURRENT_MONTH,
				value: stats.currentMonth,
			},
			{
				title: STAT_LABELS.LAST_MONTH,
				value: stats.lastMonth,
			},
			{
				title: STAT_LABELS.CURRENT_YEAR,
				value: stats.currentYear,
			},
		] as const satisfies readonly { title: string; value: number }[];

		return (
			<div>
				{/* 統計カードグリッド */}
				<div className={STYLES.GRID_RESPONSIVE}>
					{/* 数値統計カード */}
					{statsData.map(({ title, value }) => (
						<StatCard key={title} title={title}>
							<AmountDisplay amount={value} />
						</StatCard>
					))}

					{/* 前月比カード */}
					<StatCard title={STAT_LABELS.MONTH_OVER_MONTH}>
						<TrendIndicator percentage={stats.monthOverMonth} />
					</StatCard>
				</div>

				{/* カテゴリ別内訳セクション */}
				<CategoryBreakdownSection categoryBreakdown={stats.categoryBreakdown} />
			</div>
		);
	},
);

// デバッグ用の表示名を設定
// React DevToolsで識別しやすくなる
IncomeStats.displayName = "IncomeStats";
