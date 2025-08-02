/**
 * 金額表示コンポーネント
 * アニメーション付きで金額を表示
 */

import React from "react";
import { STYLES } from "./constants";
import { formatCurrency } from "./utils";

/**
 * 金額表示のプロパティ型
 */
interface AmountDisplayProps {
	readonly amount: number;
}

/**
 * 金額表示コンポーネント
 * React.memoで最適化
 */
export const AmountDisplay = React.memo<AmountDisplayProps>(({ amount }) => {
	return (
		<p data-testid="amount-display" className={STYLES.CARD_VALUE}>
			{formatCurrency(amount)}
		</p>
	);
});

// デバッグ用の表示名を設定
AmountDisplay.displayName = "AmountDisplay";
