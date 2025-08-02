"use client";

import { AlertCircle, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode, useState } from "react";
import { Button } from "../ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "../ui/card";

// エラータイプの分類を定義
const ErrorType = {
	NETWORK: "network",
	VALIDATION: "validation",
	SERVER: "server",
	UNKNOWN: "unknown",
} as const;

type ErrorTypeValue = (typeof ErrorType)[keyof typeof ErrorType];

// エラー分類のための型ガード
const classifyError = (error: Error): ErrorTypeValue => {
	const message = error.message.toLowerCase();
	const name = error.name.toLowerCase();

	// ネットワークエラーの判定
	if (
		name.includes("network") ||
		message.includes("fetch") ||
		message.includes("network") ||
		message.includes("failed to fetch") ||
		message.includes("connection")
	) {
		return ErrorType.NETWORK;
	}

	// バリデーションエラーの判定
	if (
		name.includes("validation") ||
		name.includes("zod") ||
		message.includes("validation") ||
		message.includes("invalid")
	) {
		return ErrorType.VALIDATION;
	}

	// サーバーエラーの判定
	if (
		message.includes("500") ||
		message.includes("502") ||
		message.includes("503") ||
		message.includes("504") ||
		message.includes("server")
	) {
		return ErrorType.SERVER;
	}

	return ErrorType.UNKNOWN;
};

// エラーメッセージのマッピング
const errorMessages = {
	[ErrorType.NETWORK]: {
		title: "ネットワークエラー",
		description:
			"インターネット接続を確認してください。問題が解決しない場合は、しばらく待ってから再度お試しください。",
	},
	[ErrorType.VALIDATION]: {
		title: "入力エラー",
		description: "入力内容に問題があります。フォームの内容を確認してください。",
	},
	[ErrorType.SERVER]: {
		title: "サーバーエラー",
		description:
			"サーバーで問題が発生しました。しばらく待ってから再度お試しください。",
	},
	[ErrorType.UNKNOWN]: {
		title: "エラーが発生しました",
		description:
			"予期しないエラーが発生しました。問題が解決しない場合は、サポートにお問い合わせください。",
	},
} as const satisfies Record<
	ErrorTypeValue,
	{ title: string; description: string }
>;

// ErrorBoundaryのPropsの型定義
type ErrorBoundaryProps = {
	children: ReactNode;
	fallback?: (props: ErrorFallbackProps) => ReactNode;
	onError?: (error: Error, errorInfo: ErrorInfo) => void;
	onRetry?: () => void;
	showDetails?: boolean;
};

// エラーフォールバックコンポーネントのPropsの型定義
type ErrorFallbackProps = {
	error: Error;
	errorType: ErrorTypeValue;
	resetError: () => void;
	errorInfo?: ErrorInfo;
	showDetails?: boolean;
};

// ErrorBoundaryのState型定義
type ErrorBoundaryState = {
	hasError: boolean;
	error: Error | null;
	errorInfo: ErrorInfo | null;
};

