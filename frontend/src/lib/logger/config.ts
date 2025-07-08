/**
 * フロントエンドロガー 設定システム
 *
 * 3環境（development, production, storybook）対応の設定管理
 * 環境変数とデフォルト値の統合、セキュリティ考慮した設定システム
 */

import type {
	BrowserLoggerConfig,
	Environment,
	EnvironmentConfig,
	LogLevel,
} from "./types";

/**
 * 環境変数の型定義
 * Next.js環境変数とブラウザ環境変数に対応
 */
interface EnvironmentVariables {
	NODE_ENV?: string;
	NEXT_PUBLIC_LOG_LEVEL?: string;
	NEXT_PUBLIC_LOG_BUFFER_SIZE?: string;
	NEXT_PUBLIC_LOG_FLUSH_INTERVAL?: string;
	NEXT_PUBLIC_LOG_API_ENDPOINT?: string;
	NEXT_PUBLIC_LOG_API_TIMEOUT?: string;
	NEXT_PUBLIC_LOG_ENABLE_CONSOLE?: string;
	NEXT_PUBLIC_LOG_ENABLE_TRACKING?: string;
	NEXT_PUBLIC_VERSION?: string;
	STORYBOOK?: string;
	[key: string]: string | undefined;
}

/**
 * デフォルト設定定義
 * 環境別の最適化された設定値
 */
const defaultConfigs: Record<Environment, BrowserLoggerConfig> = {
	development: {
		environment: "development",
		level: "debug",
		version: "1.0.0",
		bufferSize: 10,
		flushInterval: 1000, // 1秒
		maxRetries: 2,
		enableConsole: true,
		enableLocalStorage: true,
		enableBeacon: false,
		apiTimeout: 5000,
		enablePerformanceTracking: true,
		enableUserTracking: true,
		enableNetworkTracking: true,
		enableErrorTracking: true,
		sessionTimeout: 30 * 60 * 1000, // 30分
		persistSession: true,
		maskSensitiveData: false,
		sensitiveFields: ["password", "token", "secret"],
	},
	production: {
		environment: "production",
		level: "info",
		version: "1.0.0",
		bufferSize: 100,
		flushInterval: 10000, // 10秒
		maxRetries: 5,
		enableConsole: false,
		enableLocalStorage: false,
		enableBeacon: true,
		apiTimeout: 10000,
		enablePerformanceTracking: true,
		enableUserTracking: true,
		enableNetworkTracking: false,
		enableErrorTracking: true,
		sessionTimeout: 60 * 60 * 1000, // 60分
		persistSession: false,
		maskSensitiveData: true,
		sensitiveFields: ["password", "token", "secret", "email", "phone"],
	},
	storybook: {
		environment: "storybook",
		level: "warn",
		version: "1.0.0",
		bufferSize: 5,
		flushInterval: 500, // 0.5秒
		maxRetries: 1,
		enableConsole: true,
		enableLocalStorage: false,
		enableBeacon: false,
		apiTimeout: 3000,
		enablePerformanceTracking: false,
		enableUserTracking: false,
		enableNetworkTracking: false,
		enableErrorTracking: true,
		sessionTimeout: 10 * 60 * 1000, // 10分
		persistSession: false,
		maskSensitiveData: false,
		sensitiveFields: [],
	},
};

/**
 * 現在の環境を判定
 * @param env 環境変数オブジェクト
 * @returns 判定された環境
 */
export const detectEnvironment = (
	env: EnvironmentVariables = {},
): Environment => {
	// Storybook環境の検出
	if (
		env.STORYBOOK === "true" ||
		(typeof window !== "undefined" && (window as any).__STORYBOOK_ADDONS)
	) {
		return "storybook";
	}

	// Next.js環境の検出
	const nodeEnv =
		env.NODE_ENV ||
		(typeof process !== "undefined" ? process.env?.NODE_ENV : undefined);

	if (nodeEnv === "development") {
		return "development";
	}

	if (nodeEnv === "production") {
		return "production";
	}

	// フォールバック（ブラウザ環境での判定）
	if (typeof window !== "undefined") {
		// 開発環境の特徴を検出
		if (
			window.location.hostname === "localhost" ||
			window.location.hostname === "127.0.0.1" ||
			window.location.hostname.includes("dev")
		) {
			return "development";
		}
	}

	// デフォルトは本番環境として扱う
	return "production";
};

