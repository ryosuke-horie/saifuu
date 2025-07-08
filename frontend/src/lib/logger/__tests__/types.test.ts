/**
 * フロントエンドロガー 型定義テスト
 *
 * 型安全性とインターフェースの整合性を検証
 */

import { describe, expect, it } from "vitest";
import type {
	BrowserLoggerConfig,
	BufferedLogEntry,
	DeviceInfo,
	Environment,
	FrontendLogEntry,
	FrontendLogger,
	FrontendLogMeta,
	LogLevel,
	LogSendResult,
	NetworkInfo,
	SessionInfo,
} from "../types";

describe("Logger Types", () => {
	describe("LogLevel", () => {
		it("should accept valid log levels", () => {
			const levels: LogLevel[] = ["debug", "info", "warn", "error"];
			expect(levels).toHaveLength(4);
			expect(levels).toContain("debug");
			expect(levels).toContain("info");
			expect(levels).toContain("warn");
			expect(levels).toContain("error");
		});
	});

	describe("Environment", () => {
		it("should accept valid environments", () => {
			const environments: Environment[] = [
				"development",
				"production",
				"storybook",
			];
			expect(environments).toHaveLength(3);
			expect(environments).toContain("development");
			expect(environments).toContain("production");
			expect(environments).toContain("storybook");
		});
	});

	describe("FrontendLogMeta", () => {
		it("should allow optional fields", () => {
			const meta: FrontendLogMeta = {};
			expect(meta).toBeDefined();
		});

		it("should accept all defined properties", () => {
			const meta: FrontendLogMeta = {
				requestId: "req_123",
				userId: "user_456",
				sessionId: "session_789",
				component: "TestComponent",
				action: "click",
				url: "https://example.com",
				userAgent: "Mozilla/5.0",
				duration: 100,
				loadTime: 500,
				renderTime: 50,
				memoryUsage: 1024,
				elementId: "button-1",
				clickPosition: { x: 100, y: 200 },
				scrollPosition: { x: 0, y: 300 },
				keyboardInput: "test input",
				viewport: { width: 1920, height: 1080 },
				networkType: "4g",
				isOnline: true,
				isVisible: true,
				error: "Test error",
				stack: "Error stack trace",
				errorBoundary: "TestErrorBoundary",
				storyId: "story-123",
				storyName: "Test Story",
				data: { custom: "data" },
				customField: "custom value",
			};

			expect(meta.requestId).toBe("req_123");
			expect(meta.component).toBe("TestComponent");
			expect(meta.clickPosition).toEqual({ x: 100, y: 200 });
			expect(meta.customField).toBe("custom value");
		});
	});

	describe("FrontendLogEntry", () => {
		it("should require all mandatory fields", () => {
			const entry: FrontendLogEntry = {
				timestamp: "2024-01-01T00:00:00.000Z",
				level: "info",
				message: "Test message",
				requestId: "req_123",
				sessionId: "session_456",
				environment: "development",
				service: "saifuu-frontend",
				version: "1.0.0",
				url: "https://example.com",
				deviceInfo: {
					userAgent: "Mozilla/5.0",
					viewport: { width: 1920, height: 1080 },
					language: "en-US",
					timezone: "UTC",
				},
				meta: {},
			};

			expect(entry.service).toBe("saifuu-frontend");
			expect(entry.level).toBe("info");
			expect(entry.deviceInfo.viewport).toEqual({ width: 1920, height: 1080 });
		});
	});

	describe("BrowserLoggerConfig", () => {
		it("should require all mandatory configuration fields", () => {
			const config: BrowserLoggerConfig = {
				environment: "development",
				level: "debug",
				version: "1.0.0",
				bufferSize: 100,
				flushInterval: 5000,
				maxRetries: 3,
				enableConsole: true,
				enableLocalStorage: false,
				enableBeacon: false,
				apiTimeout: 10000,
				enablePerformanceTracking: true,
				enableUserTracking: true,
				enableNetworkTracking: false,
				enableErrorTracking: true,
				sessionTimeout: 1800000,
				persistSession: true,
				maskSensitiveData: true,
			};

			expect(config.environment).toBe("development");
			expect(config.bufferSize).toBe(100);
			expect(config.enableConsole).toBe(true);
		});

		it("should allow optional fields", () => {
			const config: BrowserLoggerConfig = {
				environment: "production",
				level: "info",
				version: "1.0.0",
				bufferSize: 50,
				flushInterval: 10000,
				maxRetries: 5,
				enableConsole: false,
				enableLocalStorage: false,
				enableBeacon: true,
				apiEndpoint: "https://api.example.com/logs",
				apiTimeout: 15000,
				enablePerformanceTracking: false,
				enableUserTracking: false,
				enableNetworkTracking: false,
				enableErrorTracking: true,
				sessionTimeout: 3600000,
				persistSession: false,
				excludePatterns: ["password", "secret"],
				includeOnlyPatterns: ["component", "action"],
				sensitiveFields: ["email", "phone"],
				maskSensitiveData: true,
			};

			expect(config.apiEndpoint).toBe("https://api.example.com/logs");
			expect(config.excludePatterns).toEqual(["password", "secret"]);
			expect(config.sensitiveFields).toEqual(["email", "phone"]);
		});
	});

	describe("SessionInfo", () => {
		it("should track session metrics", () => {
			const sessionInfo: SessionInfo = {
				id: "session_123",
				startTime: Date.now(),
				lastActivity: Date.now(),
				userId: "user_456",
				pageViews: 3,
				events: 15,
				errors: 1,
			};

			expect(sessionInfo.id).toBe("session_123");
			expect(sessionInfo.pageViews).toBe(3);
			expect(sessionInfo.events).toBe(15);
			expect(sessionInfo.errors).toBe(1);
		});

		it("should allow optional userId", () => {
			const sessionInfo: SessionInfo = {
				id: "session_123",
				startTime: Date.now(),
				lastActivity: Date.now(),
				pageViews: 0,
				events: 0,
				errors: 0,
			};

			expect(sessionInfo.userId).toBeUndefined();
		});
	});

	describe("DeviceInfo", () => {
		it("should contain all device information", () => {
			const deviceInfo: DeviceInfo = {
				userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
				platform: "Win32",
				language: "en-US",
				languages: ["en-US", "en"],
				timezone: "America/New_York",
				viewport: { width: 1920, height: 1080 },
				screen: { width: 1920, height: 1080 },
				pixelRatio: 1,
				touchSupport: false,
				cookieEnabled: true,
			};

			expect(deviceInfo.platform).toBe("Win32");
			expect(deviceInfo.languages).toContain("en-US");
			expect(deviceInfo.touchSupport).toBe(false);
		});
	});

	describe("NetworkInfo", () => {
		it("should track network status", () => {
			const networkInfo: NetworkInfo = {
				type: "wifi",
				effectiveType: "4g",
				downlink: 10.0,
				rtt: 100,
				isOnline: true,
			};

			expect(networkInfo.type).toBe("wifi");
			expect(networkInfo.isOnline).toBe(true);
		});

		it("should require isOnline field", () => {
			const networkInfo: NetworkInfo = {
				isOnline: false,
			};

			expect(networkInfo.isOnline).toBe(false);
		});
	});

	describe("LogSendResult", () => {
		it("should track send operation results", () => {
			const successResult: LogSendResult = {
				success: true,
				statusCode: 200,
				sentCount: 10,
				failedCount: 0,
			};

			expect(successResult.success).toBe(true);
			expect(successResult.sentCount).toBe(10);

			const failResult: LogSendResult = {
				success: false,
				error: "Network error",
				sentCount: 0,
				failedCount: 5,
				retryAfter: 30000,
			};

			expect(failResult.success).toBe(false);
			expect(failResult.error).toBe("Network error");
			expect(failResult.retryAfter).toBe(30000);
		});
	});

	describe("BufferedLogEntry", () => {
		it("should track retry attempts", () => {
			const logEntry: FrontendLogEntry = {
				timestamp: "2024-01-01T00:00:00.000Z",
				level: "info",
				message: "Test",
				requestId: "req_123",
				sessionId: "session_456",
				environment: "development",
				service: "saifuu-frontend",
				version: "1.0.0",
				url: "https://example.com",
				deviceInfo: {
					userAgent: "Mozilla/5.0",
					viewport: { width: 1920, height: 1080 },
					language: "en-US",
					timezone: "UTC",
				},
				meta: {},
			};

			const bufferedEntry: BufferedLogEntry = {
				entry: logEntry,
				attempts: 2,
				lastAttempt: Date.now(),
			};

			expect(bufferedEntry.attempts).toBe(2);
			expect(bufferedEntry.entry.message).toBe("Test");
		});
	});
});

