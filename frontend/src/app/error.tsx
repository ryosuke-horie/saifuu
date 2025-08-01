"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import type { FallbackProps } from "@/components/common/ErrorBoundary";

/**
 * Next.js App Routerのページレベルエラーバウンダリ
 *
 * 設計意図:
 * - Next.js App Routerの特別なファイル（error.tsx）として機能
 * - 既存のErrorBoundaryコンポーネントのUIパターンを踏襲してエラーハンドリングを統一
 * - Server ComponentsではuseRouterが使用できないため、"use client"でクライアントコンポーネント化
 * - Next.jsのreset関数とErrorBoundaryのonRetryを統合
 */

interface ErrorPageProps {
	error: Error & { digest?: string };
	reset: () => void;
}

/**
 * カスタムフォールバックコンポーネント
 * ErrorBoundaryのUIパターンを踏襲してNext.js error.tsxに最適化
 */
function NextJsErrorFallback({ error, onRetry }: FallbackProps) {
	const router = useRouter();

	/**
	 * ホームページに戻る処理
	 */
	const handleGoHome = () => {
		router.push("/");
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-md w-full space-y-8" role="alert">
				<div className="text-center">
					{/* エラーアイコン */}
					<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
						<span className="text-2xl text-red-600">⚠</span>
					</div>

					{/* エラーメッセージ */}
					<h2 className="mt-6 text-3xl font-extrabold text-gray-900">
						エラーが発生しました
					</h2>
					<p className="mt-2 text-sm text-gray-600">
						予期しないエラーが発生しました。
					</p>

					{/* 開発環境でのエラー詳細表示 */}
					{process.env.NODE_ENV === "development" && error.message && (
						<div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md text-left">
							<div className="text-sm text-red-700">
								<div className="font-medium">エラーメッセージ:</div>
								<div className="mt-1 font-mono">{error.message}</div>
							</div>
							{(error as Error & { digest?: string }).digest && (
								<div className="mt-2 text-xs text-red-600">
									Error ID: {(error as Error & { digest?: string }).digest}
								</div>
							)}
						</div>
					)}
				</div>

				{/* アクションボタン */}
				<div className="space-y-3">
					<button
						type="button"
						onClick={onRetry}
						className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
					>
						再試行
					</button>

					<button
						type="button"
						onClick={handleGoHome}
						className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
					>
						ホームに戻る
					</button>
				</div>
			</div>
		</div>
	);
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
	/**
	 * ErrorInfoを模擬作成
	 * Next.js error.tsxではErrorInfoが提供されないため、フォールバック用に作成
	 */
	const mockErrorInfo = useMemo(
		() => ({
			componentStack: "Next.js Page Error Boundary",
		}),
		[],
	);

	return (
		<NextJsErrorFallback
			error={error}
			errorInfo={mockErrorInfo}
			onRetry={reset}
		/>
	);
}
