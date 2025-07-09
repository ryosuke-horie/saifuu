/**
 * API統合とrequestId相関機能
 *
 * 既存のAPIクライアントと非侵襲的に統合し、
 * requestIdの自動生成・追跡とパフォーマンス計測を提供
 */

import { useCallback } from "react";
import { generateRequestId } from "../utils/request-id";
import { useLogger } from "./hooks";
import type { FrontendLogMeta } from "./types";

/**
 * パフォーマンス計測用ヘルパー
 */
export function createPerformanceMarker() {
	const startTime = performance.now();

	return {
		end: () => performance.now() - startTime,
		duration: () => performance.now() - startTime,
	};
}

/**
 * APIログ機能を提供するReactフック
 */
export function useApiLogger() {
	const logger = useLogger();

	const logApiCall = useCallback(
		(endpoint: string, method: string, meta?: FrontendLogMeta) => {
			logger.apiCall(endpoint, method, meta);
		},
		[logger],
	);

	const logApiSuccess = useCallback(
		(endpoint: string, status: number, meta?: FrontendLogMeta) => {
			logger.info(`API Success: ${endpoint}`, {
				...meta,
				status,
				apiSuccess: true,
			});
		},
		[logger],
	);

	const logApiError = useCallback(
		(endpoint: string, error: unknown, meta?: FrontendLogMeta) => {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			logger.error(`API Error: ${endpoint}`, {
				...meta,
				error: errorMessage,
				stack: error instanceof Error ? error.stack : undefined,
				apiError: true,
			});
		},
		[logger],
	);

	return {
		logApiCall,
		logApiSuccess,
		logApiError,
	};
}

/**
 * フェッチリクエストの拡張タイプ
 * requestIdとパフォーマンス計測情報を含む
 */
interface EnhancedRequestInit extends RequestInit {
	metadata?: {
		requestId: string;
		startTime: number;
		endpoint: string;
	};
}

/**
 * フェッチリクエストにロガー機能を追加する拡張関数
 * 既存のfetch関数をラップして、requestIdの自動追加と
 * パフォーマンス計測を行う
 */
export function enhanceRequestWithLogging(
	originalFetch: typeof fetch,
): typeof fetch {
	return async function enhancedFetch(
		input: RequestInfo | URL,
		init?: RequestInit,
	): Promise<Response> {
		// requestIdとパフォーマンス計測の準備
		const requestId = generateRequestId();
		const marker = createPerformanceMarker();

		// エンドポイントの取得
		const endpoint = typeof input === "string" ? input : input.toString();

		// リクエストヘッダーにrequestIdを追加
		const enhancedInit: EnhancedRequestInit = {
			...init,
			headers: {
				...init?.headers,
				"X-Request-ID": requestId,
			},
			metadata: {
				requestId,
				startTime: performance.now(),
				endpoint,
			},
		};

		try {
			const response = await originalFetch(input, enhancedInit);

			// レスポンスにパフォーマンス情報を追加
			Object.defineProperty(response, "__performance", {
				value: {
					duration: marker.duration(),
					requestId,
					endpoint,
				},
				writable: false,
				enumerable: false,
			});

			return response;
		} catch (error) {
			// エラー時にもパフォーマンス情報を含める
			if (error instanceof Error) {
				Object.defineProperty(error, "__performance", {
					value: {
						duration: marker.duration(),
						requestId,
						endpoint,
					},
					writable: false,
					enumerable: false,
				});
			}
			throw error;
		}
	};
}

/**
 * APIクライアント拡張のためのミドルウェア関数
 * 既存のAPIクライアントに対して非侵襲的にロガー機能を追加
 */
export function createApiClientWithLogging() {
	// グローバルfetchを拡張
	const originalFetch = globalThis.fetch;

	if (!originalFetch) {
		throw new Error("fetch is not available");
	}

	// 拡張されたfetchでグローバルfetchを置き換え
	globalThis.fetch = enhanceRequestWithLogging(originalFetch);

	// 元のfetchを復元する関数を返す
	return {
		restore: () => {
			globalThis.fetch = originalFetch;
		},
	};
}

