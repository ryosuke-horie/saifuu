/**
 * エラーバウンダリ強化実装
 *
 * React Error Boundaryと自動ログ統合システム
 * 構造化エラーキャプチャ、カスタマイズ可能なエラーハンドリング
 */

"use client";

import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { useOptionalLoggerContext } from "./context";
import type { FrontendLogMeta } from "./types";

/**
 * エラーバウンダリの状態型
 */
interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
	errorInfo: ErrorInfo | null;
	errorId: string | null;
	retryCount: number;
}

/**
 * エラーバウンダリのプロパティ型
 */
interface LoggedErrorBoundaryProps {
	children: ReactNode;
	fallback?: React.ComponentType<ErrorFallbackProps>;
	onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void;
	resetOnPropsChange?: boolean;
	resetKeys?: Array<string | number>;
	maxRetries?: number;
	enableRetry?: boolean;
	isolate?: boolean;
	componentName?: string;
	logLevel?: "warn" | "error";
	additionalMetadata?: FrontendLogMeta;
}

/**
 * エラーフォールバックコンポーネントのプロパティ型
 */
export interface ErrorFallbackProps {
	error: Error;
	errorInfo: ErrorInfo;
	errorId: string;
	retry: () => void;
	retryCount: number;
	maxRetries: number;
	canRetry: boolean;
	componentName?: string;
}

/**
 * LoggedErrorBoundary クラスコンポーネント
 * React Error Boundaryにロガー統合機能を追加
 */
class LoggedErrorBoundaryClass extends Component<
	LoggedErrorBoundaryProps,
	ErrorBoundaryState
> {
	private resetTimeoutId: number | undefined;

	constructor(props: LoggedErrorBoundaryProps) {
		super(props);

		this.state = {
			hasError: false,
			error: null,
			errorInfo: null,
			errorId: null,
			retryCount: 0,
		};
	}

	static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
		// エラーIDの生成
		const errorId = `error_${Date.now()}_${Math.random()
			.toString(36)
			.substr(2, 9)}`;

		return {
			hasError: true,
			error,
			errorId,
		};
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		const {
			onError,
			componentName,
			logLevel = "error",
			additionalMetadata = {},
		} = this.props;
		const errorId = this.state.errorId!;

		// ログ出力はHookで取得できないため、グローバルロガーまたはコンテキストから取得
		this.logError(
			error,
			errorInfo,
			errorId,
			componentName,
			logLevel,
			additionalMetadata,
		);

		// カスタムエラーハンドラの実行
		if (onError) {
			onError(error, errorInfo, errorId);
		}

		this.setState({ errorInfo });
	}

	componentDidUpdate(prevProps: LoggedErrorBoundaryProps) {
		const { resetOnPropsChange, resetKeys } = this.props;
		const { hasError } = this.state;

		if (hasError && prevProps.resetKeys !== resetKeys && resetOnPropsChange) {
			if (resetKeys?.some((key, idx) => key !== prevProps.resetKeys?.[idx])) {
				this.resetErrorBoundary();
			}
		}
	}

	private logError = (
		error: Error,
		errorInfo: ErrorInfo,
		errorId: string,
		componentName?: string,
		_logLevel: "warn" | "error" = "error",
		additionalMetadata: FrontendLogMeta = {},
	) => {
		// グローバルロガーへのアクセス（実装環境に応じて調整）
		// ここではconsoleロガーとしてフォールバック実装
		const logMessage = `React Error Boundary caught error in ${componentName || "unknown component"}`;

		const errorMeta: FrontendLogMeta = {
			...additionalMetadata,
			errorBoundary: componentName || "LoggedErrorBoundary",
			errorId,
			error: error.name,
			stack: error.stack,
			componentStack: errorInfo.componentStack,
			retryCount: this.state.retryCount,
			action: "error_boundary_catch",
		};

		// コンソールログ（開発環境用）
		if (process.env.NODE_ENV === "development") {
			console.group(`🚨 ${logMessage}`);
			console.error("Error:", error);
			console.error("Error Info:", errorInfo);
			console.error("Metadata:", errorMeta);
			console.groupEnd();
		}

		// プロダクション環境では外部ログサービスに送信する想定
		// 実際の実装では、エラー報告サービス（Sentry等）との連携も考慮
	};

	private resetErrorBoundary = () => {
		// タイムアウトをクリア
		if (this.resetTimeoutId) {
			clearTimeout(this.resetTimeoutId);
		}

		this.setState({
			hasError: false,
			error: null,
			errorInfo: null,
			errorId: null,
			retryCount: 0,
		});
	};

	private retryErrorBoundary = () => {
		const { maxRetries = 3 } = this.props;
		const { retryCount } = this.state;

		if (retryCount < maxRetries) {
			this.setState((prevState) => ({
				hasError: false,
				error: null,
				errorInfo: null,
				errorId: null,
				retryCount: prevState.retryCount + 1,
			}));

			// 自動リセットのタイマー設定（5秒後）
			this.resetTimeoutId = window.setTimeout(() => {
				if (this.state.hasError) {
					this.resetErrorBoundary();
				}
			}, 5000);
		}
	};

	render() {
		const { hasError, error, errorInfo, errorId, retryCount } = this.state;
		const {
			children,
			fallback: Fallback,
			maxRetries = 3,
			enableRetry = true,
			componentName,
		} = this.props;

		if (hasError && error && errorInfo && errorId) {
			const canRetry = enableRetry && retryCount < maxRetries;

			if (Fallback) {
				return (
					<Fallback
						error={error}
						errorInfo={errorInfo}
						errorId={errorId}
						retry={this.retryErrorBoundary}
						retryCount={retryCount}
						maxRetries={maxRetries}
						canRetry={canRetry}
						componentName={componentName}
					/>
				);
			}

			// デフォルトのエラーUI
			return (
				<DefaultErrorFallback
					error={error}
					errorInfo={errorInfo}
					errorId={errorId}
					retry={this.retryErrorBoundary}
					retryCount={retryCount}
					maxRetries={maxRetries}
					canRetry={canRetry}
					componentName={componentName}
				/>
			);
		}

		return children;
	}
}