/**
 * 環境変数からロガー設定を生成
 * @param env 環境変数オブジェクト
 * @returns ロガー設定
 */
export const createLoggerConfig = (
	env: EnvironmentVariables = {},
): BrowserLoggerConfig => {
	const environment = detectEnvironment(env);
	const baseConfig = { ...defaultConfigs[environment] };

	// 環境変数でのオーバーライド（NEXT_PUBLIC_プレフィックス付きのみ）
	if (env.NEXT_PUBLIC_LOG_LEVEL) {
		baseConfig.level = env.NEXT_PUBLIC_LOG_LEVEL as LogLevel;
	}

	if (env.NEXT_PUBLIC_LOG_BUFFER_SIZE) {
		const bufferSize = Number(env.NEXT_PUBLIC_LOG_BUFFER_SIZE);
		if (!Number.isNaN(bufferSize) && bufferSize > 0) {
			baseConfig.bufferSize = bufferSize;
		}
	}

	if (env.NEXT_PUBLIC_LOG_FLUSH_INTERVAL) {
		const flushInterval = Number(env.NEXT_PUBLIC_LOG_FLUSH_INTERVAL);
		if (!Number.isNaN(flushInterval) && flushInterval > 0) {
			baseConfig.flushInterval = flushInterval;
		}
	}

	if (env.NEXT_PUBLIC_LOG_API_ENDPOINT) {
		baseConfig.apiEndpoint = env.NEXT_PUBLIC_LOG_API_ENDPOINT;
	}

	if (env.NEXT_PUBLIC_LOG_API_TIMEOUT) {
		const apiTimeout = Number(env.NEXT_PUBLIC_LOG_API_TIMEOUT);
		if (!Number.isNaN(apiTimeout) && apiTimeout > 0) {
			baseConfig.apiTimeout = apiTimeout;
		}
	}

	if (env.NEXT_PUBLIC_LOG_ENABLE_CONSOLE) {
		baseConfig.enableConsole = env.NEXT_PUBLIC_LOG_ENABLE_CONSOLE === "true";
	}

	if (env.NEXT_PUBLIC_VERSION) {
		baseConfig.version = env.NEXT_PUBLIC_VERSION;
	}

	return baseConfig;
};

/**
 * ログレベルの数値変換
 * レベル比較に使用
 */
export const getLogLevelValue = (level: LogLevel): number => {
	switch (level) {
		case "debug":
			return 0;
		case "info":
			return 1;
		case "warn":
			return 2;
		case "error":
			return 3;
		default:
			return 1;
	}
};

/**
 * 現在のログレベルで出力すべきかを判定
 * @param currentLevel 現在のログレベル
 * @param targetLevel 出力対象のレベル
 * @returns 出力すべきかどうか
 */
export const shouldLog = (
	currentLevel: LogLevel,
	targetLevel: LogLevel,
): boolean => {
	return getLogLevelValue(targetLevel) >= getLogLevelValue(currentLevel);
};

/**
 * 設定のマージ
 * ベース設定とオーバーライド設定を安全にマージ
 * @param baseConfig ベース設定
 * @param overrideConfig オーバーライド設定
 * @returns マージされた設定
 */
export const mergeConfigs = (
	baseConfig: BrowserLoggerConfig,
	overrideConfig: Partial<BrowserLoggerConfig>,
): BrowserLoggerConfig => {
	return {
		...baseConfig,
		...overrideConfig,
	};
};

/**
 * 設定の検証
 * 設定値の整合性と安全性をチェック
 * @param config 検証対象の設定
 * @returns 検証結果とエラーメッセージ
 */
