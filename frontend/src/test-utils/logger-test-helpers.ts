/**
 * Loggerテスト用ヘルパー関数
 *
 * テストの重複を削減し、一貫性のあるセットアップを提供
 */

import { vi } from "vitest";
import type { BrowserLoggerConfig } from "../lib/logger/types";

/**
 * デフォルトのモック設定
 */
export const createMockLoggerConfig = (
	overrides?: Partial<BrowserLoggerConfig>,
): Partial<BrowserLoggerConfig> => ({
	environment: "development",
	level: "debug",
	enableConsole: false,
	bufferSize: 5,
	flushInterval: 100,
	...overrides,
});

/**
 * ブラウザAPIのモック設定
 */
export const setupBrowserMocks = () => {
	// @ts-ignore - グローバルオブジェクトのモック
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
		},
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		innerWidth: 1920,
		innerHeight: 1080,
		screen: {
			width: 1920,
			height: 1080,
			availHeight: 1080,
			availWidth: 1920,
			colorDepth: 24,
			pixelDepth: 24,
			orientation: {
				angle: 0,
				type: "landscape-primary",
				lock: vi.fn(),
				unlock: vi.fn(),
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
				dispatchEvent: vi.fn(),
			} as any,
		} as Screen,
	};

	// @ts-ignore - LocalStorageのモック
	global.localStorage = {
		getItem: vi.fn(),
		setItem: vi.fn(),
		removeItem: vi.fn(),
	};

	// @ts-ignore - navigator.clipboardのモック
	global.navigator = {
		clipboard: {
			writeText: vi.fn().mockResolvedValue(undefined),
			readText: vi.fn().mockResolvedValue(''),
			read: vi.fn().mockResolvedValue(undefined),
			write: vi.fn().mockResolvedValue(undefined),
			addEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
			removeEventListener: vi.fn(),
		} as any,
		userAgent: 'Mozilla/5.0 (Test Browser)',
	};
};

/**
 * fetchのモック設定
 */
export const setupFetchMock = () => {
	const mockFetch = vi.fn().mockResolvedValue({
		ok: true,
		status: 200,
		json: () => Promise.resolve({}),
	}) as any;

	global.fetch = mockFetch as any;
	return mockFetch;
};

/**
 * コンソールスパイのセットアップ
 */
export const setupConsoleSpy = () => {
	const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
	const consoleInfoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
	const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
	const consoleErrorSpy = vi
		.spyOn(console, "error")
		.mockImplementation(() => {});

	return {
		consoleLogSpy,
		consoleInfoSpy,
		consoleWarnSpy,
		consoleErrorSpy,
		restore: () => {
			consoleLogSpy.mockRestore();
			consoleInfoSpy.mockRestore();
			consoleWarnSpy.mockRestore();
			consoleErrorSpy.mockRestore();
		},
	};
};

/**
 * タイマーのセットアップとクリーンアップ
 */
export const setupTimers = () => {
	vi.useFakeTimers();

	return {
		advance: (ms: number) => vi.advanceTimersByTime(ms),
		runAll: () => vi.runAllTimers(),
		cleanup: () => {
			vi.clearAllTimers();
			vi.useRealTimers();
		},
	};
};
