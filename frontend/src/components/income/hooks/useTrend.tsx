/**
 * トレンド表示のカスタムフック
 * 前月比の増減を判定し、適切なアイコンとスタイルを返す
 */

import type { ReactElement } from "react";
import { TREND_CONFIG } from "../constants";

/**
 * トレンド情報の型定義
 * satisfiesを使用して型推論を活用しつつ型安全性を確保
 */
type TrendInfo = {
	readonly icon: ReactElement;
	readonly className: string;
	readonly text: string;
};

/**
 * 前月比の変化を示すアイコンとスタイルを取得
 * @param percentage - 前月比のパーセンテージ
 * @returns トレンド情報（アイコン、スタイル、テキスト）
 */
export const useTrend = (percentage: number): TrendInfo => {
	// 増加傾向の場合
	if (percentage > 0) {
		return {
			icon: (
				<span data-testid={TREND_CONFIG.UP.testId}>{TREND_CONFIG.UP.icon}</span>
			),
			className: TREND_CONFIG.UP.className,
			text: `+${percentage}%`,
		} satisfies TrendInfo;
	}

	// 減少傾向の場合
	if (percentage < 0) {
		return {
			icon: (
				<span data-testid={TREND_CONFIG.DOWN.testId}>
					{TREND_CONFIG.DOWN.icon}
				</span>
			),
			className: TREND_CONFIG.DOWN.className,
			text: `${percentage}%`,
		} satisfies TrendInfo;
	}

	// 変化なしの場合
	return {
		icon: (
			<span data-testid={TREND_CONFIG.FLAT.testId}>
				{TREND_CONFIG.FLAT.icon}
			</span>
		),
		className: TREND_CONFIG.FLAT.className,
		text: "0%",
	} satisfies TrendInfo;
};
