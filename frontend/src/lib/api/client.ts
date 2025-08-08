/**
 * API クライアント
 *
 * 統一されたHTTPリクエスト処理とエラーハンドリングを提供する
 * フェッチAPIをベースとしたモダンなクライアント実装
 */

import { withApiLogging } from "../logger/api-integration";
import { apiConfig, buildUrl } from "./config";
import {
	ApiError,
	createApiErrorFromResponse,
	createNetworkError,
	isRetryableError,
} from "./errors";
import type { ApiResponse, RequestOptions, RetryConfig } from "./types";

/**
 * リクエストの設定オプション
 */
interface ClientRequestOptions extends RequestOptions {
	/** リトライ設定 */
	retry?: Partial<RetryConfig>;
	/** レスポンスの型チェックを無効にする */
	skipTypeCheck?: boolean;
}

/**
 * APIクライアントクラス
 *
 * シングルトンパターンで実装し、アプリケーション全体で
 * 統一されたAPI通信を提供する
 */
class ApiClient {
	private readonly baseUrl: string;
	private readonly defaultTimeout: number;
	private readonly defaultRetryConfig: RetryConfig;

	constructor() {
		this.baseUrl = apiConfig.baseUrl;
		this.defaultTimeout = apiConfig.timeout;
		this.defaultRetryConfig = {
			maxRetries: apiConfig.maxRetries,
			retryDelay: apiConfig.retryDelay,
			retryCondition: (error: unknown) => {
				if (error instanceof ApiError) {
					return isRetryableError(error);
				}
				return false;
			},
		};
	}

	/**
	 * GETリクエストを実行する
	 */
	async get<T = unknown>(
		endpoint: string,
		options: Omit<ClientRequestOptions, "method" | "body"> = {},
	): Promise<T> {
		return this.request<T>(endpoint, { ...options, method: "GET" });
	}

	/**
	 * POSTリクエストを実行する
	 */
	async post<T = unknown>(
		endpoint: string,
		body?: unknown,
		options: Omit<ClientRequestOptions, "method"> = {},
	): Promise<T> {
		return this.request<T>(endpoint, { ...options, method: "POST", body });
	}

	/**
	 * PUTリクエストを実行する
	 */
	async put<T = unknown>(
		endpoint: string,
		body?: unknown,
		options: Omit<ClientRequestOptions, "method"> = {},
	): Promise<T> {
		return this.request<T>(endpoint, { ...options, method: "PUT", body });
	}

	/**
	 * DELETEリクエストを実行する
	 */
	async delete<T = unknown>(
		endpoint: string,
		options: Omit<ClientRequestOptions, "method" | "body"> = {},
	): Promise<T> {
		return this.request<T>(endpoint, { ...options, method: "DELETE" });
	}

