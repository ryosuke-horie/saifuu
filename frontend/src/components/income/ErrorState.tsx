/**
 * エラー状態コンポーネント
 * エラーメッセージを表示
 */

import React from "react";
import { ERROR_MESSAGES, STYLES } from "./constants";

/**
 * エラー状態のプロパティ型
 */
interface ErrorStateProps {
	readonly error: Error;
}

/**
 * エラー状態コンポーネント
 * エラー情報を赤色のカードで表示
 */
export const ErrorState = React.memo<ErrorStateProps>(({ error }) => {
	return (
		<div className={STYLES.ERROR_CONTAINER}>
			<h3 className={STYLES.ERROR_TITLE}>{ERROR_MESSAGES.TITLE}</h3>
			<p className={STYLES.ERROR_MESSAGE}>{error.message}</p>
		</div>
	);
});

// デバッグ用の表示名を設定
ErrorState.displayName = "ErrorState";
