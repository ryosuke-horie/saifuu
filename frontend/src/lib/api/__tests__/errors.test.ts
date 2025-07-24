/**
 * APIエラーハンドリングのテスト
 */

import { describe, expect, it, vi } from "vitest";
import {
	ApiError,
	createApiErrorFromResponse,
	createNetworkError,
	getValidationErrors,
	handleApiError,
	isRetryableError,
	logApiError,
} from "../errors";

describe("ApiError", () => {
	it("基本的なエラーを正しく作成する", () => {
		const error = new ApiError("validation", "テストエラー", 400);

		expect(error.type).toBe("validation");
		expect(error.message).toBe("テストエラー");
		expect(error.statusCode).toBe(400);
		expect(error.name).toBe("ApiError");
	});

	it("エラー種別を正しく判定する", () => {
		const error = new ApiError("network", "ネットワークエラー");

		expect(error.isType("network")).toBe(true);
		expect(error.isType("validation")).toBe(false);
	});

	it("ステータスコードを正しく判定する", () => {
		const error = new ApiError("server", "サーバーエラー", 500);

		expect(error.isStatusCode(500)).toBe(true);
		expect(error.isStatusCode(404)).toBe(false);
	});
});

describe("createApiErrorFromResponse", () => {
	it("JSONエラーレスポンスを正しく処理する", async () => {
		const mockResponse = {
			ok: false,
			status: 400,
			headers: {
				get: vi.fn().mockReturnValue("application/json"),
			},
			json: vi.fn().mockResolvedValue({
				error: "バリデーションエラー",
				details: "入力値が無効です",
			}),
		} as unknown as Response;

		const error = await createApiErrorFromResponse(mockResponse);

		expect(error.type).toBe("validation");
		expect(error.statusCode).toBe(400);
		expect(error.message).toContain("入力内容に問題があります");
	});

	it("テキストレスポンスを正しく処理する", async () => {
		const mockResponse = {
			ok: false,
			status: 500,
			headers: {
				get: vi.fn().mockReturnValue("text/plain"),
			},
			text: vi.fn().mockResolvedValue("Internal Server Error"),
		} as unknown as Response;

		const error = await createApiErrorFromResponse(mockResponse);

		expect(error.type).toBe("server");
		expect(error.statusCode).toBe(500);
	});

	it("JSON解析エラーを適切に処理する", async () => {
		const mockResponse = {
			ok: false,
			status: 400,
			headers: {
				get: vi.fn().mockReturnValue("application/json"),
			},
			json: vi.fn().mockRejectedValue(new Error("JSON解析エラー")),
		} as unknown as Response;

		const error = await createApiErrorFromResponse(mockResponse);

		expect(error.type).toBe("validation");
		expect(error.statusCode).toBe(400);
	});

	it("異なるHTTPステータスコードを正しく分類する", async () => {
		const testCases = [
			{ status: 401, expectedType: "unauthorized" },
			{ status: 403, expectedType: "forbidden" },
			{ status: 404, expectedType: "notFound" },
			{ status: 409, expectedType: "conflict" },
			{ status: 500, expectedType: "server" },
		];

		for (const { status, expectedType } of testCases) {
			const mockResponse = {
				ok: false,
				status,
				headers: {
					get: vi.fn().mockReturnValue("application/json"),
				},
				json: vi.fn().mockResolvedValue({ error: "テストエラー" }),
			} as unknown as Response;

			const error = await createApiErrorFromResponse(mockResponse);
			expect(error.type).toBe(expectedType);
		}
	});
});

