/**
 * API エラーハンドリング
 *
 * 統一されたエラー処理とユーザーフレンドリーな
 * エラーメッセージを提供する
 */

/**
 * APIエラーの種類
 */
export type ApiErrorType =
	| "network" // ネットワークエラー（接続失敗、タイムアウト等）
	| "validation" // バリデーションエラー（400）
	| "unauthorized" // 認証エラー（401）
	| "forbidden" // 認可エラー（403）
	| "notFound" // リソースが見つからない（404）
	| "conflict" // 競合エラー（409）
	| "server" // サーバーエラー（5xx）
	| "timeout" // タイムアウト
	| "unknown"; // その他の予期しないエラー

/**
 * エラーレスポンスの共通インターフェース
 * バックエンドAPIのエラーレスポンス形式に合わせる
 */
export interface ApiErrorResponse {
	error: string;
	details?: string;
	code?: string;
	fields?: Record<string, string[]>; // バリデーションエラーのフィールド詳細
}

/**
 * APIエラークラス
 * アプリケーション全体で使用される統一されたエラー型
 */
export class ApiError extends Error {
	public readonly type: ApiErrorType;
	public readonly statusCode?: number;
	public readonly response?: ApiErrorResponse;
	public readonly originalError?: Error;

	constructor(
		type: ApiErrorType,
		message: string,
		statusCode?: number,
		response?: ApiErrorResponse,
		originalError?: Error,
	) {
		super(message);
		this.name = "ApiError";
		this.type = type;
		this.statusCode = statusCode;
		this.response = response;
		this.originalError = originalError;

		// Error.captureStackTrace が利用可能な場合のスタックトレース設定
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, ApiError);
		}
	}

	/**
	 * エラーが特定の種類かどうかを判定
	 */
	isType(type: ApiErrorType): boolean {
		return this.type === type;
	}

	/**
	 * エラーが特定のステータスコードかどうかを判定
	 */
	isStatusCode(statusCode: number): boolean {
		return this.statusCode === statusCode;
	}

	/**
	 * デバッグ用の詳細情報を取得
	 */
	getDebugInfo() {
		return {
			type: this.type,
			message: this.message,
			statusCode: this.statusCode,
			response: this.response,
			originalError: this.originalError?.message,
			stack: this.stack,
		};
	}
}

/**
 * HTTPレスポンスからAPIエラーを作成する
 */
export async function createApiErrorFromResponse(
	response: Response,
): Promise<ApiError> {
	const statusCode = response.status;
	let errorResponse: ApiErrorResponse | undefined;
	let errorMessage = `HTTPエラー: ${statusCode}`;

	try {
		// レスポンスボディからエラー情報を取得
		const contentType = response.headers.get("content-type");
		if (contentType?.includes("application/json")) {
			errorResponse = await response.json();
			errorMessage = errorResponse?.error || errorMessage;
		} else {
			const textResponse = await response.text();
			errorMessage = textResponse || errorMessage;
		}
	} catch {
		// JSON解析に失敗した場合はデフォルトメッセージを使用
	}

	// ステータスコードに基づいてエラータイプを決定
	const type = getErrorTypeFromStatusCode(statusCode);

	// ユーザーフレンドリーなメッセージに変換
	const userMessage = getUserFriendlyMessage(type, statusCode, errorMessage);

	return new ApiError(type, userMessage, statusCode, errorResponse);
}

/**
 * ネットワークエラーからAPIエラーを作成する
 */
export function createNetworkError(originalError: Error): ApiError {
	let type: ApiErrorType = "network";
	let message = "ネットワークエラーが発生しました";

	// タイムアウトエラーの検出
	if (
		originalError.name === "AbortError" ||
		originalError.message.includes("timeout")
	) {
		type = "timeout";
		message = "リクエストがタイムアウトしました";
	} else if (originalError.message.includes("fetch")) {
		message = "サーバーに接続できませんでした";
	}

	return new ApiError(type, message, undefined, undefined, originalError);
}

