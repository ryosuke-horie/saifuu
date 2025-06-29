"use client";

/**
 * グローバルエラーハンドラ
 *
 * Next.js App Routerで全体的なエラーハンドリングを行うコンポーネント
 * 予期しないエラーが発生した際に表示される
 *
 * 注意:
 * global-error.jsは独自の<html>と<body>タグを定義する必要がある
 * App Routerでの要件に従い、ここで必要なHTML構造を定義
 */

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<html lang="ja">
			<body>
				<div className="min-h-screen flex items-center justify-center bg-gray-50">
					<div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
						<div className="mb-6">
							<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
								<span className="text-2xl text-red-600">⚠</span>
							</div>
							<h1 className="text-2xl font-bold text-gray-900 mb-2">
								エラーが発生しました
							</h1>
							<p className="text-gray-600 mb-6">
								予期しないエラーが発生しました。しばらく待ってから再度お試しください。
							</p>
						</div>

						<div className="space-y-4">
							<button
								type="button"
								onClick={reset}
								className="inline-block w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
							>
								再試行
							</button>

							<a
								href="/"
								className="inline-block w-full px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 transition-colors"
							>
								ホームに戻る
							</a>
						</div>

						{process.env.NODE_ENV === "development" && error.message && (
							<div className="mt-6 p-4 bg-red-50 rounded-md text-left">
								<p className="text-sm text-red-700 font-mono">
									{error.message}
								</p>
								{error.digest && (
									<p className="text-xs text-red-600 mt-2">
										Error ID: {error.digest}
									</p>
								)}
							</div>
						)}
					</div>
				</div>
			</body>
		</html>
	);
}