describe("createNetworkError", () => {
	it("通常のエラーをネットワークエラーに変換する", () => {
		const originalError = new Error("fetch failed");
		const error = createNetworkError(originalError);

		expect(error.type).toBe("network");
		expect(error.message).toContain("サーバーに接続できませんでした");
		expect(error.originalError).toBe(originalError);
	});

	it("AbortErrorをタイムアウトエラーに変換する", () => {
		const originalError = new Error("AbortError");
		originalError.name = "AbortError";
		const error = createNetworkError(originalError);

		expect(error.type).toBe("timeout");
		expect(error.message).toContain("リクエストがタイムアウトしました");
	});

	it("timeoutを含むエラーをタイムアウトエラーに変換する", () => {
		const originalError = new Error("Request timeout");
		const error = createNetworkError(originalError);

		expect(error.type).toBe("timeout");
		expect(error.message).toContain("リクエストがタイムアウトしました");
	});
});

describe("handleApiError", () => {
	it("ApiErrorをそのまま返す", () => {
		const originalError = new ApiError("validation", "テストエラー");
		const error = handleApiError(originalError);

		expect(error).toBe(originalError);
	});

	it("通常のErrorをApiErrorに変換する", () => {
		const originalError = new Error("テストエラー");
		const error = handleApiError(originalError);

		expect(error).toBeInstanceOf(ApiError);
		expect(error.type).toBe("network");
	});

	it("unknown型をApiErrorに変換する", () => {
		const error = handleApiError("文字列エラー");

		expect(error).toBeInstanceOf(ApiError);
		expect(error.type).toBe("unknown");
	});
});

describe("isRetryableError", () => {
	it("ネットワークエラーはリトライ可能", () => {
		const error = new ApiError("network", "ネットワークエラー");
		expect(isRetryableError(error)).toBe(true);
	});

	it("タイムアウトエラーはリトライ可能", () => {
		const error = new ApiError("timeout", "タイムアウト");
		expect(isRetryableError(error)).toBe(true);
	});

	it("502, 503, 504はリトライ可能", () => {
		const retryCodes = [502, 503, 504];

		for (const code of retryCodes) {
			const error = new ApiError("server", "サーバーエラー", code);
			expect(isRetryableError(error)).toBe(true);
		}
	});

	it("バリデーションエラーはリトライ不可", () => {
		const error = new ApiError("validation", "バリデーションエラー", 400);
		expect(isRetryableError(error)).toBe(false);
	});

	it("認証エラーはリトライ不可", () => {
		const error = new ApiError("unauthorized", "認証エラー", 401);
		expect(isRetryableError(error)).toBe(false);
	});
});

describe("getValidationErrors", () => {
	it("バリデーションエラーの詳細を正しく取得する", () => {
		const error = new ApiError("validation", "バリデーションエラー", 400, {
			error: "Validation failed",
			fields: {
				name: ["名前は必須です"],
				amount: ["金額は0以上である必要があります"],
			},
		});

		const validationErrors = getValidationErrors(error);

		expect(validationErrors).toEqual({
			name: ["名前は必須です"],
			amount: ["金額は0以上である必要があります"],
		});
	});

	it("バリデーションエラー以外ではnullを返す", () => {
		const error = new ApiError("network", "ネットワークエラー");
		const validationErrors = getValidationErrors(error);

		expect(validationErrors).toBeNull();
	});

	it("fieldsがない場合はnullを返す", () => {
		const error = new ApiError("validation", "バリデーションエラー", 400, {
			error: "Validation failed",
		});

		const validationErrors = getValidationErrors(error);

		expect(validationErrors).toBeNull();
	});
});

describe("logApiError", () => {
	it.each([
		["development", true],
		["production", false],
	])("%s環境では適切なログレベルで出力する", (env, isDetailed) => {
		vi.stubEnv("NODE_ENV", env);

		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		const error = new ApiError("network", "ネットワークエラー");
		logApiError(error, "テストコンテキスト");

		if (isDetailed) {
			expect(consoleSpy).toHaveBeenCalledWith(
				"[テストコンテキスト]",
				error.getDebugInfo(),
			);
		} else {
			expect(consoleSpy).toHaveBeenCalledWith("[テストコンテキスト]", {
				type: "network",
				statusCode: undefined,
				message: "ネットワークエラー",
			});
		}

		vi.unstubAllEnvs();
		consoleSpy.mockRestore();
	});
});
