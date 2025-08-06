/**
 * Transaction API エラーハンドリング
 *
 * 取引（収入・支出）関連のAPI操作に特化したエラー処理を提供する
 */

import { ApiError, type ApiErrorResponse, type ApiErrorType } from "./errors";

/**
 * 取引操作の種類
 */
export type TransactionOperation = "create" | "update" | "delete" | "list";

/**
 * 取引API専用のエラークラス
 *
 * ApiErrorを拡張し、取引操作に特化したエラー情報を提供
 */
export class TransactionApiError extends ApiError {
	public readonly operation: TransactionOperation;

	constructor(
		operation: TransactionOperation,
		type: ApiErrorType,
		message: string,
		statusCode?: number,
		response?: ApiErrorResponse,
		originalError?: Error,
	) {
		super(type, message, statusCode, response, originalError);
		this.name = "TransactionApiError";
		this.operation = operation;
	}
}

/**
 * エラーからユーザーフレンドリーなメッセージを取得する
 *
 * TransactionApiErrorの場合は操作とエラータイプに応じた
 * 具体的なメッセージを返す
 */
export function getErrorMessage(error: unknown): string {
	// TransactionApiErrorの場合
	if (error instanceof TransactionApiError) {
		return getTransactionErrorMessage(error);
	}

	// 通常のApiErrorの場合
	if (error instanceof ApiError) {
		return error.message;
	}

	// Errorインスタンスの場合
	if (error instanceof Error) {
		return error.message;
	}

	// 文字列の場合
	if (typeof error === "string") {
		return error;
	}

	// その他の場合
	return "予期しないエラーが発生しました。";
}

/**
 * TransactionApiError専用のメッセージ生成
 */
function getTransactionErrorMessage(error: TransactionApiError): string {
	const { operation, type } = error;

	// 操作とエラータイプの組み合わせに応じたメッセージマップ
	const messageMap: Record<
		TransactionOperation,
		Record<ApiErrorType, string>
	> = {
		create: {
			network: "サーバーに接続できません。ネットワーク接続を確認してください。",
			timeout: "取引の登録がタイムアウトしました。もう一度お試しください。",
			validation: "入力内容に誤りがあります。金額や日付を確認してください。",
			unauthorized: "認証の有効期限が切れました。再度ログインしてください。",
			forbidden: "この操作を実行する権限がありません。",
			notFound: "指定されたリソースが見つかりません。",
			conflict: "データの重複が発生しました。入力内容を確認してください。",
			server:
				"取引の登録に失敗しました。しばらく待ってから再度お試しください。",
			unknown: "取引の登録中に予期しないエラーが発生しました。",
		},
		update: {
			network: "サーバーに接続できません。ネットワーク接続を確認してください。",
			timeout: "取引の更新がタイムアウトしました。もう一度お試しください。",
			validation: "入力内容に誤りがあります。金額や日付を確認してください。",
			unauthorized: "認証の有効期限が切れました。再度ログインしてください。",
			forbidden: "この取引を更新する権限がありません。",
			notFound:
				"更新対象の取引が見つかりません。既に削除されている可能性があります。",
			conflict:
				"他のユーザーによって更新されています。画面を更新してから再度お試しください。",
			server:
				"取引の更新に失敗しました。しばらく待ってから再度お試しください。",
			unknown: "取引の更新中に予期しないエラーが発生しました。",
		},
		delete: {
			network: "サーバーに接続できません。ネットワーク接続を確認してください。",
			timeout: "取引の削除がタイムアウトしました。もう一度お試しください。",
			validation: "削除リクエストが無効です。",
			unauthorized: "認証の有効期限が切れました。再度ログインしてください。",
			forbidden: "この取引を削除する権限がありません。",
			notFound:
				"削除対象の取引が見つかりません。既に削除されている可能性があります。",
			conflict:
				"他の処理と競合しています。画面を更新してから再度お試しください。",
			server:
				"取引の削除に失敗しました。しばらく待ってから再度お試しください。",
			unknown: "取引の削除中に予期しないエラーが発生しました。",
		},
		list: {
			network: "サーバーに接続できません。ネットワーク接続を確認してください。",
			timeout:
				"取引一覧の読み込みに時間がかかっています。しばらく待ってから再度お試しください。",
			validation: "リクエストパラメータが無効です。",
			unauthorized: "認証の有効期限が切れました。再度ログインしてください。",
			forbidden: "取引一覧を表示する権限がありません。",
			notFound: "取引データが見つかりません。",
			conflict: "データの取得中に競合が発生しました。",
			server:
				"取引一覧の取得に失敗しました。しばらく待ってから再度お試しください。",
			unknown: "取引一覧の取得中に予期しないエラーが発生しました。",
		},
	};

	// 対応するメッセージを取得
	const operationMessages = messageMap[operation];
	if (operationMessages && operationMessages[type]) {
		return operationMessages[type];
	}

	// フォールバック：操作が定義されていない場合
	if (!operationMessages) {
		return "取引の処理中にエラーが発生しました。";
	}

	// フォールバック：エラータイプが定義されていない場合
	return (
		operationMessages.unknown ||
		"取引の処理中に予期しないエラーが発生しました。"
	);
}

/**
 * 取引エラーのログ出力
 *
 * 環境に応じて適切なレベルの詳細情報をログ出力する
 */
export function logTransactionError(error: unknown, context?: string): void {
	const logContext = context || "API Error";
	const logPrefix = `[Transaction Error] [${logContext}]`;

	if (error instanceof TransactionApiError) {
		// TransactionApiErrorの場合
		if (process.env.NODE_ENV === "development") {
			// 開発環境では詳細情報を出力
			console.error(logPrefix, {
				operation: error.operation,
				type: error.type,
				statusCode: error.statusCode,
				message: error.message,
				response: error.response,
				originalError: error.originalError?.message,
				stack: error.stack,
			});
		} else {
			// 本番環境では最小限の情報のみ
			console.error(logPrefix, {
				operation: error.operation,
				type: error.type,
				statusCode: error.statusCode,
				message: error.message,
			});
		}
	} else if (error instanceof ApiError) {
		// 通常のApiErrorの場合
		if (process.env.NODE_ENV === "development") {
			console.error(logPrefix, error.getDebugInfo());
		} else {
			console.error(logPrefix, {
				type: error.type,
				statusCode: error.statusCode,
				message: error.message,
			});
		}
	} else if (error instanceof Error) {
		// 通常のErrorの場合
		const errorContext = context || "Unknown Error";
		console.error(`[Transaction Error] [${errorContext}]`, {
			message: error.message,
			...(process.env.NODE_ENV === "development" && { stack: error.stack }),
		});
	} else {
		// その他のエラー
		const errorContext = context || "Unknown Error";
		console.error(`[Transaction Error] [${errorContext}]`, {
			error,
		});
	}
}
