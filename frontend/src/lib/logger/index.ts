/**
 * フロントエンドロガー システム
 *
 * React 19とNext.js 15に最適化された構造化ログ機能
 * 開発・運用効率化とパフォーマンス最適化を両立
 */

// =============================================================================
// コア機能のエクスポート
// =============================================================================

// ブラウザロガー
export {
	BrowserLogger,
	createBrowserLogger,
} from "./browser-logger";

// 設定システム
export {
	applyEnvironmentConfig,
	checkBrowserCompatibility,
	createLoggerConfig,
	defaultConfig,
	detectEnvironment,
	getDefaultConfig,
	getLogLevelValue,
	isDevelopment,
	isProduction,
	mergeConfigs,
	optimizeConfigForBrowser,
	serializeConfig,
	shouldLog,
	validateConfig,
} from "./config";
// React統合コンポーネント (Phase 2)
export {
	DefaultLoggerProvider,
	LoggerProvider,
	LoggerScope,
	useLoggerContext,
	useOptionalLoggerContext,
} from "./context";
export {
	DefaultErrorFallback,
	ErrorBoundaryPresets,
	type ErrorFallbackProps,
	LoggedErrorBoundary,
	useErrorHandler,
	withErrorBoundary,
} from "./error-boundary";
export {
	useComponentLogger,
	useLoggedCallback,
	useLogger,
	useOptionalLogger,
	usePerformanceLogger,
} from "./hooks";

// 型定義
export type {
	BrowserLoggerConfig,
	BufferedLogEntry,
	DeviceInfo,
	Environment,
	EnvironmentConfig,
	ErrorInfo,
	FrontendLogEntry,
	FrontendLogger,
	FrontendLogMeta,
	LogFilter,
	LogLevel,
	LogSender,
	LogSendResult,
	LogTransformer,
	NetworkInfo,
	SessionInfo,
} from "./types";

// =============================================================================
// 統合ロガー オブジェクト
// =============================================================================

import { createBrowserLogger } from "./browser-logger";
import { createLoggerConfig, getDefaultConfig } from "./config";
import type { BrowserLoggerConfig } from "./types";

/**
 * 統合ロガーオブジェクト
 * 設定、作成、ユーティリティを統一的に提供
 */
export const logger = {
	create: createBrowserLogger,
	config: {
		create: createLoggerConfig,
		default: getDefaultConfig(),
	},
} as const;

// =============================================================================
// 統合機能のエクスポート（フェーズ3）
// =============================================================================

// 共通ユーティリティ
export { generateRequestId } from "../utils/request-id";
// API統合
export {
	createApiClientWithLogging,
	createPerformanceMarker,
	enhanceRequestWithLogging,
	getErrorPerformance,
	getResponsePerformance,
	useApiLogger,
	withApiLogging,
} from "./api-integration";

// Next.js統合
export {
	addRequestIdToResponse,
	createMiddlewareRequestId,
	getServerSideRequestId,
	isNextjsEnvironment,
	NextjsErrorBoundary,
	NextjsLoggerProvider,
	nextjsLoggerConfig,
	useNextjsLogger,
	withPageLogging,
} from "./nextjs-integration";

// =============================================================================
// 初期化ヘルパー
// =============================================================================

/**
 * ロガー初期化ヘルパー
 * アプリケーション起動時に呼び出し、ロガーシステムを初期化
 * @param config オプション設定のオーバーライド
 * @returns 初期化されたBrowserLoggerインスタンス
 */
export function initializeLogger(config?: Partial<BrowserLoggerConfig>) {
	// 環境変数から基本設定を作成
	const env = typeof process !== "undefined" ? process.env : {};
	const baseConfig = createLoggerConfig(env);

	// オーバーライド設定をマージ
	const finalConfig = config ? { ...baseConfig, ...config } : baseConfig;

	return createBrowserLogger(finalConfig);
}

/**
 * クイック初期化ヘルパー
 * デフォルト設定で即座にロガーを作成
 * @returns デフォルト設定のBrowserLoggerインスタンス
 */
export function createDefaultLogger() {
	return createBrowserLogger(getDefaultConfig());
}