	/**
	 * 汎用リクエストメソッド
	 *
	 * すべてのHTTPメソッドに対応し、リトライ・タイムアウト・
	 * エラーハンドリングを統一的に処理する
	 */
	private async request<T = unknown>(
		endpoint: string,
		options: ClientRequestOptions = {},
	): Promise<T> {
		const {
			method = "GET",
			headers = {},
			body,
			timeout = this.defaultTimeout,
			retry = {},
			signal,
			skipTypeCheck = false,
		} = options;

		// リトライ設定をマージ
		const retryConfig: RetryConfig = {
			...this.defaultRetryConfig,
			...retry,
		};

		// リクエストヘッダーを準備
		const requestHeaders = this.buildHeaders(headers, body);

		// リクエストボディを準備
		const requestBody = this.buildBody(body);

		// AbortControllerでタイムアウトを制御
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), timeout);

		// 外部からのシグナルも考慮
		if (signal) {
			signal.addEventListener("abort", () => controller.abort());
		}

		let lastError: ApiError | undefined;

		// リトライループ
		for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
			try {
				// URLを構築
				const url = buildUrl(endpoint);

				// フェッチリクエストを実行
				const response = await fetch(url, {
					method,
					headers: requestHeaders,
					body: requestBody,
					signal: controller.signal,
				});

				// タイムアウトをクリア
				clearTimeout(timeoutId);

				// レスポンスを処理
				return await this.handleResponse<T>(response, skipTypeCheck);
			} catch (error) {
				// タイムアウトをクリア
				clearTimeout(timeoutId);

				// エラーを適切なApiErrorに変換
				const apiError = this.handleRequestError(error, endpoint);
				lastError = apiError;

				// リトライ判定
				const shouldRetry =
					attempt < retryConfig.maxRetries &&
					retryConfig.retryCondition?.(apiError);

				if (!shouldRetry) {
					throw apiError;
				}

				// リトライ前の待機
				if (retryConfig.retryDelay > 0) {
					await this.delay(retryConfig.retryDelay * 2 ** attempt); // 指数バックオフ
				}
			}
		}

		// リトライが全て失敗した場合
		throw lastError || new ApiError("unknown", "リクエストが失敗しました");
	}

	/**
	 * リクエストヘッダーを構築する
	 */
	private buildHeaders(
		customHeaders: Record<string, string>,
		body?: unknown,
	): Record<string, string> {
		const headers: Record<string, string> = {
			...customHeaders,
		};

		// Content-Typeを自動設定
		if (body !== undefined && !headers["Content-Type"]) {
			if (body instanceof FormData) {
				// FormDataの場合はContent-Typeを設定しない（ブラウザが自動設定）
			} else {
				headers["Content-Type"] = "application/json";
			}
		}

		// Accept ヘッダーを設定
		if (!headers.Accept) {
			headers.Accept = "application/json";
		}

		return headers;
	}

	/**
	 * リクエストボディを構築する
	 */
	private buildBody(body?: unknown): BodyInit | undefined {
		if (body === undefined || body === null) {
			return undefined;
		}

		if (body instanceof FormData) {
			return body;
		}

		if (typeof body === "string") {
			return body;
		}

		// オブジェクトの場合はJSONに変換
		try {
			return JSON.stringify(body);
		} catch (error) {
			throw new ApiError(
				"validation",
				"リクエストボディをJSONに変換できませんでした",
				undefined,
				undefined,
				error instanceof Error ? error : new Error("JSON変換エラー"),
			);
		}
	}

	/**
	 * レスポンスを処理する
	 */
	private async handleResponse<T>(
		response: Response,
		skipTypeCheck: boolean,
	): Promise<T> {
		// HTTPエラーステータスの場合
		if (!response.ok) {
			throw await createApiErrorFromResponse(response);
		}

		// レスポンスボディを解析
		const contentType = response.headers.get("content-type");

		if (contentType?.includes("application/json")) {
			try {
				const data = await response.json();

				// 型チェックが有効で、ApiResponseの形式の場合
				if (!skipTypeCheck && this.isApiResponseFormat(data)) {
					if (data.error) {
						throw new ApiError("server", data.error);
					}
					return (data.data ?? data) as T;
				}

				return data as T;
			} catch (error) {
				if (error instanceof ApiError) {
					throw error;
				}
				throw new ApiError(
					"server",
					"レスポンスの解析に失敗しました",
					response.status,
					undefined,
					error instanceof Error ? error : new Error("JSON解析エラー"),
				);
			}
		}

		// JSONでない場合はテキストとして処理
		try {
			const text = await response.text();
			return text as T;
		} catch (error) {
			throw new ApiError(
				"server",
				"レスポンスの読み取りに失敗しました",
				response.status,
				undefined,
				error instanceof Error ? error : new Error("テキスト読み取りエラー"),
			);
		}
	}

	/**
	 * ApiResponse形式かどうかを判定する
	 */
	private isApiResponseFormat(data: unknown): data is ApiResponse {
		return (
			typeof data === "object" &&
			data !== null &&
			("data" in data || "error" in data || "message" in data)
		);
	}

	/**
	 * リクエストエラーを処理する
	 */
	private handleRequestError(error: unknown, _endpoint: string): ApiError {
		if (error instanceof ApiError) {
			return error;
		}

		if (error instanceof Error) {
			// AbortErrorの場合はタイムアウトとして扱う
			if (error.name === "AbortError") {
				return new ApiError(
					"timeout",
					"リクエストがタイムアウトしました",
					undefined,
					undefined,
					error,
				);
			}

			// その他のエラーはネットワークエラーとして扱う
			return createNetworkError(error);
		}

		// 予期しないエラーの場合
		return new ApiError("unknown", "予期しないエラーが発生しました");
	}

	/**
	 * 指定したミリ秒待機する
	 */
	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	/**
	 * ヘルスチェック用のメソッド
	 * APIサーバーの接続状態を確認する
	 */
	async healthCheck(): Promise<boolean> {
		try {
			// ヘルスチェック用のエンドポイントがあれば使用
			// なければ軽量なエンドポイントで代用
			await this.get("/health", {
				timeout: 5000,
				retry: { maxRetries: 1 },
			});
			return true;
		} catch {
			return false;
		}
	}
}

/**
 * APIクライアントのシングルトンインスタンス
 * ロガー機能を統合したAPIクライアント
 */
const baseApiClient = new ApiClient();
const loggedApiClient = withApiLogging(baseApiClient);

import {
	logTransactionError,
	TransactionApiError,
	type TransactionOperation,
} from "./transaction-errors";
// transactionsサービスを追加（ページネーション対応）
import type {
	GetTransactionsQuery,
	PaginationResponse,
	Transaction,
} from "./types";

interface TransactionsListParams extends GetTransactionsQuery {
	page?: number;
	limit?: number;
	sort?: "date" | "amount";
	order?: "asc" | "desc";
}

