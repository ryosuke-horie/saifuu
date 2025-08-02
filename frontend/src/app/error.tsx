"use client";

import { AlertCircle, Home, RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { classifyError, ErrorType } from "@/components/common/ErrorBoundary";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

/**
 * ルートセグメントエラーハンドラ
 *
 * Next.js App Routerで各ルートセグメントのエラーハンドリングを行うコンポーネント
 * global-error.tsxがルートレベルのエラーを処理するのに対し、
 * このコンポーネントはネストされたルートセグメント内のエラーを処理する
 *
 * 特徴:
 * - ErrorBoundaryコンポーネントと一貫性のあるUI
 * - エラータイプに応じた適切なメッセージ表示
 * - リセット機能による復旧試行
 * - 開発環境でのデバッグ情報表示
 */

// エラータイプ別の設定
const errorConfig = {
	[ErrorType.NETWORK]: {
		title: "ネットワークエラー",
		description:
			"インターネット接続を確認してください。問題が解決しない場合は、しばらく待ってから再度お試しください。",
		icon: "📡",
		color: "text-orange-600",
		bgColor: "bg-orange-50",
	},
	[ErrorType.VALIDATION]: {
		title: "入力エラー",
		description: "入力内容に問題があります。フォームの内容を確認してください。",
		icon: "📝",
		color: "text-yellow-600",
		bgColor: "bg-yellow-50",
	},
	[ErrorType.SERVER]: {
		title: "サーバーエラー",
		description:
			"サーバーで問題が発生しました。しばらく待ってから再度お試しください。",
		icon: "🖥️",
		color: "text-red-600",
		bgColor: "bg-red-50",
	},
	[ErrorType.UNKNOWN]: {
		title: "予期しないエラー",
		description:
			"申し訳ございません。予期しないエラーが発生しました。問題が解決しない場合は、サポートにお問い合わせください。",
		icon: "⚠️",
		color: "text-red-600",
		bgColor: "bg-red-50",
	},
} as const;

// biome-ignore lint/suspicious/noShadowRestrictedNames: Next.js requires this function to be named "Error" for error.tsx
export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	// エラータイプを分類
	const errorType = classifyError(error);
	const config = errorConfig[errorType];

	useEffect(() => {
		// 開発環境でのエラーログ出力
		if (process.env.NODE_ENV === "development") {
			console.error("Route Segment Error:", {
				error: error.message,
				stack: error.stack,
				digest: error.digest,
				type: errorType,
				timestamp: new Date().toISOString(),
			});
		}
	}, [error, errorType]);

	// エラー報告（将来的にSentry等と統合）
	const handleReportError = () => {
		console.log("Error report:", {
			error: error.message,
			stack: error.stack,
			digest: error.digest,
			errorType,
			timestamp: new Date().toISOString(),
			userAgent:
				typeof window !== "undefined" ? window.navigator.userAgent : undefined,
			url: typeof window !== "undefined" ? window.location.href : undefined,
		});
		alert("エラーレポートを送信しました。ご協力ありがとうございます。");
	};

	return (
		<div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100">
			<Card className="w-full max-w-lg shadow-lg">
				<CardHeader className={`${config.bgColor} border-b`}>
					<div className="flex flex-col items-center gap-3">
						<span className="text-5xl" role="img" aria-label="Error icon">
							{config.icon}
						</span>
						<CardTitle className={`text-2xl ${config.color}`}>
							{config.title}
						</CardTitle>
					</div>
					<CardDescription className="text-center text-gray-600 mt-2">
						{config.description}
					</CardDescription>
				</CardHeader>

				<CardContent className="pt-6">
					{/* 開発環境でのデバッグ情報 */}
					{process.env.NODE_ENV === "development" && (
						<details className="mb-6">
							<summary className="cursor-pointer font-medium text-sm text-gray-700 hover:text-gray-900 flex items-center gap-2">
								<AlertCircle className="h-4 w-4" />
								エラー詳細（開発環境）
							</summary>
							<div className="mt-3 space-y-3">
								{/* エラータイプ */}
								<div className="rounded-md bg-gray-50 p-3">
									<p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
										Error Type
									</p>
									<p className="text-sm font-mono text-gray-700">{errorType}</p>
								</div>

								{/* エラーメッセージ */}
								<div className="rounded-md bg-red-50 p-3">
									<p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
										Error Message
									</p>
									<p className="text-sm font-mono text-red-700 break-words">
										{error.message}
									</p>
								</div>

								{/* エラーダイジェスト */}
								{error.digest && (
									<div className="rounded-md bg-blue-50 p-3">
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
									<div className="rounded-md bg-gray-50 p-3">
										<p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
											Stack Trace
										</p>
										<pre className="text-xs font-mono text-gray-600 overflow-x-auto whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
											{error.stack}
										</pre>
									</div>
								)}
							</div>
						</details>
					)}

					{/* ヘルプテキスト */}
					<div className="rounded-md bg-blue-50 p-4 mb-6">
						<p className="text-sm text-blue-800">
							<strong>💡 ヒント:</strong>{" "}
							このエラーが繰り返し発生する場合は、ブラウザのキャッシュをクリアするか、別のブラウザでお試しください。
						</p>
					</div>
				</CardContent>

				<CardFooter className="flex flex-col gap-2 pb-6">
					<Button onClick={reset} className="w-full" size="lg">
						<RefreshCw className="mr-2 h-4 w-4" />
						再試行
					</Button>

					<a href="/" className="w-full">
						<Button variant="outline" className="w-full" size="lg">
							<Home className="mr-2 h-4 w-4" />
							ホームに戻る
						</Button>
					</a>

					{/* 開発環境でのエラー報告ボタン */}
					{process.env.NODE_ENV === "development" && (
						<Button
							onClick={handleReportError}
							variant="ghost"
							className="w-full"
							size="sm"
						>
							エラーを報告
						</Button>
					)}
				</CardFooter>
			</Card>
		</div>
	);
}
