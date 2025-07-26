/**
 * フロントエンドロガー 型定義
 *
 * ブラウザ環境に特化したロガーシステムの型定義
 * APIロガーとの一貫性を保ちつつ、フロントエンド固有の要件に対応
 */

/**
 * ログレベルの定義
 * debug: 詳細なデバッグ情報（開発環境のみ）
 * info: 正常な操作の記録
 * warn: 回復可能なエラー・警告
 * error: システムエラー・失敗
 */
export type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * 実行環境の定義
 * development: 開発環境
 * production: 本番環境
 * storybook: Storybook環境
 */
export type Environment = "development" | "production" | "storybook";

/**
 * フロントエンド固有のログメタデータ
 * ブラウザ環境とユーザー操作に特化した追加情報を格納
 */
export interface FrontendLogMeta {
	// 基本識別情報
	requestId?: string;
	userId?: string;
	sessionId?: string;

	// フロントエンド固有情報
	component?: string;
	action?: string;
	url?: string;
	userAgent?: string;

	// パフォーマンス関連
	duration?: number;
	loadTime?: number;
	renderTime?: number;
	memoryUsage?: number;

	// ユーザー操作情報
	elementId?: string;
	clickPosition?: { x: number; y: number };
	scrollPosition?: { x: number; y: number };
	keyboardInput?: string;

	// 画面・ネットワーク状態
	viewport?: { width: number; height: number };
	networkType?: string;
	isOnline?: boolean;
	isVisible?: boolean;

	// エラー情報
	error?: string;
	stack?: string;
	errorBoundary?: string;

	// Storybook固有情報
	storyId?: string;
	storyName?: string;

	// 拡張可能な追加データ
	data?: Record<string, unknown>;
	[key: string]: unknown;
}

/**
 * フロントエンドログエントリの構造定義
 * 全てのログが従う統一フォーマット
 */
export interface FrontendLogEntry {
	timestamp: string;
	level: LogLevel;
	message: string;
	requestId: string;
	sessionId: string;
	environment: Environment;
	service: "saifuu-frontend";
	version: string;
	url: string;
	deviceInfo: {
		userAgent: string;
		viewport: { width: number; height: number };
		language: string;
		timezone: string;
	};
	meta: FrontendLogMeta;
}

/**
 * ブラウザロガー設定の型定義
 */
export interface BrowserLoggerConfig {
	// 基本設定
	environment: Environment;
	level: LogLevel;
	version: string;

	// バッファリング設定
	bufferSize: number;
	flushInterval: number;
	maxRetries: number;

	// 出力設定
	enableConsole: boolean;
	enableLocalStorage: boolean;
	enableBeacon: boolean;

	// API設定
	apiEndpoint?: string;
	apiTimeout: number;

	// トラッキング設定
	enablePerformanceTracking: boolean;
	enableUserTracking: boolean;
	enableNetworkTracking: boolean;
	enableErrorTracking: boolean;

	// セッション設定
	sessionTimeout: number;
	persistSession: boolean;

	// フィルタリング設定
	excludePatterns?: string[];
	includeOnlyPatterns?: string[];

	// プライバシー設定
	sensitiveFields?: string[];
	maskSensitiveData: boolean;
}

/**
 * フロントエンドロガーインターフェース
 * 全てのフロントエンドロガー実装が従う共通インターフェース
 */
export interface FrontendLogger {
	// 基本ログメソッド
	debug(message: string, meta?: FrontendLogMeta): void;
	info(message: string, meta?: FrontendLogMeta): void;
	warn(message: string, meta?: FrontendLogMeta): void;
	error(message: string, meta?: FrontendLogMeta): void;

	// フロントエンド固有メソッド
	track(event: string, properties?: FrontendLogMeta): void;
	pageView(path: string, meta?: FrontendLogMeta): void;
	userInteraction(
		action: string,
		element?: string,
		meta?: FrontendLogMeta,
	): void;
	apiCall(endpoint: string, method: string, meta?: FrontendLogMeta): void;
	performance(metric: string, value: number, meta?: FrontendLogMeta): void;

	// セッション管理
	startSession(): string;
	endSession(): void;
	setUserId(userId: string): void;
	setComponent(componentName: string): void;

	// バッファ管理
	flush(): Promise<void>;
	clear(): void;
	getBufferSize(): number;

	// 設定管理
	setLevel(level: LogLevel): void;
	getConfig(): BrowserLoggerConfig;
	updateConfig(config: Partial<BrowserLoggerConfig>): void;

	// イベントリスナー管理
	addEventListeners(): void;
	removeEventListeners(): void;

	// クリーンアップ
	destroy(): void;
}

/**
 * ログバッファのエントリ型
 */
export interface BufferedLogEntry {
	entry: FrontendLogEntry;
	attempts: number;
	lastAttempt: number;
}

/**
 * セッション情報の型定義
 */
export interface SessionInfo {
	id: string;
	startTime: number;
	lastActivity: number;
	userId?: string;
	pageViews: number;
	events: number;
	errors: number;
}

/**
 * エラー情報の型定義
 */
export interface ErrorInfo {
	name: string;
	message: string;
	stack?: string;
	fileName?: string;
	lineNumber?: number;
	columnNumber?: number;
	componentStack?: string;
}

/**
 * ネットワーク情報の型定義
 */
export interface NetworkInfo {
	type?: string;
	effectiveType?: string;
	downlink?: number;
	rtt?: number;
	isOnline: boolean;
}

/**
 * デバイス情報の型定義
 */
export interface DeviceInfo {
	userAgent: string;
	platform: string;
	language: string;
	languages: readonly string[];
	timezone: string;
	viewport: { width: number; height: number };
	screen: { width: number; height: number };
	pixelRatio: number;
	touchSupport: boolean;
	cookieEnabled: boolean;
}

/**
 * ログ送信結果の型定義
 */
export interface LogSendResult {
	success: boolean;
	statusCode?: number;
	error?: string;
	sentCount: number;
	failedCount: number;
	retryAfter?: number;
}

/**
 * 環境固有設定のオーバーライド型
 */
export interface EnvironmentConfig {
	development?: Partial<BrowserLoggerConfig>;
	production?: Partial<BrowserLoggerConfig>;
	storybook?: Partial<BrowserLoggerConfig>;
}

/**
 * ログフィルターの関数型
 */
export type LogFilter = (entry: FrontendLogEntry) => boolean;

/**
 * ログ変換器の関数型
 */
export type LogTransformer = (entry: FrontendLogEntry) => FrontendLogEntry;

/**
 * ログ送信器の関数型
 */
export type LogSender = (entries: FrontendLogEntry[]) => Promise<LogSendResult>;