describe("Interface Compliance", () => {
	describe("FrontendLogger Interface", () => {
		it("should define all required methods", () => {
			// この型チェックはコンパイル時に検証される
			const methodNames: (keyof FrontendLogger)[] = [
				"debug",
				"info",
				"warn",
				"error",
				"track",
				"pageView",
				"userInteraction",
				"apiCall",
				"performance",
				"startSession",
				"endSession",
				"setUserId",
				"setComponent",
				"flush",
				"clear",
				"getBufferSize",
				"setLevel",
				"getConfig",
				"updateConfig",
				"addEventListeners",
				"removeEventListeners",
				"destroy",
			];

			expect(methodNames).toHaveLength(22);
			expect(methodNames).toContain("debug");
			expect(methodNames).toContain("track");
			expect(methodNames).toContain("flush");
			expect(methodNames).toContain("destroy");
		});
	});
});

describe("Type Guards and Validation", () => {
	describe("LogLevel validation", () => {
		it("should validate log levels", () => {
			const isValidLogLevel = (level: string): level is LogLevel => {
				return ["debug", "info", "warn", "error"].includes(level);
			};

			expect(isValidLogLevel("debug")).toBe(true);
			expect(isValidLogLevel("info")).toBe(true);
			expect(isValidLogLevel("warn")).toBe(true);
			expect(isValidLogLevel("error")).toBe(true);
			expect(isValidLogLevel("invalid")).toBe(false);
		});
	});

	describe("Environment validation", () => {
		it("should validate environments", () => {
			const isValidEnvironment = (env: string): env is Environment => {
				return ["development", "production", "storybook"].includes(env);
			};

			expect(isValidEnvironment("development")).toBe(true);
			expect(isValidEnvironment("production")).toBe(true);
			expect(isValidEnvironment("storybook")).toBe(true);
			expect(isValidEnvironment("test")).toBe(false);
		});
	});
});
