/**
 * ローディング状態を表示するコンポーネント
 */
export function LoadingState() {
	return (
		<div className="flex items-center justify-center min-h-screen">
			<p className="text-gray-500">読み込み中...</p>
		</div>
	);
}

type ErrorStateProps = {
	message?: string;
};

/**
 * エラー状態を表示するコンポーネント
 */
export function ErrorState({
	message = "エラーが発生しました",
}: ErrorStateProps) {
	return (
		<div className="flex items-center justify-center min-h-screen">
			<p className="text-red-500">{message}</p>
		</div>
	);
}