/**
 * HTTPステータスコードからエラータイプを判定する
 */
function getErrorTypeFromStatusCode(statusCode: number): ApiErrorType {
	if (statusCode >= 400 && statusCode < 500) {
		switch (statusCode) {
			case 400:
				return "validation";
			case 401:
				return "unauthorized";
			case 403:
				return "forbidden";
			case 404:
				return "notFound";
			case 409:
				return "conflict";
			default:
				return "validation";
		}
	}

	if (statusCode >= 500) {
		return "server";
	}

	return "unknown";
}

/**
 * ユーザーフレンドリーなエラーメッセージを生成する
 */
function getUserFriendlyMessage(
	type: ApiErrorType,
	statusCode?: number,
	originalMessage?: string,
): string {
	// まず日本語のエラーメッセージマッピング
	const messageMap: Record<ApiErrorType, string> = {
		network:
			"ネットワークエラーが発生しました。インターネット接続を確認してください。",
		timeout:
			"リクエストがタイムアウトしました。しばらく待ってから再度お試しください。",
		validation: "入力内容に問題があります。入力内容を確認してください。",
		unauthorized: "認証が必要です。ログインしてください。",
		forbidden: "この操作を実行する権限がありません。",
		notFound: "要求されたリソースが見つかりませんでした。",
		conflict: "データの競合が発生しました。画面を更新して再度お試しください。",
		server:
			"サーバーエラーが発生しました。しばらく待ってから再度お試しください。",
		unknown: "予期しないエラーが発生しました。",
	};

	// 基本メッセージを取得
	let message = messageMap[type];

	// 特定のステータスコードに対する詳細メッセージ
	if (statusCode) {
		switch (statusCode) {
			case 429:
				message =
					"リクエストが多すぎます。しばらく待ってから再度お試しください。";
				break;
			case 502:
			case 503:
			case 504:
				message =
					"サーバーが一時的に利用できません。しばらく待ってから再度お試しください。";
				break;
		}
	}

	// 開発環境では詳細なエラー情報も含める
	if (process.env.NODE_ENV === "development" && originalMessage) {
		message += `\n詳細: ${originalMessage}`;
	}

	return message;
}

/**
 * エラーがリトライ可能かどうかを判定する
 */
export function isRetryableError(error: ApiError): boolean {
	// ネットワークエラーやタイムアウトはリトライ可能
	if (error.type === "network" || error.type === "timeout") {
		return true;
	}

	// 特定のサーバーエラーはリトライ可能
	if (error.type === "server" && error.statusCode) {
		return [502, 503, 504].includes(error.statusCode);
	}

	// その他はリトライしない
	return false;
}

/**
 * バリデーションエラーの詳細を取得する
 */
export function getValidationErrors(
	error: ApiError,
): Record<string, string[]> | null {
	if (error.type === "validation" && error.response?.fields) {
		return error.response.fields;
	}
	return null;
}

/**
 * エラーログ出力用のユーティリティ
 * 開発環境ではコンソールに詳細出力、本番環境では最小限の情報のみ
 */
export function logApiError(error: ApiError, context?: string): void {
	const logContext = context ? `[${context}]` : "[API Error]";

	if (process.env.NODE_ENV === "development") {
		console.error(logContext, error.getDebugInfo());
	} else {
		// 本番環境では最小限の情報のみログ出力
		console.error(logContext, {
			type: error.type,
			statusCode: error.statusCode,
			message: error.message,
		});
	}
}

/**
 * エラーハンドリングのヘルパー関数
 * 共通的なエラー処理パターンを簡素化
 */
export function handleApiError(error: unknown, context?: string): ApiError {
	let apiError: ApiError;

	if (error instanceof ApiError) {
		apiError = error;
	} else if (error instanceof Error) {
		apiError = createNetworkError(error);
	} else {
		apiError = new ApiError("unknown", "予期しないエラーが発生しました");
	}

	// エラーログを出力
	logApiError(apiError, context);

	return apiError;
}
