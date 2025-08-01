"use client";

import { useState } from "react";

/**
 * グローバルエラーハンドラ
 *
 * Next.js App Routerで全体的なエラーハンドリングを行うコンポーネント
 * 予期しないエラーが発生した際に表示される
 *
 * 機能:
 * - エラータイプに応じた適切な表示
 * - エラーレポート機能（クリップボードへのコピー）
 * - 開発環境での詳細なエラー情報表示
 * - アクセシビリティの向上
 * - Tailwind CSS v4によるスタイリング
 *
 * 注意:
 * global-error.jsは独自の<html>と<body>タグを定義する必要がある
 * App Routerでの要件に従い、ここで必要なHTML構造を定義
 */

/**
 * エラータイプの判定とメッセージの取得
 */
const getErrorInfo = (error: Error & { digest?: string }) => {
	// エラー名やメッセージに基づいてエラータイプを判定
	const errorName = error.name.toLowerCase();
	const errorMessage = error.message.toLowerCase();

	if (errorName.includes("network") || errorMessage.includes("network")) {
		return {
			title: "ネットワークエラー",
			description: "インターネット接続を確認してください。",
			icon: "🌐",
		};
	}

	if (errorName.includes("auth") || errorMessage.includes("unauthorized")) {
		return {
			title: "認証エラー",
			description: "再度ログインしてください。",
			icon: "🔐",
		};
	}

	// デフォルト（一般的なエラー）
	return {
		title: "システムエラー",
		description:
			"予期しないエラーが発生しました。しばらく待ってから再度お試しください。",
		icon: "⚠",
	};
};

/**
 * エラーレポート情報の生成
 */
const generateErrorReport = (error: Error & { digest?: string }) => {
	const timestamp = new Date().toISOString();
	const userAgent =
		typeof window !== "undefined" ? window.navigator.userAgent : "N/A";
	const url = typeof window !== "undefined" ? window.location.href : "N/A";

	return `エラー情報レポート
時刻: ${timestamp}
URL: ${url}
User Agent: ${userAgent}
エラー名: ${error.name}
エラーメッセージ: ${error.message}
エラーID: ${error.digest || "N/A"}
スタックトレース:
${error.stack || "スタックトレースがありません"}`;
};

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	const [showDetails, setShowDetails] = useState(false);
	const [reportCopied, setReportCopied] = useState(false);

	const errorInfo = getErrorInfo(error);

	/**
	 * エラーレポートをクリップボードにコピー
	 */
	const handleCopyErrorReport = async () => {
		try {
			const report = generateErrorReport(error);
			await navigator.clipboard.writeText(report);
			setReportCopied(true);
			setTimeout(() => setReportCopied(false), 3000);
		} catch (clipboardError) {
			console.error("クリップボードへのコピーに失敗しました:", clipboardError);
		}
	};

	/**
	 * エラー詳細の表示/非表示切り替え
	 */
	const toggleDetails = () => {
		setShowDetails(!showDetails);
	};
	return (
		<html lang="ja">
			<body>
				{/* スキップリンク - アクセシビリティ向上 */}
				<a
					href="#main-content"
					className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md"
				>
					メインコンテンツにスキップ
				</a>

				<div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
					<div
						id="main-content"
						className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center"
					>
						{/* エラーメッセージ部分 - アクセシビリティ向上 */}
						<div className="mb-6" role="alert" aria-live="assertive">
							<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
								<span
									className="text-2xl"
									role="img"
									aria-label="エラーアイコン"
								>
									{errorInfo.icon}
								</span>
							</div>
							<h1 className="text-2xl font-bold text-gray-900 mb-2">
								{errorInfo.title}
							</h1>
							<p className="text-gray-600 mb-6">{errorInfo.description}</p>
						</div>

						{/* アクションボタン */}
						<div className="space-y-4">
							<button
								type="button"
								onClick={reset}
								className="inline-block w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 focus:outline-none transition-colors"
								aria-describedby="retry-description"
							>
								再試行
							</button>
							<div id="retry-description" className="sr-only">
								エラーが発生したページを再度読み込みます
							</div>

							<a
								href="/"
								className="inline-block w-full px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 focus:ring-4 focus:ring-gray-200 focus:outline-none transition-colors"
								aria-describedby="home-description"
							>
								ホームに戻る
							</a>
							<div id="home-description" className="sr-only">
								アプリケーションのホームページに移動します
							</div>

							{/* エラーレポートボタン */}
							<button
								type="button"
								onClick={handleCopyErrorReport}
								className="inline-block w-full px-6 py-3 bg-orange-600 text-white font-medium rounded-md hover:bg-orange-700 focus:ring-4 focus:ring-orange-200 focus:outline-none transition-colors"
								aria-describedby="report-description"
							>
								{reportCopied ? "コピー完了" : "エラーを報告"}
							</button>
							<div id="report-description" className="sr-only">
								エラー情報をクリップボードにコピーしてサポートチームに報告できます
							</div>
						</div>

						{/* 開発環境での詳細エラー情報 */}
						{process.env.NODE_ENV === "development" && (
							<div className="mt-6">
								<button
									type="button"
									onClick={toggleDetails}
									className="mb-4 px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 focus:ring-4 focus:ring-gray-200 focus:outline-none transition-colors"
								>
									{showDetails ? "エラー詳細を非表示" : "エラー詳細を表示"}
								</button>

								{showDetails && (
									<div className="p-4 bg-red-50 rounded-md text-left border">
										<h3 className="text-sm font-semibold text-red-800 mb-2">
											エラー詳細情報
										</h3>

										<div className="space-y-2 text-sm">
											<div>
												<span className="font-medium text-red-700">
													エラー名:
												</span>
												<span className="ml-2 font-mono text-red-600">
													{error.name}
												</span>
											</div>

											<div>
												<span className="font-medium text-red-700">
													メッセージ:
												</span>
												<span className="ml-2 font-mono text-red-600">
													{error.message}
												</span>
											</div>

											{error.digest && (
												<div>
													<span className="font-medium text-red-700">
														Error ID:
													</span>
													<span className="ml-2 font-mono text-red-600">
														{error.digest}
													</span>
												</div>
											)}

											{error.stack && (
												<div>
													<span className="font-medium text-red-700">
														スタックトレース:
													</span>
													<pre className="mt-2 p-2 bg-gray-100 border rounded text-xs overflow-auto max-h-40 font-mono text-gray-800">
														{error.stack}
													</pre>
												</div>
											)}
										</div>
									</div>
								)}
							</div>
						)}

						{/* 簡易エラー情報（本番環境） */}
						{process.env.NODE_ENV === "production" && error.digest && (
							<div className="mt-6 p-3 bg-gray-50 rounded-md">
								<p className="text-xs text-gray-600">
									エラーID: {error.digest}
								</p>
								<p className="text-xs text-gray-500 mt-1">
									サポートにお問い合わせの際は、このIDをお伝えください。
								</p>
							</div>
						)}
					</div>
				</div>
			</body>
		</html>
	);
}
