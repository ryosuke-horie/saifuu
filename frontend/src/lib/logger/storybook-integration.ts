/**
 * Storybook統合機能
 *
 * Storybookコンポーネント開発環境での
 * 専用ログ設定とデコレーター統合を提供
 */

import { createBrowserLogger } from "./browser-logger";
import { createLoggerConfig } from "./config";
import type { BrowserLoggerConfig, FrontendLogger } from "./types";

/**
 * Storybook専用ロガー設定
 */
export interface StorybookLoggerConfig extends BrowserLoggerConfig {
	/** Storybookストーリー名 */
	storyName?: string;
	/** Storybookアクションとの統合 */
	enableActions?: boolean;
	/** インタラクション自動ログ */
	autoLogInteractions?: boolean;
}

/**
 * Storybook環境検出
 */
export function isStorybookEnvironment(): boolean {
	return (
		(typeof process !== "undefined" && process.env.STORYBOOK === "true") ||
		(typeof window !== "undefined" &&
			(window as any).__STORYBOOK_ADDONS__ !== undefined)
	);
}

/**
 * Storybook専用ロガー設定を作成
 */
export function createStorybookConfig(
	customConfig?: Partial<StorybookLoggerConfig>,
): StorybookLoggerConfig {
	const baseConfig = createLoggerConfig({
		NODE_ENV: "development",
		STORYBOOK: "true",
	});

	return {
		...baseConfig,
		environment: "storybook" as const,
		level: "debug",
		bufferSize: 10,
		flushInterval: 1000,
		enableConsole: true,
		enableActions: true,
		autoLogInteractions: false, // ユーザー要件により無効
		...customConfig,
	};
}

/**
 * Storybook専用ロガーを作成
 */
export function createStorybookLogger(
	config?: Partial<StorybookLoggerConfig>,
): FrontendLogger {
	const storybookConfig = createStorybookConfig(config);
	return createBrowserLogger(storybookConfig);
}

/**
 * Storybookアクションとの統合
 * Storybookのアクションアドオンと連携してユーザーインタラクションをログ
 */
export function logStorybookAction(
	actionName: string,
	args: any[],
	context?: any,
) {
	if (!isStorybookEnvironment()) {
		return;
	}

	const logger = createStorybookLogger();

	logger.userInteraction(`storybook:${actionName}`, "storybook", {
		action: actionName,
		args,
		storybook: true,
		story: context?.title ? `${context.title}/${context.name}` : undefined,
	});
}

/**
 * Storybook専用のパフォーマンス監視
 */
export function createStorybookPerformanceMonitor() {
	const logger = createStorybookLogger();

	return {
		measureStoryRender: (storyName: string) => {
			const startTime = performance.now();

			return () => {
				const duration = performance.now() - startTime;
				logger.debug(`Story render time: ${storyName}`, {
					storyName,
					duration,
					performance: true,
					storybook: true,
				});
			};
		},

		measureInteraction: (interactionName: string) => {
			const startTime = performance.now();

			return () => {
				const duration = performance.now() - startTime;
				logger.debug(`Interaction time: ${interactionName}`, {
					interactionName,
					duration,
					performance: true,
					storybook: true,
				});
			};
		},
	};
}

/**
 * Storybook環境用のエラーハンドリング
 */
export function handleStorybookError(error: Error, context?: any) {
	const logger = createStorybookLogger();

	logger.error("Storybook component error", {
		error: error.message,
		stack: error.stack,
		story: context?.title ? `${context.title}/${context.name}` : undefined,
		storybook: true,
		componentError: true,
	});
}

/**
 * Storybook設定の検証
 */
export function validateStorybookConfig(
	config: Partial<StorybookLoggerConfig>,
): boolean {
	// 基本的な設定検証
	if (
		config.level &&
		!["debug", "info", "warn", "error"].includes(config.level)
	) {
		console.warn("Invalid log level for Storybook config:", config.level);
		return false;
	}

	if (
		config.bufferSize &&
		(config.bufferSize < 1 || config.bufferSize > 1000)
	) {
		console.warn(
			"Invalid buffer size for Storybook config:",
			config.bufferSize,
		);
		return false;
	}

	return true;
}

/**
 * デフォルトエクスポート
 */
export default {
	createStorybookLogger,
	isStorybookEnvironment,
	createStorybookPerformanceMonitor,
	handleStorybookError,
};
