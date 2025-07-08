/**
 * フロントエンドロガー 設定システムテスト
 *
 * 環境別設定、バリデーション、ブラウザ互換性を検証
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	checkBrowserCompatibility,
	createLoggerConfig,
	detectEnvironment,
	getDefaultConfig,
	getLogLevelValue,
	isDevelopment,
	isProduction,
	isStorybook,
	mergeConfigs,
	optimizeConfigForBrowser,
	shouldLog,
	validateConfig,
} from "../config";
import type { BrowserLoggerConfig, LogLevel } from "../types";

// モック用のグローバル変数
const originalWindow = global.window;
const originalDocument = global.document;
const originalNavigator = global.navigator;
const originalProcess = global.process;

describe("Config System", () => {
	beforeEach(() => {
		// テスト用のモック環境をリセット
		vi.resetAllMocks();
	});

	afterEach(() => {
		// グローバル変数を復元
		global.window = originalWindow;
		global.document = originalDocument;
		global.navigator = originalNavigator;
		global.process = originalProcess;
	});

	describe("detectEnvironment", () => {
		it("should detect development environment", () => {
			const env = { NODE_ENV: "development" };
			expect(detectEnvironment(env)).toBe("development");
		});

		it("should detect production environment", () => {
			const env = { NODE_ENV: "production" };
			expect(detectEnvironment(env)).toBe("production");
		});

		it("should detect storybook environment", () => {
			const env = { STORYBOOK: "true" };
			expect(detectEnvironment(env)).toBe("storybook");
		});

		it("should detect storybook from window.__STORYBOOK_ADDONS", () => {
			// @ts-ignore
			global.window = { __STORYBOOK_ADDONS: {} };
			expect(detectEnvironment({})).toBe("storybook");
		});

		it("should detect development from localhost", () => {
			// @ts-ignore
			global.window = {
				location: {
					hostname: "localhost",
					href: "http://localhost:3000",
					pathname: "/",
					protocol: "http:",
					port: "3000",
					hash: "",
					search: "",
					host: "localhost:3000",
					origin: "http://localhost:3000",
					ancestorOrigins: {} as DOMStringList,
					assign: vi.fn(),
					reload: vi.fn(),
					replace: vi.fn(),
				} as Location,
			};
			expect(detectEnvironment({})).toBe("development");
		});

		it("should fallback to production for unknown environments", () => {
			// @ts-ignore
			global.window = {
				location: {
					hostname: "example.com",
					href: "https://example.com",
					pathname: "/",
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
			};
			expect(detectEnvironment({})).toBe("production");
		});
	});

	describe("createLoggerConfig", () => {
		it("should create development config with defaults", () => {
			const env = { NODE_ENV: "development" };
			const config = createLoggerConfig(env);

			expect(config.environment).toBe("development");
			expect(config.level).toBe("debug");
			expect(config.enableConsole).toBe(true);
			expect(config.bufferSize).toBe(10);
			expect(config.flushInterval).toBe(1000);
		});

		it("should create production config with defaults", () => {
			const env = { NODE_ENV: "production" };
			const config = createLoggerConfig(env);

			expect(config.environment).toBe("production");
			expect(config.level).toBe("info");
			expect(config.enableConsole).toBe(false);
			expect(config.bufferSize).toBe(100);
			expect(config.flushInterval).toBe(10000);
		});

		it("should create storybook config with defaults", () => {
			const env = { STORYBOOK: "true" };
			const config = createLoggerConfig(env);

			expect(config.environment).toBe("storybook");
			expect(config.level).toBe("warn");
			expect(config.enableConsole).toBe(true);
			expect(config.bufferSize).toBe(5);
			expect(config.flushInterval).toBe(500);
		});

		it("should override with environment variables", () => {
			const env = {
				NODE_ENV: "development",
				NEXT_PUBLIC_LOG_LEVEL: "error",
				NEXT_PUBLIC_LOG_BUFFER_SIZE: "50",
				NEXT_PUBLIC_LOG_FLUSH_INTERVAL: "2000",
				NEXT_PUBLIC_LOG_API_ENDPOINT: "https://api.example.com/logs",
				NEXT_PUBLIC_LOG_API_TIMEOUT: "5000",
				NEXT_PUBLIC_LOG_ENABLE_CONSOLE: "false",
				NEXT_PUBLIC_VERSION: "2.0.0",
			};

			const config = createLoggerConfig(env);

			expect(config.level).toBe("error");
			expect(config.bufferSize).toBe(50);
			expect(config.flushInterval).toBe(2000);
			expect(config.apiEndpoint).toBe("https://api.example.com/logs");
			expect(config.apiTimeout).toBe(5000);
			expect(config.enableConsole).toBe(false);
			expect(config.version).toBe("2.0.0");
		});

		it("should ignore invalid numeric environment variables", () => {
			const env = {
				NODE_ENV: "development",
				NEXT_PUBLIC_LOG_BUFFER_SIZE: "invalid",
				NEXT_PUBLIC_LOG_FLUSH_INTERVAL: "-100",
				NEXT_PUBLIC_LOG_API_TIMEOUT: "0",
			};

			const config = createLoggerConfig(env);

			// デフォルト値が使用される
			expect(config.bufferSize).toBe(10);
			expect(config.flushInterval).toBe(1000);
			expect(config.apiTimeout).toBe(5000);
		});
	});

	describe("getLogLevelValue", () => {
		it("should return correct numeric values for log levels", () => {
			expect(getLogLevelValue("debug")).toBe(0);
			expect(getLogLevelValue("info")).toBe(1);
			expect(getLogLevelValue("warn")).toBe(2);
			expect(getLogLevelValue("error")).toBe(3);
		});

		it("should return default value for invalid level", () => {
			// @ts-ignore テスト用の無効な値
			expect(getLogLevelValue("invalid")).toBe(1);
		});
	});

	describe("shouldLog", () => {
		it("should allow logging at same level", () => {
			expect(shouldLog("info", "info")).toBe(true);
		});

		it("should allow logging at higher level", () => {
			expect(shouldLog("info", "warn")).toBe(true);
			expect(shouldLog("info", "error")).toBe(true);
		});

		it("should block logging at lower level", () => {
			expect(shouldLog("warn", "info")).toBe(false);
			expect(shouldLog("warn", "debug")).toBe(false);
		});

		it("should work with debug level", () => {
			expect(shouldLog("debug", "debug")).toBe(true);
			expect(shouldLog("debug", "info")).toBe(true);
			expect(shouldLog("debug", "warn")).toBe(true);
			expect(shouldLog("debug", "error")).toBe(true);
		});

		it("should work with error level", () => {
			expect(shouldLog("error", "error")).toBe(true);
			expect(shouldLog("error", "warn")).toBe(false);
			expect(shouldLog("error", "info")).toBe(false);
			expect(shouldLog("error", "debug")).toBe(false);
		});
	});

	describe("mergeConfigs", () => {
		it("should merge configurations correctly", () => {
			const baseConfig: BrowserLoggerConfig = getDefaultConfig("development");
			const override = {
				level: "error" as LogLevel,
				bufferSize: 200,
				enableConsole: false,
			};

			const merged = mergeConfigs(baseConfig, override);

			expect(merged.level).toBe("error");
			expect(merged.bufferSize).toBe(200);
			expect(merged.enableConsole).toBe(false);
			expect(merged.environment).toBe("development"); // 元の値が保持される
		});
	});

	describe("validateConfig", () => {
		it("should validate correct configuration", () => {
			const config = getDefaultConfig("development");
			const result = validateConfig(config);

			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it("should detect invalid buffer size", () => {
			const config = getDefaultConfig("development");
			config.bufferSize = 0;

			const result = validateConfig(config);

			expect(result.valid).toBe(false);
			expect(result.errors).toContain("bufferSize must be between 1 and 1000");
		});

		it("should detect invalid flush interval", () => {
			const config = getDefaultConfig("development");
			config.flushInterval = 50;

			const result = validateConfig(config);

			expect(result.valid).toBe(false);
			expect(result.errors).toContain(
				"flushInterval must be between 100ms and 60000ms",
			);
		});

		it("should detect invalid max retries", () => {
			const config = getDefaultConfig("development");
			config.maxRetries = -1;

			const result = validateConfig(config);

			expect(result.valid).toBe(false);
			expect(result.errors).toContain("maxRetries must be between 0 and 10");
		});

		it("should detect invalid API timeout", () => {
			const config = getDefaultConfig("development");
			config.apiTimeout = 500;

			const result = validateConfig(config);

			expect(result.valid).toBe(false);
			expect(result.errors).toContain(
				"apiTimeout must be between 1000ms and 30000ms",
			);
		});

		it("should detect invalid session timeout", () => {
			const config = getDefaultConfig("development");
			config.sessionTimeout = 30000; // 30秒（最小値の1分未満）

			const result = validateConfig(config);

			expect(result.valid).toBe(false);
			expect(result.errors).toContain(
				"sessionTimeout must be between 1 minute and 24 hours",
			);
		});

		it("should detect invalid API endpoint", () => {
			const config = getDefaultConfig("development");
			config.apiEndpoint = "invalid-url";

			const result = validateConfig(config);

			expect(result.valid).toBe(false);
			expect(result.errors).toContain("apiEndpoint must be a valid URL");
		});

		it("should accept valid API endpoint", () => {
			const config = getDefaultConfig("development");
			config.apiEndpoint = "https://api.example.com/logs";

			const result = validateConfig(config);

			expect(result.valid).toBe(true);
		});
	});

	describe("checkBrowserCompatibility", () => {
		it("should check for fetch availability", () => {
			// @ts-ignore
			global.fetch = vi.fn();
			const compatibility = checkBrowserCompatibility();
			expect(compatibility.fetch).toBe(true);

			// @ts-ignore
			global.fetch = undefined;
			const compatibilityWithoutFetch = checkBrowserCompatibility();
			expect(compatibilityWithoutFetch.fetch).toBe(false);
		});

		it("should check for localStorage availability", () => {
			// @ts-ignore
			global.localStorage = { getItem: vi.fn(), setItem: vi.fn() };
			const compatibility = checkBrowserCompatibility();
			expect(compatibility.localStorage).toBe(true);

			// @ts-ignore
			global.localStorage = undefined;
			const compatibilityWithoutLS = checkBrowserCompatibility();
			expect(compatibilityWithoutLS.localStorage).toBe(false);
		});

		it("should check for beacon availability", () => {
			// @ts-ignore
			global.navigator = { sendBeacon: vi.fn() };
			const compatibility = checkBrowserCompatibility();
			expect(compatibility.beacon).toBe(true);

			// @ts-ignore
			global.navigator = {};
			const compatibilityWithoutBeacon = checkBrowserCompatibility();
			expect(compatibilityWithoutBeacon.beacon).toBe(false);
		});

		it("should check for performance API availability", () => {
			// @ts-ignore
			global.performance = { now: vi.fn() };
			const compatibility = checkBrowserCompatibility();
			expect(compatibility.performance).toBe(true);

			// @ts-ignore
			global.performance = undefined;
			const compatibilityWithoutPerf = checkBrowserCompatibility();
			expect(compatibilityWithoutPerf.performance).toBe(false);
		});
	});

	describe("optimizeConfigForBrowser", () => {
		it("should disable beacon when not available", () => {
			// @ts-ignore
			global.navigator = {};

			const config = getDefaultConfig("production");
			config.enableBeacon = true;

			const optimized = optimizeConfigForBrowser(config);

			expect(optimized.enableBeacon).toBe(false);
		});

		it("should disable localStorage features when not available", () => {
			// @ts-ignore
			global.localStorage = undefined;

			const config = getDefaultConfig("development");
			config.enableLocalStorage = true;
			config.persistSession = true;

			const optimized = optimizeConfigForBrowser(config);

			expect(optimized.enableLocalStorage).toBe(false);
			expect(optimized.persistSession).toBe(false);
		});

		it("should disable performance tracking when not available", () => {
			// @ts-ignore
			global.performance = undefined;

			const config = getDefaultConfig("development");
			config.enablePerformanceTracking = true;

			const optimized = optimizeConfigForBrowser(config);

			expect(optimized.enablePerformanceTracking).toBe(false);
		});
	});

	describe("Environment Helper Functions", () => {
		it("should correctly identify development environment", () => {
			vi.spyOn({ detectEnvironment }, "detectEnvironment").mockReturnValue(
				"development",
			);

			expect(isDevelopment()).toBe(true);
			expect(isProduction()).toBe(false);
			expect(isStorybook()).toBe(false);
		});

		it("should correctly identify production environment", () => {
			// @ts-ignore
			global.window = undefined;
			// @ts-ignore
			global.process = { env: { NODE_ENV: "production" } };

			expect(isDevelopment()).toBe(false);
			expect(isProduction()).toBe(true);
			expect(isStorybook()).toBe(false);
		});

		it("should correctly identify storybook environment", () => {
			// @ts-ignore
			global.window = { __STORYBOOK_ADDONS: {} };
			// @ts-ignore
			global.process = undefined;

			expect(isDevelopment()).toBe(false);
			expect(isProduction()).toBe(false);
			expect(isStorybook()).toBe(true);
		});
	});

	describe("Default Configurations", () => {
		it("should provide correct development defaults", () => {
			const config = getDefaultConfig("development");

			expect(config.environment).toBe("development");
			expect(config.level).toBe("debug");
			expect(config.enableConsole).toBe(true);
			expect(config.enableLocalStorage).toBe(true);
			expect(config.enableBeacon).toBe(false);
			expect(config.bufferSize).toBe(10);
			expect(config.flushInterval).toBe(1000);
			expect(config.maskSensitiveData).toBe(false);
		});

		it("should provide correct production defaults", () => {
			const config = getDefaultConfig("production");

			expect(config.environment).toBe("production");
			expect(config.level).toBe("info");
			expect(config.enableConsole).toBe(false);
			expect(config.enableLocalStorage).toBe(false);
			expect(config.enableBeacon).toBe(true);
			expect(config.bufferSize).toBe(100);
			expect(config.flushInterval).toBe(10000);
			expect(config.maskSensitiveData).toBe(true);
		});

		it("should provide correct storybook defaults", () => {
			const config = getDefaultConfig("storybook");

			expect(config.environment).toBe("storybook");
			expect(config.level).toBe("warn");
			expect(config.enableConsole).toBe(true);
			expect(config.enableLocalStorage).toBe(false);
			expect(config.enableBeacon).toBe(false);
			expect(config.bufferSize).toBe(5);
			expect(config.flushInterval).toBe(500);
			expect(config.enablePerformanceTracking).toBe(false);
		});
	});

	describe("Edge Cases", () => {
		it("should handle empty environment variables", () => {
			// @ts-ignore
			global.window = {
				location: {
					hostname: "example.com",
					href: "https://example.com",
					pathname: "/",
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
			};
			const config = createLoggerConfig({});
			expect(config).toBeDefined();
			expect(config.environment).toBe("production"); // フォールバック
		});

		it("should handle undefined environment", () => {
			const config = createLoggerConfig(undefined);
			expect(config).toBeDefined();
		});

		it("should handle process.env being undefined", () => {
			// @ts-ignore
			global.process = undefined;
			const config = createLoggerConfig();
			expect(config).toBeDefined();
		});
	});
});
