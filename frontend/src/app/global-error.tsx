"use client";

import { useEffect, useState } from "react";
import {
	classifyError,
	ErrorType,
	type ErrorTypeValue,
} from "@/components/common/ErrorBoundary";

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

// エラータイプ別のメッセージとアイコン
const errorConfig = {
	[ErrorType.NETWORK]: {
		title: "ネットワークエラー",
		description:
			"インターネット接続を確認してください。問題が解決しない場合は、しばらく待ってから再度お試しください。",
		icon: "📡",
		color: "orange",
	},
	[ErrorType.VALIDATION]: {
		title: "入力エラー",
		description: "入力内容に問題があります。フォームの内容を確認してください。",
		icon: "📝",
		color: "yellow",
	},
	[ErrorType.SERVER]: {
		title: "サーバーエラー",
		description:
			"サーバーで問題が発生しました。しばらく待ってから再度お試しください。",
		icon: "🖥️",
		color: "red",
	},
	[ErrorType.UNKNOWN]: {
		title: "予期しないエラー",
		description:
			"申し訳ございません。予期しないエラーが発生しました。問題が解決しない場合は、サポートにお問い合わせください。",
		icon: "⚠️",
		color: "red",
	},
};

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	const [errorType, setErrorType] = useState<ErrorTypeValue>(ErrorType.UNKNOWN);
	const [showDetails, setShowDetails] = useState(false);
	const [retryCount, setRetryCount] = useState(0);
	const [isReporting, setIsReporting] = useState(false);

	useEffect(() => {
		// エラータイプを分類
		const type = classifyError(error);
		setErrorType(type);

		// 開発環境でのロギング
		if (process.env.NODE_ENV === "development") {
			console.error("Global Error Handler:", {
				error: error.message,
				stack: error.stack,
				digest: error.digest,
				type,
				timestamp: new Date().toISOString(),
			});
		}
	}, [error]);

	const config = errorConfig[errorType];

	// 再試行の処理（最大3回まで）
	const handleRetry = () => {
		if (retryCount < 3) {
			setRetryCount((prev) => prev + 1);
			reset();
		} else {
			alert("再試行の上限に達しました。ページをリロードしてください。");
		}
	};

	// エラー報告（プレースホルダー）
	const handleReportError = async () => {
		setIsReporting(true);
		try {
			// 将来的にエラー報告サービス（Sentry等）と統合
			console.log("Error report:", {
				error: error.message,
				stack: error.stack,
				digest: error.digest,
				errorType,
				timestamp: new Date().toISOString(),
				userAgent:
					typeof window !== "undefined"
						? window.navigator.userAgent
						: undefined,
				url: typeof window !== "undefined" ? window.location.href : undefined,
			});

			// 模擬的な遅延
			await new Promise((resolve) => setTimeout(resolve, 1000));
			alert("エラーレポートを送信しました。ご協力ありがとうございます。");
		} finally {
			setIsReporting(false);
		}
	};

	// カラークラスのマッピング
	const colorClasses = {
		red: "bg-red-100 text-red-600 border-red-200",
		orange: "bg-orange-100 text-orange-600 border-orange-200",
		yellow: "bg-yellow-100 text-yellow-600 border-yellow-200",
	};

	return (
		<html lang="ja">
			<body>
				<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
					<div className="max-w-lg w-full bg-white rounded-xl shadow-lg overflow-hidden">
						{/* ヘッダー部分 */}
						<div
							className={`p-6 ${colorClasses[config.color as keyof typeof colorClasses] || colorClasses.red} border-b-4`}
						>
							<div className="flex items-center justify-center mb-4">
								<span className="text-5xl" role="img" aria-label="Error icon">
									{config.icon}
								</span>
							</div>
							<h1 className="text-2xl font-bold text-center text-gray-900">
								{config.title}
							</h1>
						</div>

						{/* メインコンテンツ */}
						<div className="p-6">
							<p className="text-gray-600 text-center mb-6">
								{config.description}
							</p>

							{/* 再試行回数の表示 */}
							{retryCount > 0 && (
								<p className="text-sm text-gray-500 text-center mb-4">
									再試行回数: {retryCount}/3
								</p>
							)}

							{/* アクションボタン */}
							<div className="space-y-3">
								<button
									type="button"
									onClick={handleRetry}
									disabled={retryCount >= 3}
									className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
								>
									<span className="text-xl">🔄</span>
									{retryCount >= 3 ? "再試行の上限に達しました" : "再試行"}
								</button>

								<a
									href="/"
									className="block w-full px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors text-center"
								>
									ホームに戻る
								</a>

								{/* エラー報告ボタン（開発環境または詳細表示時） */}
								{(process.env.NODE_ENV === "development" || showDetails) && (
									<button
										type="button"
										onClick={handleReportError}
										disabled={isReporting}
										className="w-full px-6 py-3 bg-gray-50 text-gray-600 font-medium rounded-lg hover:bg-gray-100 transition-colors border border-gray-200 disabled:opacity-50"
									>
										{isReporting ? "送信中..." : "エラーを報告"}
									</button>
								)}
							</div>

							{/* エラー詳細（開発環境） */}
							{process.env.NODE_ENV === "development" && (
								<div className="mt-6">
									<button
										type="button"
										onClick={() => setShowDetails(!showDetails)}
										className="w-full text-left px-4 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-between"
									>
										<span className="text-sm font-medium text-gray-700">
											エラー詳細
										</span>
										<span className="text-gray-500">
											{showDetails ? "▲" : "▼"}
										</span>
									</button>

									{showDetails && (
										<div className="mt-3 space-y-3">
											{/* エラータイプ */}
											<div className="p-3 bg-gray-50 rounded-lg">
												<p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
													Error Type
												</p>
												<p className="text-sm font-mono text-gray-700">
													{errorType}
												</p>
											</div>

											{/* エラーメッセージ */}
											<div className="p-3 bg-red-50 rounded-lg">
												<p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
													Error Message
												</p>
												<p className="text-sm font-mono text-red-700 break-words">
													{error.message}
												</p>
											</div>

											{/* エラーダイジェスト */}
											{error.digest && (
												<div className="p-3 bg-blue-50 rounded-lg">
													<p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
														Error Digest
													</p>
													<p className="text-sm font-mono text-blue-700">
														{error.digest}
													</p>
												</div>
											)}

											{/* スタックトレース */}
											{error.stack && (
												<div className="p-3 bg-gray-50 rounded-lg">
													<p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
														Stack Trace
													</p>
													<pre className="text-xs font-mono text-gray-600 overflow-x-auto whitespace-pre-wrap break-words">
														{error.stack}
													</pre>
												</div>
											)}

											{/* タイムスタンプ */}
											<div className="p-3 bg-gray-50 rounded-lg">
												<p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
													Timestamp
												</p>
												<p className="text-sm font-mono text-gray-700">
													{new Date().toISOString()}
												</p>
											</div>
										</div>
									)}
								</div>
							)}
						</div>
					</div>
				</div>
			</body>
		</html>
	);
}
