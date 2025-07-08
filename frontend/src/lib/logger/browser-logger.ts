/**
 * ブラウザロガー実装
 *
 * フロントエンド環境に最適化された高性能ログシステム
 * バッファリング、ブラウザイベント連携、セッション管理を統合
 */

import { shouldLog } from "./config";
import type {
	BrowserLoggerConfig,
	BufferedLogEntry,
	DeviceInfo,
	FrontendLogEntry,
	FrontendLogger,
	FrontendLogMeta,
	LogLevel,
	LogSendResult,
	NetworkInfo,
	SessionInfo,
} from "./types";

/**
 * ブラウザロガー実装クラス
 * フロントエンド環境に特化した高性能ログシステム
 */
export class BrowserLogger implements FrontendLogger {
	private config: BrowserLoggerConfig;
	private buffer: BufferedLogEntry[] = [];
	private sessionInfo: SessionInfo;
	private currentComponent?: string;
	private userId?: string;
	private deviceInfo: DeviceInfo;
	private networkInfo: NetworkInfo;
	private flushTimer?: NodeJS.Timeout;
	private isDestroyed = false;
	private eventListenersAdded = false;

	// バインドされたイベントハンドラー
	private boundHandlers = {
		beforeUnload: this.handleBeforeUnload.bind(this),
		visibilityChange: this.handleVisibilityChange.bind(this),
		error: this.handleGlobalError.bind(this),
		unhandledRejection: this.handleUnhandledRejection.bind(this),
		online: this.handleOnlineChange.bind(this),
		offline: this.handleOfflineChange.bind(this),
	};

	constructor(config: BrowserLoggerConfig) {
		this.config = config;
		this.sessionInfo = this.initializeSession();
		this.deviceInfo = this.collectDeviceInfo();
		this.networkInfo = this.collectNetworkInfo();

		// 自動フラッシュタイマーの設定
		this.setupFlushTimer();

		// イベントリスナーの設定
		if (typeof window !== "undefined") {
			this.addEventListeners();
		}

		// 初期化ログ
		this.info("BrowserLogger initialized", {
			sessionId: this.sessionInfo.id,
			environment: this.config.environment,
			version: this.config.version,
			bufferSize: this.config.bufferSize,
		});
	}

	// ===== 基本ログメソッド =====

	debug(message: string, meta: FrontendLogMeta = {}): void {
		this.log("debug", message, meta);
	}

	info(message: string, meta: FrontendLogMeta = {}): void {
		this.log("info", message, meta);
	}

	warn(message: string, meta: FrontendLogMeta = {}): void {
		this.log("warn", message, meta);
	}

	error(message: string, meta: FrontendLogMeta = {}): void {
		this.log("error", message, meta);
	}

	// ===== フロントエンド固有メソッド =====

	track(event: string, properties: FrontendLogMeta = {}): void {
		this.log("info", `Track: ${event}`, {
			...properties,
			action: "track",
			event,
		});
	}

	pageView(path: string, meta: FrontendLogMeta = {}): void {
		this.sessionInfo.pageViews++;
		this.log("info", `Page view: ${path}`, {
			...meta,
			action: "pageview",
			url: path,
		});
	}

	userInteraction(
		action: string,
		element?: string,
		meta: FrontendLogMeta = {},
	): void {
		this.sessionInfo.events++;
		this.log("info", `User interaction: ${action}`, {
			...meta,
			action: "user_interaction",
			elementId: element,
		});
	}

	apiCall(endpoint: string, method: string, meta: FrontendLogMeta = {}): void {
		this.log("info", `API call: ${method} ${endpoint}`, {
			...meta,
			action: "api_call",
			url: endpoint,
			data: { method, endpoint, ...meta.data },
		});
	}

	performance(metric: string, value: number, meta: FrontendLogMeta = {}): void {
		if (this.config.enablePerformanceTracking) {
			this.log("info", `Performance: ${metric}`, {
				...meta,
				action: "performance",
				duration: value,
				data: { metric, value, ...meta.data },
			});
		}
	}

	// ===== セッション管理 =====

