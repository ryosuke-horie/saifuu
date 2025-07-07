/**
 * PWA関連の型定義
 * Progressive Web App機能の型安全性を確保
 */

/**
 * サービスワーカーの状態
 */
export interface ServiceWorkerState {
	isRegistered: boolean;
	isUpdateAvailable: boolean;
	isOffline: boolean;
	registration: ServiceWorkerRegistration | null;
	error: string | null;
}

/**
 * サービスワーカーのキャッシュ戦略
 */
export type CacheStrategy =
	| "cache-first" // キャッシュファースト（静的リソース）
	| "network-first" // ネットワークファースト（動的コンテンツ）
	| "cache-only" // キャッシュのみ
	| "network-only" // ネットワークのみ（機密データ）
	| "stale-while-revalidate"; // Stale While Revalidate

/**
 * キャッシュ設定
 */
export interface CacheConfig {
	name: string;
	strategy: CacheStrategy;
	maxAge?: number;
	maxEntries?: number;
	patterns: RegExp[];
	excludePatterns?: RegExp[];
}

/**
 * プッシュ通知のペイロード
 */
export interface PushNotificationPayload {
	title: string;
	body: string;
	icon?: string;
	badge?: string;
	image?: string;
	data?: Record<string, any>;
	actions?: NotificationAction[];
	tag?: string;
	vibrate?: number[];
	silent?: boolean;
	requireInteraction?: boolean;
}

/**
 * 通知アクション
 */
export interface NotificationAction {
	action: string;
	title: string;
	icon?: string;
}

/**
 * PWAインストールプロンプトの状態
 */
export interface PWAInstallState {
	isAvailable: boolean;
	isInstalled: boolean;
	isPromptShown: boolean;
	userChoice: "accepted" | "dismissed" | null;
}

/**
 * PWAアナリティクス用のデータ
 */
export interface PWAAnalyticsData {
	event: "install" | "activate" | "fetch" | "push" | "background-sync";
	timestamp: string;
	url?: string;
	userAgent?: string;
	deviceCategory?: "mobile" | "tablet" | "desktop";
	networkType?: string;
	isOffline?: boolean;
	cacheHit?: boolean;
	metadata?: Record<string, any>;
}

/**
 * ネットワーク接続情報
 */
export interface NetworkInfo {
	type: string;
	effectiveType: string;
	downlink: number;
	rtt: number;
	saveData: boolean;
}

/**
 * バッテリー情報
 */
export interface BatteryInfo {
	level: number;
	charging: boolean;
	chargingTime: number;
	dischargingTime: number;
}

/**
 * PWAの健全性チェック結果
 */
export interface PWAHealthCheck {
	serviceWorker: boolean;
	manifest: boolean;
	https: boolean;
	offline: boolean;
	notifications: boolean;
	score: number;
	timestamp: string;
}

/**
 * オフライン時のデータ同期用のキュー
 */
export interface SyncQueueItem {
	id: string;
	type: "create" | "update" | "delete";
	endpoint: string;
	data: any;
	timestamp: string;
	retryCount: number;
	maxRetries: number;
}

/**
 * PWA設定
 */
export interface PWAConfig {
	enableServiceWorker: boolean;
	enablePushNotifications: boolean;
	enableBackgroundSync: boolean;
	enableInstallPrompt: boolean;
	cacheConfigs: CacheConfig[];
	vapidKey?: string;
	offlineFallbackPage: string;
	analyticsEnabled: boolean;
}

/**
 * 財務アプリ固有のPWA設定
 */
export interface FinancePWAConfig extends PWAConfig {
	sensitiveDataCaching: boolean;
	offlineTransactionLimit: number;
	syncInterval: number;
	securityLevel: "low" | "medium" | "high";
	encryptSensitiveData: boolean;
}

/**
 * PWAイベント
 */
export type PWAEvent =
	| "sw-registered"
	| "sw-updated"
	| "sw-offline"
	| "sw-online"
	| "install-prompt-available"
	| "install-prompt-shown"
	| "app-installed"
	| "push-received"
	| "background-sync"
	| "cache-updated";

/**
 * PWAイベントハンドラー
 */
export type PWAEventHandler = (event: PWAEvent, data?: any) => void;

/**
 * PWAマネージャーのインターface
 */
export interface PWAManager {
	isSupported(): boolean;
	register(): Promise<ServiceWorkerRegistration>;
	update(): Promise<void>;
	unregister(): Promise<void>;
	getState(): ServiceWorkerState;
	addEventListener(event: PWAEvent, handler: PWAEventHandler): void;
	removeEventListener(event: PWAEvent, handler: PWAEventHandler): void;
	requestInstallPrompt(): Promise<boolean>;
	requestNotificationPermission(): Promise<boolean>;
	subscribeToPushNotifications(): Promise<PushSubscription | null>;
	clearCache(): Promise<void>;
	getCacheStatus(): Promise<any>;
}

/**
 * PWAのメタデータ
 */
export interface PWAMetadata {
	name: string;
	shortName: string;
	description: string;
	version: string;
	build: string;
	lastUpdated: string;
	features: string[];
	permissions: string[];
}

/**
 * PWAパフォーマンス指標
 */
export interface PWAPerformanceMetrics {
	serviceWorkerInstallTime: number;
	serviceWorkerActivateTime: number;
	cacheHitRate: number;
	averageResponseTime: number;
	offlineEvents: number;
	pushNotificationDelivered: number;
	backgroundSyncEvents: number;
}

/**
 * PWAストレージ情報
 */
export interface PWAStorageInfo {
	quota: number;
	usage: number;
	cacheSize: number;
	indexedDBSize: number;
	localStorageSize: number;
	sessionStorageSize: number;
}
