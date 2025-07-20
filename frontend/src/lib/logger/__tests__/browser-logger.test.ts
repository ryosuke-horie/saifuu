/**
 * ブラウザロガー統合テスト
 *
 * コア機能に焦点を当てた最適化版
 */

import type { MockInstance } from "vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	createMockLoggerConfig,
	setupBrowserMocks,
	setupConsoleSpy,
	setupFetchMock,
	setupTimers,
} from "../../../test-utils/logger-test-helpers";
import { BrowserLogger, createBrowserLogger } from "../browser-logger";
import { getDefaultConfig } from "../config";
import type { BrowserLoggerConfig } from "../types";

describe("BrowserLogger", () => {
	let logger: BrowserLogger;
	let config: BrowserLoggerConfig;
	let mockFetch: MockInstance;
	let consoleSpy: ReturnType<typeof setupConsoleSpy>;
	let timers: ReturnType<typeof setupTimers>;

	beforeEach(() => {
		vi.clearAllMocks();
		timers = setupTimers();
		consoleSpy = setupConsoleSpy();
		setupBrowserMocks();
		mockFetch = setupFetchMock();

		config = {
			...getDefaultConfig("development"),
			...createMockLoggerConfig(),
			flushInterval: 1000,
			bufferSize: 5,
			apiEndpoint: "/api/logs",
		} as BrowserLoggerConfig;
	});

	afterEach(() => {
		logger?.destroy();
		consoleSpy.restore();
		timers.cleanup();
	});

	describe("初期化", () => {
		it("正常に初期化される", () => {
			logger = new BrowserLogger(config);
			expect(logger).toBeDefined();
			expect(logger.getConfig()).toMatchObject(config);
		});

		it("設定を動的に更新できる", () => {
			logger = new BrowserLogger(config);
			logger.updateConfig({ level: "error" });
			expect(logger.getConfig().level).toBe("error");
		});

		it("ファクトリ関数が動作する", () => {
			const instance = createBrowserLogger(config);
			expect(instance).toBeInstanceOf(BrowserLogger);
			instance.destroy();
		});
	});

	describe("ログ出力", () => {
		beforeEach(() => {
			logger = new BrowserLogger(config);
		});

		it("ログレベルに応じてコンソール出力する", () => {
			// コンソール出力を有効化
			logger = new BrowserLogger({ ...config, enableConsole: true });

			logger.debug("debug message");
			logger.info("info message");
			logger.warn("warn message");
			logger.error("error message");

			expect(consoleSpy.consoleLogSpy).toHaveBeenCalledWith(
				expect.stringContaining("debug message"),
			);
			expect(consoleSpy.consoleInfoSpy).toHaveBeenCalledWith(
				expect.stringContaining("info message"),
			);
			expect(consoleSpy.consoleWarnSpy).toHaveBeenCalledWith(
				expect.stringContaining("warn message"),
			);
			expect(consoleSpy.consoleErrorSpy).toHaveBeenCalledWith(
				expect.stringContaining("error message"),
			);
		});

		it("設定レベル以下のログはスキップする", () => {
			// コンソール出力を有効化
			logger = new BrowserLogger({ ...config, enableConsole: true });
			// 初期化ログでconsole.infoが呼ばれるので、モックをクリア
			consoleSpy.consoleLogSpy.mockClear();
			consoleSpy.consoleInfoSpy.mockClear();
			consoleSpy.consoleWarnSpy.mockClear();
			consoleSpy.consoleErrorSpy.mockClear();

			logger.setLevel("warn");
			// setLevelもinfo()を呼ぶので再度クリア
			consoleSpy.consoleInfoSpy.mockClear();

			logger.debug("debug");
			logger.info("info");
			logger.warn("warn");
			logger.error("error");

			// debug/infoは出力されない
			expect(consoleSpy.consoleLogSpy).not.toHaveBeenCalled();
			expect(consoleSpy.consoleInfoSpy).not.toHaveBeenCalled();
			// warn/errorは出力される
			expect(consoleSpy.consoleWarnSpy).toHaveBeenCalled();
			expect(consoleSpy.consoleErrorSpy).toHaveBeenCalled();
		});
	});

	describe("バッファリング", () => {
		beforeEach(() => {
			logger = new BrowserLogger(config);
		});

		it("バッファサイズに達したら自動フラッシュ", async () => {
			// バッファサイズ（5）まで埋める
			for (let i = 0; i < 5; i++) {
				logger.info(`Message ${i}`);
			}

			await vi.waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

			const [url, options] = mockFetch.mock.calls[0];
			expect(url).toBe("/api/logs");
			const body = JSON.parse(options.body);
			expect(body.logs).toHaveLength(5);
		});

		it("インターバルで定期フラッシュ", async () => {
			logger.info("Test message");
			expect(mockFetch).not.toHaveBeenCalled();

			// インターバル時間経過
			await timers.advance(1000);
			await vi.waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
		});

		it("手動フラッシュが動作する", async () => {
			logger.info("Test");
			await logger.flush();
			expect(mockFetch).toHaveBeenCalledTimes(1);
		});

		it("バッファクリアが動作する", () => {
			// 初期化ログがあるためクリア
			logger.clear();

			logger.info("Test 1");
			logger.info("Test 2");
			expect(logger.getBufferSize()).toBe(2);

			logger.clear();
			expect(logger.getBufferSize()).toBe(0);
		});
	});

	describe("ユーザー・コンポーネント管理", () => {
		beforeEach(() => {
			logger = new BrowserLogger(config);
		});

		it("ユーザーIDが設定される", async () => {
			// 初期化ログをクリア
			logger.clear();

			logger.setUserId("user123");
			logger.info("Test");
			await logger.flush();

			const logs = JSON.parse(mockFetch.mock.calls[0][1].body).logs;
			// メタデータに含まれているかチェック
			expect(logs[0].meta?.userId).toBe("user123");
		});

		it("コンポーネント名が設定される", async () => {
			// 初期化ログをクリア
			logger.clear();

			logger.setComponent("Header");
			logger.info("Test");
			await logger.flush();

			const logs = JSON.parse(mockFetch.mock.calls[0][1].body).logs;
			// メタデータに含まれているかチェック
			expect(logs[0].meta?.component).toBe("Header");
		});

		it("メタデータが含まれる", async () => {
			// 初期化ログをクリア
			logger.clear();

			logger.info("Test", { action: "click", element: "button" });
			await logger.flush();

			const logs = JSON.parse(mockFetch.mock.calls[0][1].body).logs;
			expect(logs[0].meta).toMatchObject({
				action: "click",
				element: "button",
			});
		});
	});

	describe("エラーハンドリング", () => {
		beforeEach(() => {
			logger = new BrowserLogger(config);
		});

		it("ネットワークエラー時にリトライする", async () => {
			// 初期化ログをクリア
			logger.clear();
			mockFetch.mockClear();

			mockFetch.mockRejectedValueOnce(new Error("Network error"));
			mockFetch.mockResolvedValueOnce({ ok: true });

			logger.error("Test error");
			await logger.flush();

			// 初回失敗
			expect(mockFetch).toHaveBeenCalledTimes(1);

			// リトライ（1秒後）
			await timers.advance(1000);
			await vi.waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
		});

		it("最大リトライ回数後にログを破棄", async () => {
			// 初期化ログをクリア
			logger.clear();
			mockFetch.mockClear();

			mockFetch.mockRejectedValue(new Error("Persistent error"));

			logger.error("Test");

			// 初回試行 + リトライ
			for (let i = 0; i <= config.maxRetries; i++) {
				await logger.flush();
				if (i < config.maxRetries) {
					await timers.advance(1000);
				}
			}

			expect(mockFetch).toHaveBeenCalledTimes(config.maxRetries + 1);
			expect(logger.getBufferSize()).toBe(0); // ログが破棄される
		});
	});

	describe("ライフサイクル", () => {
		it("destroyでリソースが解放される", () => {
			logger = new BrowserLogger(config);
			const removeEventListenersSpy = vi.spyOn(logger, "removeEventListeners");

			logger.info("test");
			logger.destroy();

			expect(removeEventListenersSpy).toHaveBeenCalled();

			// destroyedロガーは何もしない
			logger.info("after destroy");
			expect(logger.getBufferSize()).toBe(0);
		});

		it("セッション管理が動作する", () => {
			// コンソール出力を有効化
			logger = new BrowserLogger({ ...config, enableConsole: true });
			// 初期化ログをクリア
			consoleSpy.consoleInfoSpy.mockClear();

			const sessionId = logger.startSession();
			expect(sessionId).toBeTruthy();

			logger.endSession();
			// エンドセッションログが記録される
			expect(consoleSpy.consoleInfoSpy).toHaveBeenCalledWith(
				expect.stringContaining("Session ended"),
				expect.any(Object),
			);
		});
	});
});