	startSession(): string {
		this.sessionInfo = this.initializeSession();
		this.info("Session started", { sessionId: this.sessionInfo.id });
		return this.sessionInfo.id;
	}

	endSession(): void {
		const duration = Date.now() - this.sessionInfo.startTime;
		this.info("Session ended", {
			sessionId: this.sessionInfo.id,
			duration,
			pageViews: this.sessionInfo.pageViews,
			events: this.sessionInfo.events,
			errors: this.sessionInfo.errors,
		});

		// セッション終了前に強制フラッシュ
		this.flush();
	}

	setUserId(userId: string): void {
		this.userId = userId;
		this.sessionInfo.userId = userId;
		this.info("User ID set", { userId });
	}

	setComponent(componentName: string): void {
		this.currentComponent = componentName;
	}

	// ===== バッファ管理 =====

	async flush(): Promise<void> {
		if (this.buffer.length === 0) return;

		const entriesToSend = [...this.buffer];
		this.buffer = [];

		try {
			const result = await this.sendLogs(
				entriesToSend.map((item) => item.entry),
			);

			// 失敗したエントリを再バッファリング
			if (!result.success && result.failedCount > 0) {
				const failedEntries = entriesToSend.slice(-result.failedCount);
				failedEntries.forEach((entry) => {
					entry.attempts++;
					entry.lastAttempt = Date.now();
					if (entry.attempts <= this.config.maxRetries) {
						this.buffer.push(entry);
					}
				});
			}
		} catch (error) {
			// エラー時は元のエントリを再バッファリング
			entriesToSend.forEach((entry) => {
				entry.attempts++;
				entry.lastAttempt = Date.now();
				if (entry.attempts <= this.config.maxRetries) {
					this.buffer.push(entry);
				}
			});

			console.warn("Failed to flush logs:", error);
		}
	}

	clear(): void {
		this.buffer = [];
	}

	getBufferSize(): number {
		return this.buffer.length;
	}

	// ===== 設定管理 =====

	setLevel(level: LogLevel): void {
		this.config.level = level;
		this.info("Log level changed", { level });
	}

	getConfig(): BrowserLoggerConfig {
		return { ...this.config };
	}

	updateConfig(newConfig: Partial<BrowserLoggerConfig>): void {
		const oldConfig = this.config;
		this.config = { ...this.config, ...newConfig };

		// フラッシュ間隔が変更された場合はタイマーを再設定
		if (oldConfig.flushInterval !== this.config.flushInterval) {
			this.setupFlushTimer();
		}

		this.info("Configuration updated", { changes: newConfig });
	}

	// ===== イベントリスナー管理 =====

	addEventListeners(): void {
		if (this.eventListenersAdded || typeof window === "undefined") return;

		window.addEventListener("beforeunload", this.boundHandlers.beforeUnload);
		document.addEventListener(
			"visibilitychange",
			this.boundHandlers.visibilityChange,
		);
		window.addEventListener("error", this.boundHandlers.error);
		window.addEventListener(
			"unhandledrejection",
			this.boundHandlers.unhandledRejection,
		);
		window.addEventListener("online", this.boundHandlers.online);
		window.addEventListener("offline", this.boundHandlers.offline);

		this.eventListenersAdded = true;
	}

	removeEventListeners(): void {
		if (!this.eventListenersAdded || typeof window === "undefined") return;

		window.removeEventListener("beforeunload", this.boundHandlers.beforeUnload);
		document.removeEventListener(
			"visibilitychange",
			this.boundHandlers.visibilityChange,
		);
		window.removeEventListener("error", this.boundHandlers.error);
		window.removeEventListener(
			"unhandledrejection",
			this.boundHandlers.unhandledRejection,
		);
		window.removeEventListener("online", this.boundHandlers.online);
		window.removeEventListener("offline", this.boundHandlers.offline);

		this.eventListenersAdded = false;
	}

	// ===== クリーンアップ =====

	destroy(): void {
		if (this.isDestroyed) return;

		this.endSession();
		this.removeEventListeners();

		if (this.flushTimer) {
			clearInterval(this.flushTimer);
			this.flushTimer = undefined;
		}

		this.isDestroyed = true;
	}

	// ===== プライベートメソッド =====

