/**
 * middleware.ts のテスト
 * requestId生成・ヘッダー設定・ログ出力機能を検証
 */

import { type NextRequest, NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateRequestId } from "./lib/utils/request-id";
import { config, middleware } from "./middleware";

// モジュールのモック
vi.mock("./lib/utils/request-id", () => ({
	generateRequestId: vi.fn(),
}));

vi.mock("next/server", () => ({
	NextResponse: {
		next: vi.fn(),
	},
	NextRequest: vi.fn(),
}));

describe("middleware", () => {
	const mockRequestId = "test-request-id-123";
	const mockGenerateRequestId = vi.mocked(generateRequestId);
	let consoleLogSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		vi.clearAllMocks();
		mockGenerateRequestId.mockReturnValue(mockRequestId);
		consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

		// NextResponse.next()のモック設定
		const mockHeaders = new Map<string, string>();
		const mockResponse = {
			headers: {
				set: vi.fn((key: string, value: string) => {
					mockHeaders.set(key, value);
				}),
				get: vi.fn((key: string) => mockHeaders.get(key)),
			},
		};
		vi.mocked(NextResponse.next).mockReturnValue(mockResponse as any);
	});

	afterEach(() => {
		consoleLogSpy.mockRestore();
		// NODE_ENVを元に戻す
		vi.unstubAllEnvs();
	});

	describe("requestId処理", () => {
		it("既存のX-Request-IDヘッダーがある場合はそれを使用する", () => {
			const existingRequestId = "existing-request-id";
			const mockRequest = {
				headers: {
					get: vi.fn((name: string) =>
						name === "X-Request-ID" ? existingRequestId : null,
					),
				},
				method: "GET",
				url: "http://localhost:3000/",
			} as unknown as NextRequest;

			const response = middleware(mockRequest);

			// generateRequestIdが呼ばれないことを確認
			expect(mockGenerateRequestId).not.toHaveBeenCalled();

			// レスポンスヘッダーに既存のrequestIdが設定されることを確認
			expect(response.headers.set).toHaveBeenCalledWith(
				"X-Request-ID",
				existingRequestId,
			);
			expect(response.headers.set).toHaveBeenCalledWith(
				"X-Saifuu-Request-ID",
				existingRequestId,
			);
		});

		it("X-Request-IDヘッダーがない場合は新規生成する", () => {
			const mockRequest = {
				headers: {
					get: vi.fn(() => null),
				},
				method: "GET",
				url: "http://localhost:3000/",
			} as unknown as NextRequest;

			const response = middleware(mockRequest);

			// generateRequestIdが呼ばれることを確認
			expect(mockGenerateRequestId).toHaveBeenCalledTimes(1);

			// レスポンスヘッダーに新規生成されたrequestIdが設定されることを確認
			expect(response.headers.set).toHaveBeenCalledWith(
				"X-Request-ID",
				mockRequestId,
			);
			expect(response.headers.set).toHaveBeenCalledWith(
				"X-Saifuu-Request-ID",
				mockRequestId,
			);
		});
	});

	describe("ログ出力", () => {
		it("開発環境ではリクエスト情報をログに出力する", () => {
			// NODE_ENVを開発環境に設定
			vi.stubEnv("NODE_ENV", "development");

			const mockRequest = {
				headers: {
					get: vi.fn(() => null),
				},
				method: "POST",
				url: "http://localhost:3000/api/test",
			} as unknown as NextRequest;

			middleware(mockRequest);

			// ログが出力されることを確認
			expect(consoleLogSpy).toHaveBeenCalledWith(
				`[MIDDLEWARE] POST http://localhost:3000/api/test - RequestID: ${mockRequestId}`,
			);
		});

		it("本番環境ではログを出力しない", () => {
			// NODE_ENVを本番環境に設定
			vi.stubEnv("NODE_ENV", "production");

			const mockRequest = {
				headers: {
					get: vi.fn(() => null),
				},
				method: "GET",
				url: "http://localhost:3000/",
			} as unknown as NextRequest;

			middleware(mockRequest);

			// ログが出力されないことを確認
			expect(consoleLogSpy).not.toHaveBeenCalled();
		});

		it("テスト環境ではログを出力しない", () => {
			// NODE_ENVをテスト環境に設定（デフォルト）
			vi.stubEnv("NODE_ENV", "test");

			const mockRequest = {
				headers: {
					get: vi.fn(() => null),
				},
				method: "GET",
				url: "http://localhost:3000/",
			} as unknown as NextRequest;

			middleware(mockRequest);

			// ログが出力されないことを確認
			expect(consoleLogSpy).not.toHaveBeenCalled();
		});
	});

	describe("レスポンス処理", () => {
		it("NextResponse.next()を呼び出して正しいレスポンスを返す", () => {
			const mockRequest = {
				headers: {
					get: vi.fn(() => null),
				},
				method: "GET",
				url: "http://localhost:3000/",
			} as unknown as NextRequest;

			const response = middleware(mockRequest);

			// NextResponse.next()が呼ばれることを確認
			expect(NextResponse.next).toHaveBeenCalledTimes(1);

			// レスポンスが正しく返されることを確認
			expect(response).toBeDefined();
			expect(response.headers.set).toBeDefined();
		});
	});
});

describe("middleware config", () => {
	it("正しいmatcher設定を持つ", () => {
		expect(config).toBeDefined();
		expect(config.matcher).toBeDefined();
		expect(Array.isArray(config.matcher)).toBe(true);
		expect(config.matcher).toHaveLength(1);
		expect(config.matcher[0]).toBe(
			"/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
		);
	});

	it("APIルート、静的ファイル、画像ファイルを除外する", () => {
		// Next.jsのmatcher設定はパスパターンを指定するもので、
		// 正規表現として直接使用するものではない
		const matcherPattern = config.matcher[0];

		// matcherパターンが正しいフォーマットであることを確認
		expect(matcherPattern).toContain("(?!");
		expect(matcherPattern).toContain("api");
		expect(matcherPattern).toContain("_next/static");
		expect(matcherPattern).toContain("_next/image");
		expect(matcherPattern).toContain("favicon.ico");
		expect(matcherPattern).toContain("svg|png|jpg|jpeg|gif|webp");
	});
});
