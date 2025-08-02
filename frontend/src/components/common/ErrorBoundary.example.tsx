/**
 * ErrorBoundaryコンポーネントの使用例
 *
 * このファイルは実装例を示すためのドキュメントです。
 * 実際のアプリケーションでの使用方法を説明しています。
 */

import type { ErrorFallbackProps } from "./ErrorBoundary";
import { ErrorBoundary } from "./ErrorBoundary";

// 基本的な使用例
export function BasicExample() {
	return (
		<ErrorBoundary>
			<YourComponent />
		</ErrorBoundary>
	);
}

// カスタムフォールバックUIの例
function CustomErrorFallback({ error, resetError }: ErrorFallbackProps) {
	return (
		<div className="p-4 bg-red-50 border border-red-200 rounded">
			<h2 className="text-red-800 font-bold">カスタムエラー画面</h2>
			<p className="text-red-600">{error.message}</p>
			<button
				type="button"
				onClick={resetError}
				className="mt-2 px-4 py-2 bg-red-600 text-white rounded"
			>
				もう一度試す
			</button>
		</div>
	);
}

export function CustomFallbackExample() {
	return (
		<ErrorBoundary fallback={CustomErrorFallback}>
			<YourComponent />
		</ErrorBoundary>
	);
}

// エラー報告機能付きの例
export function WithErrorReportingExample() {
	const handleError = (error: Error, errorInfo: any) => {
		// エラー報告サービス（Sentry等）に送信
		console.error("エラーを報告:", {
			error: error.message,
			stack: error.stack,
			errorInfo,
		});
	};

	return (
		<ErrorBoundary
			onError={handleError}
			showDetails={true} // 開発環境でデバッグ情報を表示
		>
			<YourComponent />
		</ErrorBoundary>
	);
}

// リトライ機能付きの例
export function WithRetryCallbackExample() {
	const handleRetry = () => {
		// リトライ時の処理（データの再取得など）
		console.log("データを再取得します...");
		window.location.reload(); // または適切な再読み込み処理
	};

	return (
		<ErrorBoundary onRetry={handleRetry}>
			<YourComponent />
		</ErrorBoundary>
	);
}

// App Routerでの使用例（layout.tsx）
export function AppRouterExample({ children }: { children: React.ReactNode }) {
	return (
		<html lang="ja">
			<body>
				<ErrorBoundary
					showDetails={process.env.NODE_ENV === "development"}
					onError={(_error, _errorInfo) => {
						// 本番環境でのエラー報告
						if (process.env.NODE_ENV === "production") {
							// Sentryなどに送信
						}
					}}
				>
					{children}
				</ErrorBoundary>
			</body>
		</html>
	);
}

// ダミーコンポーネント（例示用）
function YourComponent() {
	return <div>Your content here</div>;
}