	private log(level: LogLevel, message: string, meta: FrontendLogMeta): void {
		if (this.isDestroyed || !shouldLog(this.config.level, level)) return;

		// セッション更新
		this.sessionInfo.lastActivity = Date.now();
		if (level === "error") {
			this.sessionInfo.errors++;
		}

		// ログエントリ作成
		const entry = this.createLogEntry(level, message, meta);

		// コンソール出力
		if (this.config.enableConsole) {
			this.outputToConsole(level, message, meta);
		}

		// バッファに追加
		this.addToBuffer(entry);

		// バッファサイズ制限チェック
		if (this.buffer.length >= this.config.bufferSize) {
			this.flush();
		}
	}

	private createLogEntry(
		level: LogLevel,
		message: string,
		meta: FrontendLogMeta,
	): FrontendLogEntry {
		const now = new Date().toISOString();
		const requestId = meta.requestId || this.generateRequestId();

		// メタデータの拡張
		const enhancedMeta: FrontendLogMeta = {
			...meta,
			sessionId: this.sessionInfo.id,
			component: meta.component || this.currentComponent,
			userId: meta.userId || this.userId,
			isOnline: this.networkInfo.isOnline,
			viewport: this.deviceInfo.viewport,
		};

		// 機密データのマスキング
		if (this.config.maskSensitiveData) {
			this.maskSensitiveFields(enhancedMeta);
		}

		return {
			timestamp: now,
			level,
			message,
			requestId,
			sessionId: this.sessionInfo.id,
			environment: this.config.environment,
			service: "saifuu-frontend",
			version: this.config.version,
			url: typeof window !== "undefined" ? window.location.href : "",
			deviceInfo: this.deviceInfo,
			meta: enhancedMeta,
		};
	}

	private addToBuffer(entry: FrontendLogEntry): void {
		const bufferedEntry: BufferedLogEntry = {
			entry,
			attempts: 0,
			lastAttempt: 0,
		};

		this.buffer.push(bufferedEntry);

		// ローカルストレージ永続化
		if (this.config.enableLocalStorage) {
			this.saveToLocalStorage();
		}
	}

	private async sendLogs(entries: FrontendLogEntry[]): Promise<LogSendResult> {
		if (!this.config.apiEndpoint) {
			return { success: true, sentCount: entries.length, failedCount: 0 };
		}

		try {
			const response = await this.sendWithFetch(entries);
			return {
				success: response.ok,
				statusCode: response.status,
				sentCount: response.ok ? entries.length : 0,
				failedCount: response.ok ? 0 : entries.length,
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
				sentCount: 0,
				failedCount: entries.length,
			};
		}
	}