/**
 * LoggedErrorBoundary 関数コンポーネント
 * LoggerContextを使用するためのラッパー
 */
export function LoggedErrorBoundary(props: LoggedErrorBoundaryProps) {
	// LoggerContextを関数コンポーネント内で使用
	const loggerContext = useOptionalLoggerContext();

	// ログ機能の拡張
	const enhancedOnError = React.useCallback(
		(error: Error, errorInfo: ErrorInfo, errorId: string) => {
			if (loggerContext) {
				const { logger } = loggerContext;
				const {
					componentName,
					logLevel = "error",
					additionalMetadata = {},
				} = props;

				logger[logLevel](
					`React Error Boundary caught error in ${componentName || "unknown component"}`,
					{
						...additionalMetadata,
						errorBoundary: componentName || "LoggedErrorBoundary",
						errorId,
						error: error.name,
						stack: error.stack,
						componentStack: errorInfo.componentStack,
						action: "error_boundary_catch",
					},
				);
			}

			// オリジナルのonErrorを実行
			if (props.onError) {
				props.onError(error, errorInfo, errorId);
			}
		},
		[loggerContext, props],
	);

	return <LoggedErrorBoundaryClass {...props} onError={enhancedOnError} />;
}

/**
 * デフォルトのエラーフォールバックコンポーネント
 */
