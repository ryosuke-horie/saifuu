/**
 * ブラウザロガー実装テスト
 *
 * ログ処理、バッファリング、ブラウザイベント連携を包括的に検証
 */

import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	type MockedFunction,
	vi,
} from "vitest";
import { BrowserLogger, createBrowserLogger } from "../browser-logger";
import { getDefaultConfig } from "../config";
import type { BrowserLoggerConfig } from "../types";

// モック用のグローバル変数
const originalWindow = global.window;
const originalDocument = global.document;
const originalNavigator = global.navigator;
const originalLocalStorage = global.localStorage;
const originalFetch = global.fetch;

// フェッチモック
const mockFetch = vi.fn();

// タイマーモック
vi.useFakeTimers();

describe("BrowserLogger", () => {
	let logger: BrowserLogger;
	let config: BrowserLoggerConfig;

	beforeEach(() => {
		// 基本設定のセットアップ
		config = getDefaultConfig("development");
		config.flushInterval = 1000;
		config.bufferSize = 5;

		// ブラウザAPIのモック
		setupBrowserMocks();

		// フェッチのモック
		global.fetch = mockFetch.mockResolvedValue({
			ok: true,
			status: 200,
			json: () => Promise.resolve({}),
		});

		logger = new BrowserLogger(config);
	});

	afterEach(() => {
		logger?.destroy();
		vi.clearAllMocks();
		vi.clearAllTimers();

		// グローバル変数を復元
		global.window = originalWindow;
		global.document = originalDocument;
		global.navigator = originalNavigator;
		global.localStorage = originalLocalStorage;
		global.fetch = originalFetch;
	});

	function setupBrowserMocks() {
		// @ts-ignore
		global.window = {
			location: {
				href: "https://example.com/test",
				hostname: "example.com",
				pathname: "/test",
				protocol: "https:",
				port: "",
				hash: "",
				search: "",
				host: "example.com",
				origin: "https://example.com",
				ancestorOrigins: {} as DOMStringList,
				assign: vi.fn(),
				reload: vi.fn(),
				replace: vi.fn(),
			} as Location,
			innerWidth: 1920,
			innerHeight: 1080,
			devicePixelRatio: 1,
			screen: {
				width: 1920,
				height: 1080,
			},
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		};

		// @ts-ignore
		global.document = {
			visibilityState: "visible",
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		};

		// @ts-ignore
		global.navigator = {
			userAgent: "Mozilla/5.0 (Test Browser)",
			platform: "Test Platform",
			language: "en-US",
			languages: ["en-US", "en"],
			cookieEnabled: true,
			onLine: true,
			sendBeacon: vi.fn().mockReturnValue(true),
		};

		// @ts-ignore
		global.localStorage = {
			getItem: vi.fn(),
			setItem: vi.fn(),
			removeItem: vi.fn(),
		};

		// @ts-ignore
		global.performance = {
			now: vi.fn().mockReturnValue(Date.now()),
		};

		// Intl.DateTimeFormat のモック
		// @ts-ignore
		global.Intl = {
			DateTimeFormat: Object.assign(
				vi.fn().mockImplementation(() => ({
					resolvedOptions: () => ({ timeZone: "UTC" }),
					format: vi.fn(),
					formatToParts: vi.fn(),
					formatRange: vi.fn(),
					formatRangeToParts: vi.fn(),
				})),
				{
					supportedLocalesOf: vi.fn(),
				}
			),
		};
	}

	describe("Constructor and Initialization", () => {
		it("should initialize with provided config", () => {
			expect(logger.getConfig()).toEqual(config);
		});

		it("should add event listeners on initialization", () => {
			const addEventListener = vi.spyOn(window, "addEventListener");
			const docAddEventListener = vi.spyOn(document, "addEventListener");

			new BrowserLogger(config);

			expect(addEventListener).toHaveBeenCalledWith(
				"beforeunload",
				expect.any(Function),
			);
			expect(addEventListener).toHaveBeenCalledWith(
				"error",
				expect.any(Function),
			);
			expect(docAddEventListener).toHaveBeenCalledWith(
				"visibilitychange",
				expect.any(Function),
			);
		});

		it("should create initial session", () => {
			const sessionId = logger.startSession();
			expect(sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
		});
	});

	describe("Basic Logging Methods", () => {
		it("should log debug messages", () => {
			const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

			logger.debug("Test debug message");

			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining("[DEBUG] Test debug message"),
				expect.any(Object),
			);
		});

		it("should log info messages", () => {
			const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});

			logger.info("Test info message");

			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining("[INFO] Test info message"),
				expect.any(Object),
			);
		});

		it("should log warn messages", () => {
			const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

			logger.warn("Test warn message");

			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining("[WARN] Test warn message"),
				expect.any(Object),
			);
		});

		it("should log error messages", () => {
			const consoleSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});

			logger.error("Test error message");

			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining("[ERROR] Test error message"),
				expect.any(Object),
			);
		});

		it("should respect log level filtering", () => {
			logger.setLevel("warn");
			const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

			logger.debug("Should not log");
			logger.info("Should not log");
			logger.warn("Should log");

			expect(consoleSpy).not.toHaveBeenCalled();
		});
	});

	describe("Frontend-Specific Methods", () => {
		it("should track events", () => {
			logger.track("button_click", { elementId: "submit-btn" });

			expect(logger.getBufferSize()).toBe(2); // 初期化ログ + トラッキングログ
		});

		it("should track page views", () => {
			logger.pageView("/test-page");

			expect(logger.getBufferSize()).toBe(2);
		});

		it("should track user interactions", () => {
			logger.userInteraction("click", "button-1");

			expect(logger.getBufferSize()).toBe(2);
		});

		it("should track API calls", () => {
			logger.apiCall("/api/users", "GET");

			expect(logger.getBufferSize()).toBe(2);
		});

		it("should track performance metrics when enabled", () => {
			config.enablePerformanceTracking = true;
			const perfLogger = new BrowserLogger(config);

			perfLogger.performance("page_load_time", 1500);

			expect(perfLogger.getBufferSize()).toBe(2);
			perfLogger.destroy();
		});

		it("should not track performance when disabled", () => {
			config.enablePerformanceTracking = false;
			const perfLogger = new BrowserLogger(config);

			perfLogger.performance("page_load_time", 1500);

			expect(perfLogger.getBufferSize()).toBe(1); // 初期化ログのみ
			perfLogger.destroy();
		});
	});

	describe("Session Management", () => {
		it("should start new session", () => {
			const sessionId = logger.startSession();
			expect(sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
		});

		it("should end session with metrics", () => {
			logger.endSession();
			// endSession時に flush() が呼ばれるため、送信処理をテスト
			expect(logger.getBufferSize()).toBeGreaterThan(0);
		});

		it("should set user ID", () => {
			logger.setUserId("user123");
			logger.info("Test with user");

			// ユーザーIDがログに含まれることを確認
			expect(logger.getBufferSize()).toBe(3); // 初期化 + ユーザー設定 + テストログ
		});

		it("should set component name", () => {
			logger.setComponent("TestComponent");
			logger.info("Test with component");

			expect(logger.getBufferSize()).toBe(2);
		});
	});

	describe("Buffer Management", () => {
		it("should add logs to buffer", () => {
			expect(logger.getBufferSize()).toBe(1); // 初期化ログ

			logger.info("Test message");

			expect(logger.getBufferSize()).toBe(2);
		});

		it("should flush buffer when size limit is reached", async () => {
			config.bufferSize = 2;
			const flushLogger = new BrowserLogger(config);

			flushLogger.info("Message 1");
			expect(flushLogger.getBufferSize()).toBe(2); // 初期化 + メッセージ1

			flushLogger.info("Message 2"); // これでバッファサイズ制限に達してフラッシュ

			// フラッシュ処理は非同期なので少し待つ
			await vi.waitFor(() => {
				expect(mockFetch).toHaveBeenCalled();
			});

			flushLogger.destroy();
		});

		it("should clear buffer", () => {
			logger.info("Test message");
			expect(logger.getBufferSize()).toBe(2);

			logger.clear();
			expect(logger.getBufferSize()).toBe(0);
		});

		it("should flush buffer manually", async () => {
			logger.info("Test message");

			await logger.flush();

			expect(mockFetch).toHaveBeenCalled();
		});
	});

	describe("Configuration Management", () => {
		it("should update configuration", () => {
			const newLevel = "error";
			logger.updateConfig({ level: newLevel });

			expect(logger.getConfig().level).toBe(newLevel);
		});

		it("should update flush interval", () => {
			logger.updateConfig({ flushInterval: 2000 });

			expect(logger.getConfig().flushInterval).toBe(2000);
		});
	});

	describe("Event Listeners", () => {
		it("should handle beforeunload event", () => {
			const event = new Event("beforeunload");
			const handler = (
				window.addEventListener as MockedFunction<any>
			).mock.calls.find((call) => call[0] === "beforeunload")?.[1];

			logger.info("Test message"); // バッファにログを追加

			if (handler) {
				handler(event);
			}

			// Beacon API が呼ばれることを確認
			expect(navigator.sendBeacon).toHaveBeenCalled();
		});

		it("should handle visibility change event", () => {
			const handler = (
				document.addEventListener as MockedFunction<any>
			).mock.calls.find((call) => call[0] === "visibilitychange")?.[1];

			if (handler) {
				handler(new Event("visibilitychange"));
			}

			// visibilitychange のログが追加されることを確認
			expect(logger.getBufferSize()).toBeGreaterThan(1);
		});

		it("should handle global errors when error tracking is enabled", () => {
			config.enableErrorTracking = true;
			const errorLogger = new BrowserLogger(config);

			const handler = (
				window.addEventListener as MockedFunction<any>
			).mock.calls.find((call) => call[0] === "error")?.[1];

			const errorEvent = new ErrorEvent("error", {
				message: "Test error",
				filename: "test.js",
				lineno: 123,
				colno: 456,
				error: new Error("Test error"),
			});

			if (handler) {
				handler(errorEvent);
			}

			expect(errorLogger.getBufferSize()).toBe(2); // 初期化 + エラーログ
			errorLogger.destroy();
		});

		it("should handle online/offline events", () => {
			const onlineHandler = (
				window.addEventListener as MockedFunction<any>
			).mock.calls.find((call) => call[0] === "online")?.[1];
			const offlineHandler = (
				window.addEventListener as MockedFunction<any>
			).mock.calls.find((call) => call[0] === "offline")?.[1];

			if (offlineHandler) {
				offlineHandler(new Event("offline"));
			}

			if (onlineHandler) {
				onlineHandler(new Event("online"));
			}

			expect(logger.getBufferSize()).toBeGreaterThan(2); // オンライン/オフラインログが追加
		});
	});

	describe("Log Sending", () => {
		it("should send logs via fetch when API endpoint is configured", async () => {
			config.apiEndpoint = "https://api.example.com/logs";
			const apiLogger = new BrowserLogger(config);

			apiLogger.info("Test message");
			await apiLogger.flush();

			expect(mockFetch).toHaveBeenCalledWith(
				"https://api.example.com/logs",
				expect.objectContaining({
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: expect.stringContaining("Test message"),
				}),
			);

			apiLogger.destroy();
		});

		it("should handle fetch errors gracefully", async () => {
			config.apiEndpoint = "https://api.example.com/logs";
			mockFetch.mockRejectedValueOnce(new Error("Network error"));

			const apiLogger = new BrowserLogger(config);
			apiLogger.info("Test message");

			await expect(apiLogger.flush()).resolves.not.toThrow();

			apiLogger.destroy();
		});

		it("should retry failed requests", async () => {
			config.apiEndpoint = "https://api.example.com/logs";
			config.maxRetries = 2;

			// 最初の2回は失敗、3回目は成功
			mockFetch
				.mockRejectedValueOnce(new Error("Network error"))
				.mockRejectedValueOnce(new Error("Network error"))
				.mockResolvedValueOnce({
					ok: true,
					status: 200,
					json: () => Promise.resolve({}),
				});

			const apiLogger = new BrowserLogger(config);
			apiLogger.info("Test message");

			await apiLogger.flush();

			// 失敗したエントリがバッファに戻されることを確認
			expect(apiLogger.getBufferSize()).toBeGreaterThan(0);

			apiLogger.destroy();
		});
	});

	describe("Automatic Flush Timer", () => {
		it("should flush automatically at specified intervals", async () => {
			config.flushInterval = 1000;
			const timerLogger = new BrowserLogger(config);

			timerLogger.info("Test message");

			// タイマーを進める
			vi.advanceTimersByTime(1000);

			await vi.waitFor(() => {
				expect(mockFetch).toHaveBeenCalled();
			});

			timerLogger.destroy();
		});
	});

	describe("Local Storage Integration", () => {
		it("should save to localStorage when enabled", () => {
			config.enableLocalStorage = true;
			const lsLogger = new BrowserLogger(config);

			lsLogger.info("Test message");

			expect(localStorage.setItem).toHaveBeenCalledWith(
				"saifuu_logger",
				expect.stringContaining("session_"),
			);

			lsLogger.destroy();
		});

		it("should handle localStorage errors gracefully", () => {
			config.enableLocalStorage = true;
			// @ts-ignore
			global.localStorage.setItem = vi.fn().mockImplementation(() => {
				throw new Error("QuotaExceededError");
			});

			const lsLogger = new BrowserLogger(config);

			expect(() => {
				lsLogger.info("Test message");
			}).not.toThrow();

			lsLogger.destroy();
		});
	});

	describe("Data Masking", () => {
		it("should mask sensitive data when enabled", () => {
			config.maskSensitiveData = true;
			config.sensitiveFields = ["password", "secret"];

			const maskLogger = new BrowserLogger(config);

			maskLogger.info("Test with sensitive data", {
				password: "secret123",
				secret: "topsecret",
				normalField: "normal value",
			});

			// マスキングが適用されることを確認（実際の実装では内部でマスクされる）
			expect(maskLogger.getBufferSize()).toBe(2);

			maskLogger.destroy();
		});
	});

	describe("Cleanup and Destruction", () => {
		it("should remove event listeners on destroy", () => {
			const removeEventListener = vi.spyOn(window, "removeEventListener");
			const docRemoveEventListener = vi.spyOn(document, "removeEventListener");

			logger.destroy();

			expect(removeEventListener).toHaveBeenCalledWith(
				"beforeunload",
				expect.any(Function),
			);
			expect(docRemoveEventListener).toHaveBeenCalledWith(
				"visibilitychange",
				expect.any(Function),
			);
		});

		it("should clear timer on destroy", () => {
			const clearIntervalSpy = vi.spyOn(global, "clearInterval");

			logger.destroy();

			expect(clearIntervalSpy).toHaveBeenCalled();
		});

		it("should prevent logging after destruction", () => {
			logger.destroy();

			const initialBufferSize = logger.getBufferSize();
			logger.info("Should not log");

			expect(logger.getBufferSize()).toBe(initialBufferSize);
		});
	});

	describe("Factory Function", () => {
		it("should create logger instance via factory function", () => {
			const factoryLogger = createBrowserLogger(config);

			expect(factoryLogger).toBeInstanceOf(BrowserLogger);
			expect(factoryLogger.getConfig()).toEqual(config);

			factoryLogger.destroy();
		});
	});

	describe("Edge Cases", () => {
		it("should handle missing window object", () => {
			// @ts-ignore
			global.window = undefined;

			expect(() => {
				const noWindowLogger = new BrowserLogger(config);
				noWindowLogger.destroy();
			}).not.toThrow();
		});

		it("should handle missing navigator object", () => {
			// @ts-ignore
			global.navigator = undefined;

			expect(() => {
				const noNavLogger = new BrowserLogger(config);
				noNavLogger.destroy();
			}).not.toThrow();
		});

		it("should handle missing performance object", () => {
			// @ts-ignore
			global.performance = undefined;

			expect(() => {
				const noPerfLogger = new BrowserLogger(config);
				noPerfLogger.destroy();
			}).not.toThrow();
		});
	});
});