	private async sendWithFetch(entries: FrontendLogEntry[]): Promise<Response> {
		const controller = new AbortController();
		const timeoutId = setTimeout(
			() => controller.abort(),
			this.config.apiTimeout,
		);

		try {
			const response = await fetch(this.config.apiEndpoint!, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ logs: entries }),
				signal: controller.signal,
			});

			return response;
		} finally {
			clearTimeout(timeoutId);
		}
	}

	private outputToConsole(
		level: LogLevel,
		message: string,
		meta: FrontendLogMeta,
	): void {
		const consoleMethod = level === "debug" ? "log" : level;
		const timestamp = new Date().toISOString();
		const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

		if (Object.keys(meta).length > 0) {
			console[consoleMethod](`${prefix} ${message}`, meta);
		} else {
			console[consoleMethod](`${prefix} ${message}`);
		}
	}

	private initializeSession(): SessionInfo {
		const sessionId = this.generateSessionId();
		return {
			id: sessionId,
			startTime: Date.now(),
			lastActivity: Date.now(),
			userId: this.userId,
			pageViews: 0,
			events: 0,
			errors: 0,
		};
	}

	private collectDeviceInfo(): DeviceInfo {
		if (typeof window === "undefined") {
			return {
				userAgent: "",
				platform: "",
				language: "en-US",
				languages: ["en-US"],
				timezone: "UTC",
				viewport: { width: 0, height: 0 },
				screen: { width: 0, height: 0 },
				pixelRatio: 1,
				touchSupport: false,
				cookieEnabled: false,
			};
		}

		return {
			userAgent: navigator.userAgent,
			platform: navigator.platform,
			language: navigator.language,
			languages: navigator.languages,
			timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
			viewport: {
				width: window.innerWidth,
				height: window.innerHeight,
			},
			screen: {
				width: window.screen.width,
				height: window.screen.height,
			},
			pixelRatio: window.devicePixelRatio || 1,
			touchSupport: "ontouchstart" in window,
			cookieEnabled: navigator.cookieEnabled,
		};
	}

	private collectNetworkInfo(): NetworkInfo {
		if (typeof navigator === "undefined") {
			return { isOnline: true };
		}

		const connection =
			(navigator as any).connection ||
			(navigator as any).mozConnection ||
			(navigator as any).webkitConnection;

		return {
			type: connection?.type,
			effectiveType: connection?.effectiveType,
			downlink: connection?.downlink,
			rtt: connection?.rtt,
			isOnline: navigator.onLine,
		};
	}

	private setupFlushTimer(): void {
		if (this.flushTimer) {
			clearInterval(this.flushTimer);
		}

		this.flushTimer = setInterval(() => {
			if (this.buffer.length > 0) {
				this.flush();
			}
		}, this.config.flushInterval);
	}

	private generateSessionId(): string {
		return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	private generateRequestId(): string {
		return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	private maskSensitiveFields(meta: FrontendLogMeta): void {
		if (!this.config.sensitiveFields) return;

		this.config.sensitiveFields.forEach((field) => {
			if (field in meta && meta[field]) {
				meta[field] = "[MASKED]";
			}
		});
	}

	private saveToLocalStorage(): void {
		try {
			const storageData = {
				sessionId: this.sessionInfo.id,
				buffer: this.buffer.slice(-10), // 最新10件のみ保存
				lastSaved: Date.now(),
			};
			localStorage.setItem("saifuu_logger", JSON.stringify(storageData));
		} catch {
			// LocalStorage無効時やクォータ超過時は無視
		}
	}

	// ===== イベントハンドラー =====

	private handleBeforeUnload(): void {
		// ページ離脱時にログをフラッシュ
		if (
			this.config.enableBeacon &&
			navigator.sendBeacon &&
			this.config.apiEndpoint
		) {
			const entries = this.buffer.map((item) => item.entry);
			if (entries.length > 0) {
				navigator.sendBeacon(
					this.config.apiEndpoint,
					JSON.stringify({ logs: entries }),
				);
				this.clear();
			}
		} else {
			// Beacon APIが利用できない場合は同期的にフラッシュ
			this.flush();
		}
	}

	private handleVisibilityChange(): void {
		if (document.visibilityState === "visible") {
			this.info("Page became visible");
		} else {
			this.info("Page became hidden");
			// ページが隠れた時にフラッシュ
			this.flush();
		}
	}

	private handleGlobalError(event: ErrorEvent): void {
		if (this.config.enableErrorTracking) {
			this.error("Global error caught", {
				error: event.error?.name || "Error",
				stack: event.error?.stack,
				message: event.message,
				fileName: event.filename,
				lineNumber: event.lineno,
				columnNumber: event.colno,
			});
		}
	}

	private handleUnhandledRejection(event: PromiseRejectionEvent): void {
		if (this.config.enableErrorTracking) {
			this.error("Unhandled promise rejection", {
				error: event.reason?.name || "UnhandledRejection",
				stack: event.reason?.stack,
				message: event.reason?.message || String(event.reason),
			});
		}
	}

	private handleOnlineChange(): void {
		this.networkInfo.isOnline = true;
		this.info("Network connection restored");
		// オンライン復帰時にバッファをフラッシュ
		this.flush();
	}

	private handleOfflineChange(): void {
		this.networkInfo.isOnline = false;
		this.warn("Network connection lost");
	}
}

/**
 * ブラウザロガー作成ヘルパー関数
 * @param config ロガー設定
 * @returns BrowserLoggerインスタンス
 */
export const createBrowserLogger = (
	config: BrowserLoggerConfig,
): BrowserLogger => {
	return new BrowserLogger(config);
};