function DefaultErrorFallback({
	error,
	errorId,
	retry,
	retryCount,
	maxRetries,
	canRetry,
	componentName,
}: ErrorFallbackProps) {
	return (
		<div
			style={{
				padding: "20px",
				border: "1px solid #ff6b6b",
				borderRadius: "8px",
				backgroundColor: "#fff5f5",
				color: "#c92a2a",
				fontFamily: "system-ui, sans-serif",
			}}
		>
			<h2 style={{ margin: "0 0 10px 0", fontSize: "18px" }}>
				⚠️ エラーが発生しました
			</h2>

			<p style={{ margin: "0 0 10px 0", fontSize: "14px" }}>
				{componentName && `コンポーネント: ${componentName}`}
			</p>

			<details style={{ marginBottom: "15px" }}>
				<summary style={{ cursor: "pointer", fontSize: "14px" }}>
					エラー詳細を表示
				</summary>
				<pre
					style={{
						margin: "10px 0 0 0",
						padding: "10px",
						backgroundColor: "#f8f8f8",
						border: "1px solid #ddd",
						borderRadius: "4px",
						fontSize: "12px",
						overflow: "auto",
						maxHeight: "200px",
					}}
				>
					{error.message}
					{error.stack && `\n\n${error.stack}`}
				</pre>
			</details>

			<div style={{ fontSize: "12px", color: "#868e96", marginBottom: "15px" }}>
				エラーID: {errorId}
				{retryCount > 0 && ` | 再試行回数: ${retryCount}/${maxRetries}`}
			</div>

			{canRetry && (
				<button
					type="button"
					onClick={retry}
					style={{
						padding: "8px 16px",
						backgroundColor: "#228be6",
						color: "white",
						border: "none",
						borderRadius: "4px",
						cursor: "pointer",
						fontSize: "14px",
						marginRight: "10px",
					}}
				>
					再試行 ({maxRetries - retryCount}回まで)
				</button>
			)}

			<button
				type="button"
				onClick={() => window.location.reload()}
				style={{
					padding: "8px 16px",
					backgroundColor: "#6c757d",
					color: "white",
					border: "none",
					borderRadius: "4px",
					cursor: "pointer",
					fontSize: "14px",
				}}
			>
				ページを再読み込み
			</button>
		</div>
	);
}

/**
 * withErrorBoundary HOC
 * 既存のコンポーネントをLoggedErrorBoundaryでラップするHOC
 */
export function withErrorBoundary<P extends object>(
	Component: React.ComponentType<P>,
	errorBoundaryProps?: Omit<LoggedErrorBoundaryProps, "children">,
) {
	const WrappedComponent = (props: P) => (
		<LoggedErrorBoundary {...errorBoundaryProps}>
			<Component {...props} />
		</LoggedErrorBoundary>
	);

	WrappedComponent.displayName = `withErrorBoundary(${
		Component.displayName || Component.name
	})`;

	return WrappedComponent;
}

/**
 * useErrorHandler カスタムフック
 * 関数コンポーネント内でのエラーハンドリング
 */
export function useErrorHandler() {
	const loggerContext = useOptionalLoggerContext();

	return React.useCallback(
		(error: Error, additionalMeta?: FrontendLogMeta) => {
			if (loggerContext) {
				const { logger } = loggerContext;
				logger.error("Manual error handling", {
					...additionalMeta,
					error: error.name,
					stack: error.stack,
					action: "manual_error_handling",
				});
			}

			// 開発環境では再スロー
			if (process.env.NODE_ENV === "development") {
				throw error;
			}
		},
		[loggerContext],
	);
}

/**
 * ErrorFallback デフォルトエクスポート
 * カスタムエラーフォールバックコンポーネント作成用
 */
export { DefaultErrorFallback };

/**
 * エラーバウンダリプリセット
 */
export const ErrorBoundaryPresets = {
	/**
	 * 開発環境用プリセット
	 * 詳細なエラー情報表示、再試行無効
	 */
	development: {
		logLevel: "error" as const,
		enableRetry: false,
		maxRetries: 0,
		resetOnPropsChange: true,
	},

	/**
	 * 本番環境用プリセット
	 * ユーザーフレンドリーなエラー表示、自動再試行
	 */
	production: {
		logLevel: "error" as const,
		enableRetry: true,
		maxRetries: 3,
		resetOnPropsChange: false,
	},

	/**
	 * Storybook環境用プリセット
	 * 詳細なエラー情報、即座にリセット
	 */
	storybook: {
		logLevel: "warn" as const,
		enableRetry: true,
		maxRetries: 1,
		resetOnPropsChange: true,
	},
} as const;
