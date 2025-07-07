/**
 * PWA関連のユーティリティ関数
 * プログレッシブウェブアプリケーションの機能を管理
 */

/**
 * PWAがインストール可能かどうかを判定
 */
export function isPWAInstallable(): boolean {
	return typeof window !== "undefined" && "serviceWorker" in navigator;
}

/**
 * PWAがインストール済みかどうかを判定
 */
export function isPWAInstalled(): boolean {
	if (typeof window === "undefined") return false;

	// スタンドアロンモードで実行されているかチェック
	return (
		window.matchMedia("(display-mode: standalone)").matches ||
		// Safari用のプロパティ
		(window.navigator as any).standalone === true
	);
}

/**
 * オフライン状態かどうかを判定
 */
export function isOffline(): boolean {
	return typeof window !== "undefined" && !navigator.onLine;
}

/**
 * オンライン状態かどうかを判定
 */
export function isOnline(): boolean {
	return typeof window !== "undefined" && navigator.onLine;
}

/**
 * ネットワーク接続タイプを取得
 */
export function getNetworkType(): string {
	if (typeof window === "undefined") return "unknown";

	// Network Information API
	const connection =
		(navigator as any).connection ||
		(navigator as any).mozConnection ||
		(navigator as any).webkitConnection;

	if (connection) {
		return connection.effectiveType || connection.type || "unknown";
	}

	return "unknown";
}

/**
 * バッテリー情報を取得
 */
export async function getBatteryInfo(): Promise<{
	level: number;
	charging: boolean;
	chargingTime: number;
	dischargingTime: number;
} | null> {
	if (typeof window === "undefined" || !("getBattery" in navigator)) {
		return null;
	}

	try {
		// Battery API
		const battery = await (navigator as any).getBattery();
		return {
			level: battery.level,
			charging: battery.charging,
			chargingTime: battery.chargingTime,
			dischargingTime: battery.dischargingTime,
		};
	} catch (error) {
		console.warn("[PWA] Battery API not available:", error);
		return null;
	}
}

/**
 * デバイスの画面サイズカテゴリを取得
 */
export function getDeviceCategory(): "mobile" | "tablet" | "desktop" {
	if (typeof window === "undefined") return "desktop";

	const width = window.innerWidth;

	if (width < 768) {
		return "mobile";
	}
	if (width < 1024) {
		return "tablet";
	}
	return "desktop";
}

/**
 * PWAインストールプロンプトを表示
 */
export class PWAInstallPrompt {
	private deferredPrompt: any = null;

	constructor() {
		if (typeof window !== "undefined") {
			this.setupPromptListener();
		}
	}

	private setupPromptListener() {
		window.addEventListener("beforeinstallprompt", (e) => {
			console.log("[PWA] Install prompt available");
			// デフォルトのインストールプロンプトを防ぐ
			e.preventDefault();
			this.deferredPrompt = e;
		});

		window.addEventListener("appinstalled", (_e) => {
			console.log("[PWA] App installed");
			this.deferredPrompt = null;
		});
	}

	/**
	 * インストールプロンプトが利用可能か確認
	 */
	isAvailable(): boolean {
		return this.deferredPrompt !== null;
	}

	/**
	 * インストールプロンプトを表示
	 */
	async show(): Promise<boolean> {
		if (!this.deferredPrompt) {
			console.warn("[PWA] Install prompt not available");
			return false;
		}

		try {
			// インストールプロンプトを表示
			this.deferredPrompt.prompt();

			// ユーザーの選択を待つ
			const { outcome } = await this.deferredPrompt.userChoice;

			console.log("[PWA] Install prompt result:", outcome);

			// プロンプトを使用済みとしてクリア
			this.deferredPrompt = null;

			return outcome === "accepted";
		} catch (error) {
			console.error("[PWA] Install prompt error:", error);
			return false;
		}
	}
}

/**
 * 財務データの機密性を考慮したキャッシュ戦略
 */
export const CacheStrategies = {
	/**
	 * 機密データかどうかを判定
	 */
	isSensitiveData(url: string): boolean {
		const sensitivePatterns = [
			/\/api\/transactions/,
			/\/api\/subscriptions/,
			/\/api\/auth/,
			/\/api\/user/,
			/\/api\/payment/,
		];

		return sensitivePatterns.some((pattern) => pattern.test(url));
	},

	/**
	 * 静的リソースかどうかを判定
	 */
	isStaticResource(url: string): boolean {
		const staticPatterns = [
			/\/_next\/static/,
			/\.(css|js|woff|woff2|png|jpg|jpeg|gif|svg|ico)$/,
			/\/manifest\.json$/,
			/\/robots\.txt$/,
		];

		return staticPatterns.some((pattern) => pattern.test(url));
	},

	/**
	 * キャッシュ可能なAPIかどうかを判定
	 */
	isCacheableAPI(url: string): boolean {
		const cacheablePatterns = [
			/\/api\/categories/,
			/\/api\/health/,
			/\/api\/config/,
		];

		return cacheablePatterns.some((pattern) => pattern.test(url));
	},
};

/**
 * PWAアナリティクス用の情報を収集
 */
export function collectPWAAnalytics() {
	if (typeof window === "undefined") return null;

	return {
		isPWAInstalled: isPWAInstalled(),
		isOffline: isOffline(),
		networkType: getNetworkType(),
		deviceCategory: getDeviceCategory(),
		userAgent: navigator.userAgent,
		timestamp: new Date().toISOString(),
		url: window.location.href,
		referrer: document.referrer || "direct",
	};
}

/**
 * PWAの状態をローカルストレージに保存
 */
export function savePWAState(state: any): void {
	if (typeof window === "undefined") return;

	try {
		localStorage.setItem(
			"pwa-state",
			JSON.stringify({
				...state,
				timestamp: new Date().toISOString(),
			}),
		);
	} catch (error) {
		console.warn("[PWA] Failed to save state:", error);
	}
}

/**
 * PWAの状態をローカルストレージから読み込み
 */
export function loadPWAState(): any | null {
	if (typeof window === "undefined") return null;

	try {
		const state = localStorage.getItem("pwa-state");
		return state ? JSON.parse(state) : null;
	} catch (error) {
		console.warn("[PWA] Failed to load state:", error);
		return null;
	}
}

/**
 * PWAの状態をリセット
 */
export function clearPWAState(): void {
	if (typeof window === "undefined") return;

	try {
		localStorage.removeItem("pwa-state");
	} catch (error) {
		console.warn("[PWA] Failed to clear state:", error);
	}
}

/**
 * PWAの健全性をチェック
 */
export async function checkPWAHealth(): Promise<{
	serviceWorker: boolean;
	manifest: boolean;
	https: boolean;
	offline: boolean;
	notifications: boolean;
}> {
	const results = {
		serviceWorker: false,
		manifest: false,
		https: false,
		offline: false,
		notifications: false,
	};

	if (typeof window === "undefined") return results;

	try {
		// Service Worker サポート
		results.serviceWorker = "serviceWorker" in navigator;

		// HTTPS または localhost
		results.https =
			location.protocol === "https:" || location.hostname === "localhost";

		// Web App Manifest
		try {
			const response = await fetch("/manifest.json");
			results.manifest = response.ok;
		} catch (_error) {
			results.manifest = false;
		}

		// オフライン対応
		results.offline = "onLine" in navigator;

		// プッシュ通知
		results.notifications = "Notification" in window;
	} catch (error) {
		console.error("[PWA] Health check failed:", error);
	}

	return results;
}