/**
 * APIレスポンスからパフォーマンス情報を取得
 */
export function getResponsePerformance(response: Response): {
	duration: number;
	requestId: string;
	endpoint: string;
} | null {
	const performance = (response as any).__performance;
	return performance || null;
}

/**
 * APIエラーからパフォーマンス情報を取得
 */
export function getErrorPerformance(error: Error): {
	duration: number;
	requestId: string;
	endpoint: string;
} | null {
	const performance = (error as any).__performance;
	return performance || null;
}

/**
 * 既存のAPIクライアントと統合するためのラッパー
 * フェッチベースのAPIクライアントに対してロガー機能を追加
 */
export function withApiLogging<
	T extends { get: Function; post: Function; put: Function; delete: Function },
>(client: T): T {
	// APIクライアントのメソッドをラップ
	const originalGet = client.get.bind(client);
	const originalPost = client.post.bind(client);
	const originalPut = client.put.bind(client);
	const originalDelete = client.delete.bind(client);

	return {
		...client,
		get: async (endpoint: string, options?: any) => {
			const marker = createPerformanceMarker();
			const requestId = generateRequestId();

			try {
				const result = await originalGet(endpoint, {
					...options,
					headers: {
						...options?.headers,
						"X-Request-ID": requestId,
					},
				});

				// 成功ログ（簡易版）
				console.log("[FRONTEND]", `API call: GET ${endpoint}`, {
					requestId,
					duration: marker.duration(),
					apiCall: true,
					method: "GET",
					endpoint,
				});

				return result;
			} catch (error) {
				// エラーログ（簡易版）
				console.error("[FRONTEND]", `API Error: GET ${endpoint}`, {
					requestId,
					duration: marker.duration(),
					error,
					apiError: true,
					method: "GET",
					endpoint,
				});
				throw error;
			}
		},
		post: async (endpoint: string, body?: any, options?: any) => {
			const marker = createPerformanceMarker();
			const requestId = generateRequestId();

			try {
				const result = await originalPost(endpoint, body, {
					...options,
					headers: {
						...options?.headers,
						"X-Request-ID": requestId,
					},
				});

				console.log("[FRONTEND]", `API call: POST ${endpoint}`, {
					requestId,
					duration: marker.duration(),
					apiCall: true,
					method: "POST",
					endpoint,
				});

				return result;
			} catch (error) {
				console.error("[FRONTEND]", `API Error: POST ${endpoint}`, {
					requestId,
					duration: marker.duration(),
					error,
					apiError: true,
					method: "POST",
					endpoint,
				});
				throw error;
			}
		},
		put: async (endpoint: string, body?: any, options?: any) => {
			const marker = createPerformanceMarker();
			const requestId = generateRequestId();

			try {
				const result = await originalPut(endpoint, body, {
					...options,
					headers: {
						...options?.headers,
						"X-Request-ID": requestId,
					},
				});

				console.log("[FRONTEND]", `API call: PUT ${endpoint}`, {
					requestId,
					duration: marker.duration(),
					apiCall: true,
					method: "PUT",
					endpoint,
				});

				return result;
			} catch (error) {
				console.error("[FRONTEND]", `API Error: PUT ${endpoint}`, {
					requestId,
					duration: marker.duration(),
					error,
					apiError: true,
					method: "PUT",
					endpoint,
				});
				throw error;
			}
		},
		delete: async (endpoint: string, options?: any) => {
			const marker = createPerformanceMarker();
			const requestId = generateRequestId();

			try {
				const result = await originalDelete(endpoint, {
					...options,
					headers: {
						...options?.headers,
						"X-Request-ID": requestId,
					},
				});

				console.log("[FRONTEND]", `API call: DELETE ${endpoint}`, {
					requestId,
					duration: marker.duration(),
					apiCall: true,
					method: "DELETE",
					endpoint,
				});

				return result;
			} catch (error) {
				console.error("[FRONTEND]", `API Error: DELETE ${endpoint}`, {
					requestId,
					duration: marker.duration(),
					error,
					apiError: true,
					method: "DELETE",
					endpoint,
				});
				throw error;
			}
		},
	};
}
