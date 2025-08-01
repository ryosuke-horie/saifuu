"use client";

import { useRouter } from "next/navigation";
import { Component, type ReactNode } from "react";

/**
 * エラータイプ定義
 *
 * 設計意図: Matt Pocockのパターンに従い、エラータイプを明確に定義
 * ネットワーク・バリデーション・その他のエラーを識別して適切な表示を行う
 */
export type ErrorType = "network" | "validation" | "unknown";

/**
 * バリデーションエラーの詳細
 */
export interface ValidationErrorDetail {
	field: string;
	message: string;
}

/**
 * 拡張されたエラーオブジェクト
 *
 * 設計意図: 標準のErrorクラスを拡張してアプリケーション固有の情報を追加
 */
export interface ExtendedError extends Error {
	type?: ErrorType;
	details?: ValidationErrorDetail[];
}

/**
 * エラー情報
 */
export interface ErrorInfo {
	componentStack: string;
}

/**
 * エラーレポートデータ
 */
export interface ErrorReportData {
	error: Error;
	errorInfo: ErrorInfo;
	userDescription: string;
	errorId: string;
	timestamp: string;
}

/**
 * フォールバックUIコンポーネントのプロパティ
 */
export interface FallbackProps {
	error: Error;
	errorInfo: ErrorInfo;
	onRetry: () => void;
}

/**
 * エラータイプ別UIマップ
 */
export interface ErrorTypeUIMap {
	network?: ReactNode;
	validation?: ReactNode;
	unknown?: ReactNode;
}

/**
 * ErrorBoundaryのプロパティ
 */
export interface ErrorBoundaryProps {
	children: ReactNode;
	fallback?: React.ComponentType<FallbackProps>;
	errorTypeUI?: ErrorTypeUIMap;
	onError?: (error: Error, errorInfo: ErrorInfo) => void;
	onRetry?: () => void;
	onReport?: (reportData: ErrorReportData) => void;
}

/**
 * ErrorBoundaryの状態
 */
interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
	errorInfo: ErrorInfo | null;
	errorId: string | null;
	showReportDialog: boolean;
}

/**
 * ErrorBoundary実装クラス
 *
 * 設計意図: Reactの標準的なError Boundaryパターンを実装
 * - エラータイプに応じた表示分岐
 * - 開発環境での詳細エラー表示
 * - リトライ・レポート機能
 * - カスタムフォールバック対応
 */
