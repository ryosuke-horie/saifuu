import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	CacheStrategies,
	checkPWAHealth,
	clearPWAState,
	collectPWAAnalytics,
	getBatteryInfo,
	getDeviceCategory,
	getNetworkType,
	isOffline,
	isOnline,
	isPWAInstallable,
	isPWAInstalled,
	loadPWAState,
	PWAInstallPrompt,
	savePWAState,
} from "./pwa";

// モック関数の定義
const mockFetch = vi.fn();
const mockMatchMedia = vi.fn();
const mockLocalStorage = {
	getItem: vi.fn(),
	setItem: vi.fn(),
	removeItem: vi.fn(),
};

describe("PWA Utilities", () => {
	beforeEach(() => {
		// グローバルオブジェクトのモック
		Object.defineProperty(window, "navigator", {
			value: {
				serviceWorker: {},
				onLine: true,
				userAgent:
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
			},
			writable: true,
		});

		Object.defineProperty(window, "matchMedia", {
			value: mockMatchMedia,
			writable: true,
		});

		Object.defineProperty(window, "localStorage", {
			value: mockLocalStorage,
			writable: true,
		});

		Object.defineProperty(window, "fetch", {
			value: mockFetch,
			writable: true,
		});

		// モック関数をリセット
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	describe("isPWAInstallable", () => {
		it("ServiceWorkerがサポートされている場合はtrueを返す", () => {
			expect(isPWAInstallable()).toBe(true);
		});

		it("ServiceWorkerがサポートされていない場合はfalseを返す", () => {
			Object.defineProperty(window.navigator, "serviceWorker", {
				value: undefined,
				writable: true,
			});

			expect(isPWAInstallable()).toBe(false);
		});

		it("windowが存在しない場合（SSR）はfalseを返す", () => {
			// windowを一時的に削除
			const originalWindow = global.window;
			// @ts-ignore
			delete global.window;

			expect(isPWAInstallable()).toBe(false);

			// windowを復元
			global.window = originalWindow;
		});
	});

	describe("isPWAInstalled", () => {
		it("スタンドアロンモードの場合はtrueを返す", () => {
			mockMatchMedia.mockReturnValue({ matches: true });

			expect(isPWAInstalled()).toBe(true);
			expect(mockMatchMedia).toHaveBeenCalledWith("(display-mode: standalone)");
		});

		it("Safari standalone modeの場合はtrueを返す", () => {
			mockMatchMedia.mockReturnValue({ matches: false });
			Object.defineProperty(window.navigator, "standalone", {
				value: true,
				writable: true,
			});

			expect(isPWAInstalled()).toBe(true);
		});

		it("通常のブラウザーモードの場合はfalseを返す", () => {
			mockMatchMedia.mockReturnValue({ matches: false });
			Object.defineProperty(window.navigator, "standalone", {
				value: false,
				writable: true,
			});

			expect(isPWAInstalled()).toBe(false);
		});
	});

	describe("isOffline", () => {
		it("オフライン状態の場合はtrueを返す", () => {
			Object.defineProperty(window.navigator, "onLine", {
				value: false,
				writable: true,
			});

			expect(isOffline()).toBe(true);
		});

		it("オンライン状態の場合はfalseを返す", () => {
			Object.defineProperty(window.navigator, "onLine", {
				value: true,
				writable: true,
			});

			expect(isOffline()).toBe(false);
		});
	});

	describe("isOnline", () => {
		it("オンライン状態の場合はtrueを返す", () => {
			Object.defineProperty(window.navigator, "onLine", {
				value: true,
				writable: true,
			});

			expect(isOnline()).toBe(true);
		});

		it("オフライン状態の場合はfalseを返す", () => {
			Object.defineProperty(window.navigator, "onLine", {
				value: false,
				writable: true,
			});

			expect(isOnline()).toBe(false);
		});
	});

	describe("getNetworkType", () => {
		it("connection APIが利用可能な場合はネットワークタイプを返す", () => {
			Object.defineProperty(window.navigator, "connection", {
				value: {
					effectiveType: "4g",
					type: "cellular",
				},
				writable: true,
			});

			expect(getNetworkType()).toBe("4g");
		});

		it("connection APIが利用不可の場合はunknownを返す", () => {
			Object.defineProperty(window.navigator, "connection", {
				value: undefined,
				writable: true,
			});

			expect(getNetworkType()).toBe("unknown");
		});

		it("mozConnectionが利用可能な場合はネットワークタイプを返す", () => {
			Object.defineProperty(window.navigator, "mozConnection", {
				value: {
					effectiveType: "3g",
				},
				writable: true,
			});

			expect(getNetworkType()).toBe("3g");
		});
	});

	describe("getBatteryInfo", () => {
		it("Battery APIが利用可能な場合はバッテリー情報を返す", async () => {
			const mockBattery = {
				level: 0.8,
				charging: true,
				chargingTime: 1800,
				dischargingTime: Number.POSITIVE_INFINITY,
			};

			Object.defineProperty(window.navigator, "getBattery", {
				value: vi.fn().mockResolvedValue(mockBattery),
				writable: true,
			});

			const result = await getBatteryInfo();

			expect(result).toEqual(mockBattery);
		});

		it("Battery APIが利用不可の場合はnullを返す", async () => {
			Object.defineProperty(window.navigator, "getBattery", {
				value: undefined,
				writable: true,
			});

			const result = await getBatteryInfo();

			expect(result).toBe(null);
		});

		it("Battery APIでエラーが発生した場合はnullを返す", async () => {
			Object.defineProperty(window.navigator, "getBattery", {
				value: vi.fn().mockRejectedValue(new Error("Battery API error")),
				writable: true,
			});

			const result = await getBatteryInfo();

			expect(result).toBe(null);
		});
	});

	describe("getDeviceCategory", () => {
		it("幅768px未満の場合はmobileを返す", () => {
			Object.defineProperty(window, "innerWidth", {
				value: 500,
				writable: true,
			});

			expect(getDeviceCategory()).toBe("mobile");
		});

		it("幅768px以上1024px未満の場合はtabletを返す", () => {
			Object.defineProperty(window, "innerWidth", {
				value: 800,
				writable: true,
			});

			expect(getDeviceCategory()).toBe("tablet");
		});

		it("幅1024px以上の場合はdesktopを返す", () => {
			Object.defineProperty(window, "innerWidth", {
				value: 1200,
				writable: true,
			});

			expect(getDeviceCategory()).toBe("desktop");
		});
	});

	describe("PWAInstallPrompt", () => {
		it("初期状態では利用不可", () => {
			const prompt = new PWAInstallPrompt();
			expect(prompt.isAvailable()).toBe(false);
		});

		it("beforeinstallpromptイベント発生時に利用可能になる", () => {
			const _prompt = new PWAInstallPrompt();
			const mockEvent = {
				preventDefault: vi.fn(),
			};

			// beforeinstallpromptイベントをシミュレート
			window.dispatchEvent(
				Object.assign(new Event("beforeinstallprompt"), mockEvent),
			);

			expect(mockEvent.preventDefault).toHaveBeenCalled();
		});

		it("プロンプトが利用不可の場合はshowでfalseを返す", async () => {
			const prompt = new PWAInstallPrompt();
			const result = await prompt.show();

			expect(result).toBe(false);
		});
	});

	describe("CacheStrategies", () => {
		describe("isSensitiveData", () => {
			it("機密データURLの場合はtrueを返す", () => {
				expect(CacheStrategies.isSensitiveData("/api/transactions")).toBe(true);
				expect(CacheStrategies.isSensitiveData("/api/subscriptions")).toBe(
					true,
				);
				expect(CacheStrategies.isSensitiveData("/api/auth/login")).toBe(true);
				expect(CacheStrategies.isSensitiveData("/api/user/profile")).toBe(true);
			});

			it("非機密データURLの場合はfalseを返す", () => {
				expect(CacheStrategies.isSensitiveData("/api/categories")).toBe(false);
				expect(CacheStrategies.isSensitiveData("/api/health")).toBe(false);
				expect(CacheStrategies.isSensitiveData("/static/image.png")).toBe(
					false,
				);
			});
		});

		describe("isStaticResource", () => {
			it("静的リソースの場合はtrueを返す", () => {
				expect(
					CacheStrategies.isStaticResource("/_next/static/css/app.css"),
				).toBe(true);
				expect(CacheStrategies.isStaticResource("/image.png")).toBe(true);
				expect(CacheStrategies.isStaticResource("/font.woff2")).toBe(true);
				expect(CacheStrategies.isStaticResource("/manifest.json")).toBe(true);
			});

			it("動的リソースの場合はfalseを返す", () => {
				expect(CacheStrategies.isStaticResource("/api/data")).toBe(false);
				expect(CacheStrategies.isStaticResource("/page")).toBe(false);
			});
		});

		describe("isCacheableAPI", () => {
			it("キャッシュ可能なAPIの場合はtrueを返す", () => {
				expect(CacheStrategies.isCacheableAPI("/api/categories")).toBe(true);
				expect(CacheStrategies.isCacheableAPI("/api/health")).toBe(true);
				expect(CacheStrategies.isCacheableAPI("/api/config")).toBe(true);
			});

			it("キャッシュ不可なAPIの場合はfalseを返す", () => {
				expect(CacheStrategies.isCacheableAPI("/api/transactions")).toBe(false);
				expect(CacheStrategies.isCacheableAPI("/api/user")).toBe(false);
			});
		});
	});

	describe("collectPWAAnalytics", () => {
		it("アナリティクス情報を正しく収集する", () => {
			Object.defineProperty(window, "location", {
				value: { href: "https://example.com/page" },
				writable: true,
			});

			Object.defineProperty(document, "referrer", {
				value: "https://google.com",
				writable: true,
			});

			const analytics = collectPWAAnalytics();

			expect(analytics).toEqual({
				isPWAInstalled: expect.any(Boolean),
				isOffline: expect.any(Boolean),
				networkType: expect.any(String),
				deviceCategory: expect.any(String),
				userAgent: expect.any(String),
				timestamp: expect.any(String),
				url: "https://example.com/page",
				referrer: "https://google.com",
			});
		});

		it("SSR環境ではnullを返す", () => {
			// windowを一時的に削除
			const originalWindow = global.window;
			// @ts-ignore
			delete global.window;

			const analytics = collectPWAAnalytics();

			expect(analytics).toBe(null);

			// windowを復元
			global.window = originalWindow;
		});
	});

	describe("PWA State Management", () => {
		it("状態を正しく保存・読み込みする", () => {
			const testState = { test: "value" };
			mockLocalStorage.getItem.mockReturnValue(
				JSON.stringify({
					...testState,
					timestamp: "2023-01-01T00:00:00.000Z",
				}),
			);

			savePWAState(testState);

			expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
				"pwa-state",
				expect.stringContaining('"test":"value"'),
			);

			const loadedState = loadPWAState();

			expect(loadedState).toEqual(expect.objectContaining(testState));
		});

		it("状態を正しくクリアする", () => {
			clearPWAState();

			expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("pwa-state");
		});

		it("localStorage エラーをハンドリングする", () => {
			mockLocalStorage.setItem.mockImplementation(() => {
				throw new Error("Storage error");
			});

			expect(() => savePWAState({ test: "value" })).not.toThrow();
		});
	});

	describe("checkPWAHealth", () => {
		it("PWAの健全性を正しくチェックする", async () => {
			// manifest.jsonのフェッチをモック
			mockFetch.mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ name: "Test App" }),
			});

			Object.defineProperty(window, "location", {
				value: { protocol: "https:", hostname: "example.com" },
				writable: true,
			});

			Object.defineProperty(window, "Notification", {
				value: {},
				writable: true,
			});

			const health = await checkPWAHealth();

			expect(health).toEqual({
				serviceWorker: true,
				manifest: true,
				https: true,
				offline: true,
				notifications: true,
			});
		});

		it("HTTPS以外の環境でのチェック", async () => {
			Object.defineProperty(window, "location", {
				value: { protocol: "http:", hostname: "example.com" },
				writable: true,
			});

			const health = await checkPWAHealth();

			expect(health.https).toBe(false);
		});

		it("localhostでのHTTPS判定", async () => {
			Object.defineProperty(window, "location", {
				value: { protocol: "http:", hostname: "localhost" },
				writable: true,
			});

			const health = await checkPWAHealth();

			expect(health.https).toBe(true);
		});

		it("manifest.jsonが取得できない場合", async () => {
			mockFetch.mockRejectedValue(new Error("Network error"));

			const health = await checkPWAHealth();

			expect(health.manifest).toBe(false);
		});
	});
});