export const validateConfig = (
	config: BrowserLoggerConfig,
): { valid: boolean; errors: string[] } => {
	const errors: string[] = [];

	// バッファサイズの検証
	if (config.bufferSize < 1 || config.bufferSize > 1000) {
		errors.push("bufferSize must be between 1 and 1000");
	}

	// フラッシュ間隔の検証
	if (config.flushInterval < 100 || config.flushInterval > 60000) {
		errors.push("flushInterval must be between 100ms and 60000ms");
	}

	// リトライ回数の検証
	if (config.maxRetries < 0 || config.maxRetries > 10) {
		errors.push("maxRetries must be between 0 and 10");
	}

	// APIタイムアウトの検証
	if (config.apiTimeout < 1000 || config.apiTimeout > 30000) {
		errors.push("apiTimeout must be between 1000ms and 30000ms");
	}

	// セッションタイムアウトの検証
	if (
		config.sessionTimeout < 60000 ||
		config.sessionTimeout > 24 * 60 * 60 * 1000
	) {
		errors.push("sessionTimeout must be between 1 minute and 24 hours");
	}

	// APIエンドポイントの検証（設定されている場合）
	if (config.apiEndpoint) {
		try {
			new URL(config.apiEndpoint);
		} catch {
			errors.push("apiEndpoint must be a valid URL");
		}
	}

	return {
		valid: errors.length === 0,
		errors,
	};
};

/**
 * 環境固有設定の適用
 * 環境に応じた設定のオーバーライドを適用
 * @param config ベース設定
 * @param environmentOverrides 環境固有設定
 * @returns 適用後の設定
 */
export const applyEnvironmentConfig = (
	config: BrowserLoggerConfig,
	environmentOverrides: EnvironmentConfig,
): BrowserLoggerConfig => {
	const override = environmentOverrides[config.environment];
	return override ? mergeConfigs(config, override) : config;
};

/**
 * デフォルト設定の取得
 * @param environment 対象環境（未指定時は自動検出）
 * @returns デフォルト設定
 */
export const getDefaultConfig = (
	environment?: Environment,
): BrowserLoggerConfig => {
	const env = environment || detectEnvironment();
	return { ...defaultConfigs[env] };
};

/**
 * 設定のシリアライズ
 * 設定をJSON文字列に変換（機密情報を除外）
 * @param config 設定オブジェクト
 * @returns JSON文字列
 */
export const serializeConfig = (config: BrowserLoggerConfig): string => {
	// 機密情報を除外したコピーを作成
	const safeConfig = {
		...config,
		apiEndpoint: config.apiEndpoint ? "[REDACTED]" : undefined,
	};

	return JSON.stringify(safeConfig, null, 2);
};

/**
 * ブラウザ互換性チェック
 * 必要なブラウザAPIの利用可能性をチェック
 * @returns 各APIの利用可能性
 */
export const checkBrowserCompatibility = () => {
	return {
		fetch: typeof fetch !== "undefined",
		localStorage: typeof localStorage !== "undefined",
		sessionStorage: typeof sessionStorage !== "undefined",
		performance: typeof performance !== "undefined",
		beacon:
			typeof navigator !== "undefined" &&
			typeof navigator.sendBeacon !== "undefined",
		visibilityAPI:
			typeof document !== "undefined" &&
			typeof document.visibilityState !== "undefined",
		beforeunload:
			typeof window !== "undefined" &&
			typeof window.addEventListener !== "undefined",
	};
};

/**
 * 設定の最適化
 * ブラウザ環境に応じて設定を最適化
 * @param config 基本設定
 * @returns 最適化された設定
 */
export const optimizeConfigForBrowser = (
	config: BrowserLoggerConfig,
): BrowserLoggerConfig => {
	const compatibility = checkBrowserCompatibility();
	const optimizedConfig = { ...config };

	// Beacon APIが利用できない場合はfetchを使用
	if (!compatibility.beacon) {
		optimizedConfig.enableBeacon = false;
	}

	// LocalStorageが利用できない場合は無効化
	if (!compatibility.localStorage) {
		optimizedConfig.enableLocalStorage = false;
		optimizedConfig.persistSession = false;
	}

	// Performance APIが利用できない場合はパフォーマンストラッキングを無効化
	if (!compatibility.performance) {
		optimizedConfig.enablePerformanceTracking = false;
	}

	return optimizedConfig;
};

// エクスポート用のデフォルト設定
export const defaultConfig = getDefaultConfig();

// 使用頻度の高い環境判定関数のエクスポート
export const isDevelopment = () => detectEnvironment() === "development";
export const isProduction = () => detectEnvironment() === "production";
export const isStorybook = () => detectEnvironment() === "storybook";
