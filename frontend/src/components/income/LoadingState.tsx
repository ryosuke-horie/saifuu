/**
 * ローディング状態コンポーネント
 * スケルトンカードを表示
 */

import React from "react";
import { SKELETON_CARD_COUNT, STYLES } from "./constants";

/**
 * スケルトンカードコンポーネント
 * ローディング中のプレースホルダー
 */
const SkeletonCard = React.memo(() => {
	return <div data-testid="skeleton-card" className={STYLES.SKELETON} />;
});

SkeletonCard.displayName = "SkeletonCard";

/**
 * ローディング状態コンポーネント
 * 複数のスケルトンカードをグリッド表示
 */
export const LoadingState = React.memo(() => {
	// 配列を作成してmap処理
	const skeletonCards = Array.from(
		{ length: SKELETON_CARD_COUNT },
		(_, index) => index,
	);

	return (
		<div className={STYLES.GRID_RESPONSIVE}>
			{skeletonCards.map((index) => (
				<SkeletonCard key={index} />
			))}
		</div>
	);
});

// デバッグ用の表示名を設定
LoadingState.displayName = "LoadingState";
