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
 * Storybookデコレーター用のロガープロバイダー
 * 全てのストーリーに自動的にロガー機能を追加
 */
export function StorybookLoggerDecorator(Story: any, context: any) {
	// Storybookのコンテキストから情報を取得
	const { title, name, args } = context;

	// ストーリー固有の設定
	const storyConfig: Partial<StorybookLoggerConfig> = {
		storyName: `${title}/${name}`,
	};

	const logger = createStorybookLogger(storyConfig);

	// ストーリー開始ログ
	logger.debug(`Storybook story loaded: ${title}/${name}`, {
		story: `${title}/${name}`,
		args,
		storybook: true,
	});

	return Story();
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
 * Storybook環境での包括的なログ管理
 */
export class StorybookLoggerManager {
	private static instance: StorybookLoggerManager | null = null;
	private logger: FrontendLogger;
	private actionHandlers: Map<string, Function> = new Map();

	private constructor(config?: Partial<StorybookLoggerConfig>) {
		this.logger = createStorybookLogger(config);
		this.setupActionHandlers();
	}

	public static getInstance(
		config?: Partial<StorybookLoggerConfig>,
	): StorybookLoggerManager {
		if (!StorybookLoggerManager.instance) {
			StorybookLoggerManager.instance = new StorybookLoggerManager(config);
		}
		return StorybookLoggerManager.instance;
	}

	private setupActionHandlers() {
		// Storybookアクションハンドラーの設定
		this.actionHandlers.set("click", this.handleClick.bind(this));
		this.actionHandlers.set("change", this.handleChange.bind(this));
		this.actionHandlers.set("submit", this.handleSubmit.bind(this));
	}

	private handleClick(event: Event, context?: any) {
		this.logger.userInteraction("storybook:click", "button", {
			target: (event.target as Element)?.tagName,
			storybook: true,
			story: context?.story,
		});
	}

	private handleChange(event: Event, context?: any) {
		this.logger.userInteraction("storybook:change", "input", {
			target: (event.target as HTMLInputElement)?.type,
			value: (event.target as HTMLInputElement)?.value?.substring(0, 50), // 値は最初の50文字のみ
			storybook: true,
			story: context?.story,
		});
	}

	private handleSubmit(event: Event, context?: any) {
		this.logger.userInteraction("storybook:submit", "form", {
			target: (event.target as Element)?.tagName,
			storybook: true,
			story: context?.story,
		});
	}

	public getLogger(): FrontendLogger {
		return this.logger;
	}

	public logStoryInteraction(actionType: string, details: any, context?: any) {
		const handler = this.actionHandlers.get(actionType);
		if (handler) {
			handler(details, context);
		} else {
			this.logger.userInteraction(`storybook:${actionType}`, "element", {
				...details,
				storybook: true,
				story: context?.story,
			});
		}
	}
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
	StorybookLoggerDecorator,
	StorybookLoggerManager,
	isStorybookEnvironment,
	createStorybookPerformanceMonitor,
	handleStorybookError,
};