// デフォルトのエラーフォールバックコンポーネント
function DefaultErrorFallback({
	error,
	errorType,
	resetError,
	errorInfo,
	showDetails = process.env.NODE_ENV === "development",
}: ErrorFallbackProps) {
	const [isDetailsOpen, setIsDetailsOpen] = useState(false);
	const errorMessage = errorMessages[errorType];

	// エラー報告のプレースホルダー関数
	const reportError = () => {
		// 将来的にエラー報告サービス（Sentry等）と統合
		console.error("Error reported:", {
			error: error.message,
			stack: error.stack,
			errorInfo,
			timestamp: new Date().toISOString(),
			userAgent:
				typeof window !== "undefined" ? window.navigator.userAgent : undefined,
		});
		alert("エラーレポートを送信しました。ご協力ありがとうございます。");
	};

	return (
		<div className="flex min-h-[400px] items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<div className="flex items-center gap-2">
						<AlertCircle className="h-5 w-5 text-destructive" />
						<CardTitle>{errorMessage.title}</CardTitle>
					</div>
					<CardDescription>{errorMessage.description}</CardDescription>
				</CardHeader>

				{showDetails && (
					<CardContent>
						<button
							type="button"
							onClick={() => setIsDetailsOpen(!isDetailsOpen)}
							className="flex w-full items-center justify-between rounded-md border p-2 text-sm hover:bg-muted/50"
						>
							<span className="font-medium">エラー詳細</span>
							{isDetailsOpen ? (
								<ChevronUp className="h-4 w-4" />
							) : (
								<ChevronDown className="h-4 w-4" />
							)}
						</button>

						{isDetailsOpen && (
							<div className="mt-2 space-y-2">
								<div className="rounded-md bg-muted p-3">
									<p className="text-xs font-medium text-muted-foreground">
										エラータイプ
									</p>
									<p className="text-sm">{errorType}</p>
								</div>

								<div className="rounded-md bg-muted p-3">
									<p className="text-xs font-medium text-muted-foreground">
										エラーメッセージ
									</p>
									<p className="text-sm font-mono">{error.message}</p>
								</div>

								{error.stack && (
									<div className="rounded-md bg-muted p-3">
										<p className="text-xs font-medium text-muted-foreground">
											スタックトレース
										</p>
										<pre className="mt-1 overflow-x-auto text-xs">
											{error.stack}
										</pre>
									</div>
								)}

								{(error as any).digest && (
									<div className="rounded-md bg-muted p-3">
										<p className="text-xs font-medium text-muted-foreground">
											エラーダイジェスト
										</p>
										<p className="text-sm font-mono">{(error as any).digest}</p>
									</div>
								)}
							</div>
						)}
					</CardContent>
				)}

				<CardFooter className="flex gap-2">
					<Button onClick={resetError} variant="default" size="sm">
						<RefreshCw className="mr-2 h-4 w-4" />
						再試行
					</Button>
					{showDetails && (
						<Button onClick={reportError} variant="outline" size="sm">
							エラーを報告
						</Button>
					)}
				</CardFooter>
			</Card>
		</div>
	);
}

// ErrorBoundaryクラスコンポーネント
export class ErrorBoundary extends Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = {
			hasError: false,
			error: null,
			errorInfo: null,
		};
	}

	static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
		// エラー発生時にstateを更新
		return {
			hasError: true,
			error,
		};
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		// エラー情報をstateに保存
		this.setState({
			errorInfo,
		});

		// onErrorコールバックを実行
		this.props.onError?.(error, errorInfo);

		// 開発環境でのロギング
		if (process.env.NODE_ENV === "development") {
			console.error("ErrorBoundary caught an error:", error);
			console.error("Error info:", errorInfo);
		}
	}

	resetError = () => {
		// onRetryコールバックを実行
		this.props.onRetry?.();

		// エラー状態をリセット
		this.setState({
			hasError: false,
			error: null,
			errorInfo: null,
		});
	};

	render() {
		if (this.state.hasError && this.state.error) {
			const errorType = classifyError(this.state.error);

			// カスタムフォールバックUIが提供されている場合
			if (this.props.fallback) {
				return this.props.fallback({
					error: this.state.error,
					errorType,
					resetError: this.resetError,
					errorInfo: this.state.errorInfo ?? undefined,
					showDetails: this.props.showDetails,
				});
			}

			// デフォルトのフォールバックUIを使用
			return (
				<DefaultErrorFallback
					error={this.state.error}
					errorType={errorType}
					resetError={this.resetError}
					errorInfo={this.state.errorInfo ?? undefined}
					showDetails={this.props.showDetails}
				/>
			);
		}

		// エラーがない場合は子コンポーネントをレンダリング
		return this.props.children;
	}
}

// 再エクスポート
export type { ErrorBoundaryProps, ErrorFallbackProps, ErrorTypeValue };
export { ErrorType, classifyError, DefaultErrorFallback };
