interface PageLoaderProps {
	/** ローディング時に表示するメッセージ（デフォルト: "読み込み中..."） */
	message?: string;
}

/**
 * ページローディング時に表示するコンポーネント
 *
 * - 中央配置されたスピナーとメッセージを表示
 * - アクセシビリティを考慮したrole属性とaria-live属性を設定
 * - Tailwind CSS v4のクラスを使用してスタイリング
 * - 最小高さ200pxで十分な視覚的スペースを確保
 *
 * @param message - 表示するローディングメッセージ
 */
export function PageLoader({ message = "読み込み中..." }: PageLoaderProps) {
	return (
		<div
			className="flex items-center justify-center min-h-[200px]"
			data-testid="page-loader-container"
			role="status"
			aria-live="polite"
		>
			<div className="flex flex-col items-center gap-3">
				{/* スピナーアニメーション */}
				<div
					className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"
					data-testid="page-loader-spinner"
					aria-hidden="true"
				/>
				{/* ローディングメッセージ */}
				<span className="text-gray-600 text-sm font-medium">{message}</span>
			</div>
		</div>
	);
}
