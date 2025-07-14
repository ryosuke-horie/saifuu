/**
 * エラー表示コンポーネント
 *
 * アプリケーション全体で一貫したエラー表示を提供
 * 再試行機能、カスタマイズ可能なアイコンとメッセージに対応
 */

import type { FC } from "react";

export interface ErrorAlertProps {
	/**
	 * エラーのタイトル
	 */
	title?: string;

	/**
	 * エラーメッセージ
	 */
	message: string;

	/**
	 * 再試行ボタンのクリックハンドラー
	 */
	onRetry?: () => void;

	/**
	 * エラーアイコン（絵文字）
	 */
	icon?: string;

	/**
	 * 再試行ボタンのテキスト
	 */
	retryButtonText?: string;

	/**
	 * 追加のCSSクラス名
	 */
	className?: string;
}

/**
 * エラー表示コンポーネント
 * 一貫したエラーUIを提供し、オプションで再試行機能を含む
 */
export const ErrorAlert: FC<ErrorAlertProps> = ({
	title = "エラーが発生しました",
	message,
	onRetry,
	icon = "⚠️",
	retryButtonText = "再読み込み",
	className = "",
}) => {
	return (
		<div
			className={`bg-red-50 border border-red-200 rounded-md p-4 ${className}`}
		>
			<div className="flex">
				<div className="flex-shrink-0">
					<span className="text-red-400" role="img" aria-label="エラー">
						{icon}
					</span>
				</div>
				<div className="ml-3">
					<h3 className="text-sm font-medium text-red-800">{title}</h3>
					<div className="mt-2 text-sm text-red-700">
						<p>{message}</p>
					</div>
					{onRetry && (
						<div className="mt-4">
							<button
								type="button"
								onClick={onRetry}
								className="text-sm font-medium text-red-800 hover:text-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-lg px-2 py-1"
							>
								{retryButtonText}
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
