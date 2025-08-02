/**
 * トレンドインジケーターコンポーネント
 * 前月比の増減を視覚的に表示
 */

import React from "react";
import { useTrend } from "./hooks/useTrend";

/**
 * トレンドインジケーターのプロパティ型
 */
interface TrendIndicatorProps {
	readonly percentage: number;
}

/**
 * トレンドインジケーターコンポーネント
 * 前月比を矢印アイコンと色で表現
 */
export const TrendIndicator = React.memo<TrendIndicatorProps>(
	({ percentage }) => {
		const trend = useTrend(percentage);

		return (
			<div
				data-testid="trend-indicator"
				className={`flex items-center gap-2 ${trend.className}`}
			>
				<span className="text-2xl">{trend.icon}</span>
				<span className="text-2xl font-bold">{trend.text}</span>
			</div>
		);
	},
);

// デバッグ用の表示名を設定
TrendIndicator.displayName = "TrendIndicator";
