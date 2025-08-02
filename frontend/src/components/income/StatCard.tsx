/**
 * 統計カードコンポーネント
 * 個々の統計情報を表示するカード
 */

import React from "react";
import { STYLES } from "./constants";

/**
 * 統計カードのプロパティ型
 * satisfiesを使用して型推論を活用
 */
interface StatCardProps {
	readonly title: string;
	readonly children: React.ReactNode;
	readonly testId?: string;
}

/**
 * 統計カードコンポーネント
 * React.memoで最適化し、不要な再レンダリングを防ぐ
 */
export const StatCard = React.memo<StatCardProps>(
	({ title, children, testId = "stats-card" }) => {
		return (
			<div data-testid={testId} className={STYLES.CARD_BASE}>
				<h3 className={STYLES.CARD_TITLE}>{title}</h3>
				{children}
			</div>
		);
	},
);

// デバッグ用の表示名を設定
StatCard.displayName = "StatCard";