interface TransactionsListResponse {
	data: Transaction[];
	pagination?: PaginationResponse;
}

interface TransactionCreateParams {
	type: "income" | "expense";
	amount: number;
	date: string;
	description?: string | null;
	categoryId?: string | null;
}

interface TransactionUpdateParams {
	amount: number;
	date: string;
	description?: string | null;
	categoryId?: string | null;
}

/**
 * 取引API操作の統一エラーハンドリング
 *
 * API操作中に発生したエラーを適切な形式に変換し、ログ出力を行う。
 * Matt Pocockの方針に従い、型推論を活用して型安全なエラー処理を実現。
 *
 * 設計意図:
 * - ApiErrorの場合はTransactionApiErrorでラップして操作コンテキストを追加
 * - 既にTransactionApiErrorの場合は変更せずそのまま再スロー
 * - その他のエラーは型を変更せずそのまま再スロー
 * - すべてのケースでログ出力を統一的に処理
 *
 * @param operation - 実行中の取引操作（create/update/delete/list）
 * @param context - ログ出力用のコンテキスト情報
 * @param error - 処理対象のエラーオブジェクト
 * @throws 適切に変換されたエラーまたは元のエラー
 */
export function handleTransactionApiError(
	operation: TransactionOperation,
	context: string,
	error: unknown,
): never {
	// 既にTransactionApiErrorの場合はそのまま再スロー（変換しない）
	if (error instanceof TransactionApiError) {
		throw error;
	}

	// ApiErrorの場合はTransactionApiErrorに変換
	if (error instanceof ApiError) {
		const transactionError = new TransactionApiError(
			operation,
			error.type,
			error.message,
			error.statusCode,
			error.response,
			error, // originalErrorとして元のApiErrorを渡す
		);
		// 変換後のエラーをログ出力
		logTransactionError(transactionError, context);
		throw transactionError;
	}

	// その他のエラー（Error、string、null、undefined等）はそのまま再スロー
	throw error;
}

export const apiClient = Object.assign(loggedApiClient, {
	transactions: {
		list: async (
			params?: TransactionsListParams,
		): Promise<TransactionsListResponse> => {
			try {
				const endpoint = addQueryParams(
					"/transactions",
					params as Record<string, unknown>,
				);
				// skipTypeCheckをtrueにして、ApiResponseのラップ処理を回避
				const response = await loggedApiClient.get<any>(endpoint, {
					skipTypeCheck: true,
				});

				// レスポンスの形式を正規化
				// テストのモックレスポンスは既に { data: [], pagination: {...} } の形式で返ってくる
				// APIが直接配列を返す場合は { data: [...] } に変換
				if (response && typeof response === "object") {
					// 既に正しい形式の場合はそのまま返す
					if ("data" in response) {
						return response as TransactionsListResponse;
					}
					// 配列の場合はdataでラップ
					if (Array.isArray(response)) {
						return { data: response };
					}
				}

				// フォールバック
				return { data: [] };
			} catch (error) {
				// クエリパラメータを含むコンテキストでエラーハンドリング
				const context =
					params?.page || params?.limit
						? `transactions.list:page=${params.page || 1},limit=${params.limit || "default"}`
						: "transactions.list";
				handleTransactionApiError("list", context, error);
			}
		},
		create: async (params: TransactionCreateParams): Promise<Transaction> => {
			try {
				return await loggedApiClient.post<Transaction>("/transactions", params);
			} catch (error) {
				handleTransactionApiError("create", "transactions.create", error);
			}
		},
		update: async (
			id: string,
			params: TransactionUpdateParams,
		): Promise<Transaction> => {
			try {
				return await loggedApiClient.put<Transaction>(
					`/transactions/${id}`,
					params,
				);
			} catch (error) {
				handleTransactionApiError("update", `transactions.update:${id}`, error);
			}
		},
		delete: async (id: string): Promise<void> => {
			try {
				await loggedApiClient.delete<void>(`/transactions/${id}`);
			} catch (error) {
				handleTransactionApiError("delete", `transactions.delete:${id}`, error);
			}
		},
	},
});

/**
 * クエリパラメーターをURLに追加するユーティリティ
 */
export function addQueryParams(
	endpoint: string,
	params?: Record<string, unknown>,
): string {
	if (!params || Object.keys(params).length === 0) {
		return endpoint;
	}

	const url = new URL(endpoint, "http://dummy-base.com");

	Object.entries(params).forEach(([key, value]) => {
		if (value !== undefined && value !== null) {
			url.searchParams.append(key, String(value));
		}
	});

	return url.pathname + url.search;
}

/**
 * リクエストをキャンセルするためのAbortControllerを作成
 */
export function createCancelToken(): {
	signal: AbortSignal;
	cancel: () => void;
} {
	const controller = new AbortController();
	return {
		signal: controller.signal,
		cancel: () => controller.abort(),
	};
}