class ErrorBoundaryClass extends Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	private router: ReturnType<typeof useRouter> | null = null;

	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = {
			hasError: false,
			error: null,
			errorInfo: null,
			errorId: null,
			showReportDialog: false,
		};
	}

	/**
	 * 静的メソッド: エラーから状態を導出
	 */
	static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
		const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

		return {
			hasError: true,
			error,
			errorId,
		};
	}

	/**
	 * コンポーネントがエラーをキャッチした時の処理
	 */
	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		// エラー情報を状態に保存
		this.setState({
			errorInfo,
		});

		// コンソールにログ出力
		console.error("[ErrorBoundary]", error, errorInfo);

		// カスタムエラーハンドラーを実行
		if (this.props.onError) {
			this.props.onError(error, errorInfo);
		}
	}

	/**
	 * エラー状態をリセット（再試行）
	 */
	private handleRetry = () => {
		if (this.props.onRetry) {
			this.props.onRetry();
		}

		this.setState({
			hasError: false,
			error: null,
			errorInfo: null,
			errorId: null,
			showReportDialog: false,
		});
	};

	/**
	 * ホームに戻る
	 */
	private handleGoHome = () => {
		if (this.router) {
			this.router.push("/");
		}
	};

	/**
	 * エラーレポートダイアログを表示
	 */
	private handleShowReport = () => {
		this.setState({ showReportDialog: true });
	};

	/**
	 * エラーレポートダイアログを閉じる
	 */
	private handleCloseReport = () => {
		this.setState({ showReportDialog: false });
	};

	/**
	 * エラーレポートを送信
	 */
	private handleSubmitReport = (userDescription: string) => {
		const { error, errorInfo, errorId } = this.state;

		if (error && errorInfo && errorId && this.props.onReport) {
			const reportData: ErrorReportData = {
				error,
				errorInfo,
				userDescription,
				errorId,
				timestamp: new Date().toISOString(),
			};

			this.props.onReport(reportData);
		}

		this.setState({ showReportDialog: false });
	};

	/**
	 * エラータイプを判定
	 */
	private getErrorType(error: Error): ErrorType {
		const extendedError = error as ExtendedError;
		if (extendedError.type) {
			return extendedError.type;
		}

		// エラーメッセージからタイプを推測
		if (error.message.includes("Network")) {
			return "network";
		}

		return "unknown";
	}

	/**
	 * エラータイプ別のメッセージを取得
	 */
	private getErrorMessage(error: Error): {
		title: string;
		description: string;
	} {
		const errorType = this.getErrorType(error);

		switch (errorType) {
			case "network":
				return {
					title: "ネットワークエラーが発生しました",
					description: "インターネット接続を確認してください。",
				};
			case "validation":
				return {
					title: "入力内容に問題があります",
					description: "入力内容を確認してください。",
				};
			default:
				return {
					title: "エラーが発生しました",
					description: "予期しないエラーが発生しました。",
				};
		}
	}

	/**
	 * バリデーションエラーの詳細を描画
	 */
	private renderValidationDetails(error: Error) {
		const extendedError = error as ExtendedError;
		if (extendedError.type === "validation" && extendedError.details) {
			return (
				<div className="mt-4 space-y-2">
					{extendedError.details.map((detail, index) => (
						<div key={index} className="text-sm text-red-600">
							• {detail.message}
						</div>
					))}
				</div>
			);
		}
		return null;
	}

	/**
	 * エラーレポートダイアログを描画
	 */
	private renderReportDialog() {
		if (!this.state.showReportDialog) return null;

		return (
			<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
				<div
					className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
					role="dialog"
					aria-labelledby="error-report-title"
				>
					<h3 id="error-report-title" className="text-lg font-semibold mb-4">
						エラーレポート
					</h3>
					<div className="mb-4">
						<label
							htmlFor="user-description"
							className="block text-sm font-medium mb-2"
						>
							発生時の操作
						</label>
						<textarea
							id="user-description"
							className="w-full p-2 border border-gray-300 rounded-md h-24 resize-none"
							placeholder="エラーが発生した時に何をしていたかを教えてください"
							ref={(textarea) => {
								if (textarea) {
									textarea.onkeydown = (e) => {
										if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
											this.handleSubmitReport(textarea.value);
										}
									};
								}
							}}
						/>
					</div>
					<div className="flex justify-end space-x-2">
						<button
							onClick={this.handleCloseReport}
							className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
						>
							キャンセル
						</button>
						<button
							onClick={() => {
								const textarea = document.getElementById(
									"user-description",
								) as HTMLTextAreaElement;
								this.handleSubmitReport(textarea?.value || "");
							}}
							className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
						>
							送信
						</button>
					</div>
				</div>
			</div>
		);
	}

	render() {
		// エラーが発生していない場合は子コンポーネントを表示
		if (!this.state.hasError || !this.state.error) {
			return this.props.children;
		}

		const { error, errorInfo } = this.state;

		// カスタムフォールバックコンポーネントが提供されている場合
		if (this.props.fallback) {
			const FallbackComponent = this.props.fallback;
			return (
				<FallbackComponent
					error={error}
					errorInfo={errorInfo!}
					onRetry={this.handleRetry}
				/>
			);
		}

		// エラータイプ別のカスタムUIが提供されている場合
		const errorType = this.getErrorType(error);
		if (this.props.errorTypeUI?.[errorType]) {
			return this.props.errorTypeUI[errorType];
		}

		// デフォルトのエラーUI
		const { title, description } = this.getErrorMessage(error);

		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
				<div className="max-w-md w-full space-y-8">
					<div className="text-center">
						<h2 className="mt-6 text-3xl font-extrabold text-gray-900">
							{title}
						</h2>
						<p className="mt-2 text-sm text-gray-600">{description}</p>

						{/* バリデーションエラーの詳細 */}
						{this.renderValidationDetails(error)}

						{/* 開発環境でのエラー詳細 */}
						{process.env.NODE_ENV === "development" && (
							<div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md text-left">
								<div className="text-sm text-red-700">
									<div className="font-medium">エラーメッセージ:</div>
									<div className="mt-1 font-mono">{error.message}</div>
								</div>
								{this.state.errorId && (
									<div className="mt-2 text-xs text-red-600">
										エラーID: {this.state.errorId}
									</div>
								)}
							</div>
						)}
					</div>

					<div className="space-y-3">
						<button
							onClick={this.handleRetry}
							className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
						>
							再試行
						</button>

						<button
							onClick={this.handleGoHome}
							className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
						>
							ホームに戻る
						</button>

						<button
							onClick={this.handleShowReport}
							className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
						>
							エラーを報告
						</button>
					</div>

					{/* エラーレポートダイアログ */}
					{this.renderReportDialog()}
				</div>
			</div>
		);
	}
}

/**
 * ErrorBoundary関数コンポーネント
 *
 * 設計意図: useRouterフックを使用するためのラッパーコンポーネント
 * クラスコンポーネントではフックが使用できないため、この構成を採用
 */
export function ErrorBoundary(props: ErrorBoundaryProps) {
	const router = useRouter();

	// クラスコンポーネントにルーターを渡すためのhack
	// 実際の実装ではRefやContextを使用することを推奨
	return (
		<ErrorBoundaryClass
			{...props}
			ref={(instance) => {
				if (instance) {
					(instance as any).router = router;
				}
			}}
		/>
	);
}
