/**
 * Transaction API エラーハンドリング
 *
 * 取引（収入・支出）関連のAPI操作に特化したエラー処理を提供する
 */

import type { TransactionType } from "../../types/transaction";
import { ApiError, type ApiErrorResponse, type ApiErrorType } from "./errors";

/**
 * 取引操作の種類
 */
export type TransactionOperation = "create" | "update" | "delete" | "list";

/**
 * バリデーションエラーの対象フィールド
 */
export type TransactionErrorField =
	| "amount"
	| "categoryId"
	| "date"
	| "description";

/**
 * バリデーションエラーの種類
 */
export type ValidationErrorType =
	| "required"
	| "min"
	| "max"
	| "invalid"
	| "maxLength";

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
	if (operationMessages?.[type]) {
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

/**
 * バリデーションメッセージマップの型定義
 *
 * 型安全性を向上させるために、メッセージマップの構造を明示的に定義
 */
type ValidationMessageMap = Record<
	TransactionType,
	Record<TransactionErrorField, Record<ValidationErrorType, string>>
>;

/**
 * バリデーションエラーメッセージを取得する
 *
 * トランザクションタイプとフィールドに応じた
 * 適切なバリデーションメッセージを返す
 *
 * @param transactionType - 取引タイプ（収入または支出）
 * @param field - エラーが発生したフィールド
 * @param errorType - エラーの種類
 * @returns バリデーションメッセージ（該当するメッセージがない場合はundefined）
 */
export function getValidationMessage(
	transactionType: TransactionType,
	field: TransactionErrorField,
	errorType: ValidationErrorType,
): string | undefined {
	// トランザクションタイプとフィールドに応じたメッセージマップ
	// satisfies演算子で型推論を保ちながら型チェックを実行
	const messageMap = {
		income: {
			amount: {
				required: "収入金額を入力してください。",
				min: "収入金額は0より大きい値を入力してください。",
				max: "収入金額が上限を超えています。",
				invalid: "有効な収入金額を入力してください。",
				maxLength: "収入金額の桁数が多すぎます。",
			},
			categoryId: {
				required: "収入カテゴリを選択してください。",
				min: "有効な収入カテゴリを選択してください。",
				max: "有効な収入カテゴリを選択してください。",
				invalid: "有効な収入カテゴリを選択してください。",
				maxLength: "カテゴリIDが長すぎます。",
			},
			date: {
				required: "日付を入力してください。",
				min: "過去の日付は入力できません。",
				max: "未来の日付は入力できません。",
				invalid: "有効な日付を入力してください。",
				maxLength: "日付の形式が正しくありません。",
			},
			description: {
				required: "説明を入力してください。",
				min: "説明が短すぎます。",
				max: "説明が長すぎます。",
				invalid: "有効な説明を入力してください。",
				maxLength: "説明は500文字以内で入力してください。",
			},
		},
		expense: {
			amount: {
				required: "支出金額を入力してください。",
				min: "支出金額は0より大きい値を入力してください。",
				max: "支出金額が上限を超えています。",
				invalid: "有効な支出金額を入力してください。",
				maxLength: "支出金額の桁数が多すぎます。",
			},
			categoryId: {
				required: "支出カテゴリを選択してください。",
				min: "有効な支出カテゴリを選択してください。",
				max: "有効な支出カテゴリを選択してください。",
				invalid: "有効な支出カテゴリを選択してください。",
				maxLength: "カテゴリIDが長すぎます。",
			},
			date: {
				required: "日付を入力してください。",
				min: "過去の日付は入力できません。",
				max: "未来の日付は入力できません。",
				invalid: "有効な日付を入力してください。",
				maxLength: "日付の形式が正しくありません。",
			},
			description: {
				required: "説明を入力してください。",
				min: "説明が短すぎます。",
				max: "説明が長すぎます。",
				invalid: "有効な説明を入力してください。",
				maxLength: "説明は500文字以内で入力してください。",
			},
		},
	} satisfies ValidationMessageMap;

	// 対応するメッセージを取得
	const transactionMessages = messageMap[transactionType];
	if (!transactionMessages) {
		return undefined;
	}

	const fieldMessages = transactionMessages[field];
	if (!fieldMessages) {
		return undefined;
	}

	return fieldMessages[errorType];
}

/**
 * バリデーションエラーのログ出力（開発環境のみ）
 *
 * 単一責任原則に従い、ログ出力のみを行う。
 * メッセージ生成は getValidationMessage に委譲する。
 *
 * @param transactionType - 取引タイプ（収入または支出）
 * @param field - エラーが発生したフィールド
 * @param message - ログに出力するエラーメッセージ
 *
 * @example
 * ```typescript
 * const message = getValidationMessage("income", "amount", "required");
 * if (message) {
 *   logValidationError("income", "amount", message);
 * }
 * ```
 */
export function logValidationError(
	transactionType: TransactionType,
	field: TransactionErrorField,
	message: string,
): void {
	// 開発環境でのみログ出力
	if (process.env.NODE_ENV === "development") {
		console.error(
			`[${transactionType}] Validation error - ${field}: ${message}`,
		);
	}
}
