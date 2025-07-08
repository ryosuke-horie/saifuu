/**
 * React Hooks実装
 *
 * React環境でのロガー使用を最適化するカスタムフック集
 * パフォーマンス最適化、React 19並行レンダリング対応
 */

"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useLoggerContext, useOptionalLoggerContext } from "./context";
import type { FrontendLogMeta, LogLevel } from "./types";

/**
 * useLogger カスタムフック
 * 基本ロガーフック（全ログレベル対応）
 * LoggerContextからロガーインスタンスを取得し、基本ログ機能を提供
 *
 * @returns ロガーメソッドとユーティリティ
 */
export function useLogger() {
	const { logger, config, updateConfig } = useLoggerContext();

	// ログメソッドの最適化（useCallbackでメモ化）
	const debug = useCallback(
		(message: string, meta?: FrontendLogMeta) => {
			logger.debug(message, meta);
		},
		[logger],
	);

	const info = useCallback(
		(message: string, meta?: FrontendLogMeta) => {
			logger.info(message, meta);
		},
		[logger],
	);

	const warn = useCallback(
		(message: string, meta?: FrontendLogMeta) => {
			logger.warn(message, meta);
		},
		[logger],
	);

	const error = useCallback(
		(message: string, meta?: FrontendLogMeta) => {
			logger.error(message, meta);
		},
		[logger],
	);

	// 高度なログメソッド
	const track = useCallback(
		(event: string, properties?: FrontendLogMeta) => {
			logger.track(event, properties);
		},
		[logger],
	);

	const pageView = useCallback(
		(path: string, meta?: FrontendLogMeta) => {
			logger.pageView(path, meta);
		},
		[logger],
	);

	const userInteraction = useCallback(
		(action: string, element?: string, meta?: FrontendLogMeta) => {
			logger.userInteraction(action, element, meta);
		},
		[logger],
	);

	const apiCall = useCallback(
		(endpoint: string, method: string, meta?: FrontendLogMeta) => {
			logger.apiCall(endpoint, method, meta);
		},
		[logger],
	);

	const performance = useCallback(
		(metric: string, value: number, meta?: FrontendLogMeta) => {
			logger.performance(metric, value, meta);
		},
		[logger],
	);

	// ユーティリティメソッド
	const setUserId = useCallback(
		(userId: string) => {
			logger.setUserId(userId);
		},
		[logger],
	);

	const setComponent = useCallback(
		(componentName: string) => {
			logger.setComponent(componentName);
		},
		[logger],
	);

	const flush = useCallback(async () => {
		await logger.flush();
	}, [logger]);

	const setLevel = useCallback(
		(level: LogLevel) => {
			logger.setLevel(level);
		},
		[logger],
	);

	return useMemo(
		() => ({
			// 基本ログメソッド
			debug,
			info,
			warn,
			error,
			// 高度なログメソッド
			track,
			pageView,
			userInteraction,
			apiCall,
			performance,
			// ユーティリティ
			setUserId,
			setComponent,
			flush,
			setLevel,
			updateConfig,
			// 状態
			config,
			bufferSize: logger.getBufferSize(),
		}),
		[
			debug,
			info,
			warn,
			error,
			track,
			pageView,
			userInteraction,
			apiCall,
			performance,
			setUserId,
			setComponent,
			flush,
			setLevel,
			updateConfig,
			config,
			logger,
		],
	);
}

/**
 * useComponentLogger カスタムフック
 * コンポーネント名自動付与フック
 * 指定されたコンポーネント名を自動でメタデータに追加
 *
 * @param componentName コンポーネント名（自動設定される）
 * @param autoMount マウント時に自動ログ出力するか（デフォルト: true）
 * @returns コンポーネント固有のロガーメソッド
 */
export function useComponentLogger(componentName: string, autoMount = true) {
	const logger = useLogger();
	const mountedRef = useRef(false);

	// コンポーネント名の自動設定
	useEffect(() => {
		logger.setComponent(componentName);
	}, [logger, componentName]);

	// マウント時の自動ログ
	useEffect(() => {
		if (autoMount && !mountedRef.current) {
			logger.debug(`Component ${componentName} mounted`, {
				component: componentName,
				action: "mount",
			});
			mountedRef.current = true;
		}

		// アンマウント時のログ
		return () => {
			if (autoMount && mountedRef.current) {
				logger.debug(`Component ${componentName} unmounting`, {
					component: componentName,
					action: "unmount",
				});
			}
		};
	}, [logger, componentName, autoMount]);

	// コンポーネント名付きログメソッド
	const withComponent = useCallback(
		(meta: FrontendLogMeta = {}) => ({
			...meta,
			component: componentName,
		}),
		[componentName],
	);

	return useMemo(
		() => ({
			// 基本ログメソッド（コンポーネント名自動付与）
			debug: (message: string, meta?: FrontendLogMeta) =>
				logger.debug(message, withComponent(meta)),
			info: (message: string, meta?: FrontendLogMeta) =>
				logger.info(message, withComponent(meta)),
			warn: (message: string, meta?: FrontendLogMeta) =>
				logger.warn(message, withComponent(meta)),
			error: (message: string, meta?: FrontendLogMeta) =>
				logger.error(message, withComponent(meta)),

			// 高度なログメソッド（コンポーネント名自動付与）
			track: (event: string, properties?: FrontendLogMeta) =>
				logger.track(event, withComponent(properties)),
			userInteraction: (
				action: string,
				element?: string,
				meta?: FrontendLogMeta,
			) => logger.userInteraction(action, element, withComponent(meta)),
			apiCall: (endpoint: string, method: string, meta?: FrontendLogMeta) =>
				logger.apiCall(endpoint, method, withComponent(meta)),
			performance: (metric: string, value: number, meta?: FrontendLogMeta) =>
				logger.performance(metric, value, withComponent(meta)),

			// ユーティリティ（ベースロガーから選択的に取得）
			setUserId: logger.setUserId,
			setComponent: logger.setComponent,
			flush: logger.flush,
			setLevel: logger.setLevel,
			updateConfig: logger.updateConfig,
			config: logger.config,
			bufferSize: logger.bufferSize,
			componentName,
		}),
		[logger, withComponent, componentName],
	);
}

/**
 * useLoggedCallback カスタムフック
 * 自動ログ付きコールバックフック
 * コールバック実行前後にログを自動出力し、エラーも自動キャッチ
 *
 * @param callback 実行するコールバック関数
 * @param deps useCallbackの依存配列
 * @param options ログ設定オプション
 * @returns ログ付きコールバック関数
 */
interface UseLoggedCallbackOptions {
	name?: string;
	logLevel?: LogLevel;
	logStart?: boolean;
	logEnd?: boolean;
	logError?: boolean;
	meta?: FrontendLogMeta;
}

export function useLoggedCallback<TArgs extends unknown[], TReturn>(
	callback: (...args: TArgs) => TReturn | Promise<TReturn>,
	deps: React.DependencyList,
	options: UseLoggedCallbackOptions = {},
) {
	const logger = useLogger();

	const {
		name = "callback",
		logLevel = "debug",
		logStart = true,
		logEnd = true,
		logError = true,
		meta = {},
	} = options;

	return useCallback(
		async (...args: TArgs): Promise<TReturn> => {
			const startTime = Date.now();
			const callbackMeta = {
				...meta,
				action: "callback_execution",
				callbackName: name,
			};

			try {
				// 開始ログ
				if (logStart) {
					logger[logLevel](`Callback ${name} started`, callbackMeta);
				}

				// コールバック実行
				const result = await callback(...args);

				// 終了ログ
				if (logEnd) {
					const duration = Date.now() - startTime;
					logger[logLevel](`Callback ${name} completed`, {
						...callbackMeta,
						duration,
						success: true,
					});
				}

				return result;
			} catch (error) {
				// エラーログ
				if (logError) {
					const duration = Date.now() - startTime;
					logger.error(`Callback ${name} failed`, {
						...callbackMeta,
						duration,
						success: false,
						error: error instanceof Error ? error.message : String(error),
						stack: error instanceof Error ? error.stack : undefined,
					});
				}

				// エラーを再スロー
				throw error;
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[
			logger,
			name,
			logLevel,
			logStart,
			logEnd,
			logError,
			meta,
			callback,
			...deps,
		],
	);
}

/**
 * usePerformanceLogger カスタムフック
 * React 19のパフォーマンス機能と連携したロガー
 * レンダリング時間、メモリ使用量などを自動追跡
 *
 * @param componentName コンポーネント名
 * @param trackRenders レンダリング時間を追跡するか（デフォルト: true）
 * @returns パフォーマンス追跡機能
 */
export function usePerformanceLogger(
	componentName: string,
	trackRenders = true,
) {
	const logger = useLogger();
	const renderStartRef = useRef<number | undefined>(undefined);
	const renderCountRef = useRef(0);

	// レンダリング開始時間の記録
	if (trackRenders) {
		renderStartRef.current = performance.now();
	}

	// レンダリング完了時の処理
	useEffect(() => {
		if (trackRenders && renderStartRef.current) {
			const renderTime = performance.now() - renderStartRef.current;
			renderCountRef.current++;

			logger.performance("render_time", renderTime, {
				component: componentName,
				renderCount: renderCountRef.current,
			});
		}
	});

	// メモリ使用量の測定
	const measureMemory = useCallback(() => {
		if ("memory" in performance) {
			const memory = (performance as any).memory;
			logger.performance("memory_usage", memory.usedJSHeapSize, {
				component: componentName,
				totalHeapSize: memory.totalJSHeapSize,
				heapSizeLimit: memory.jsHeapSizeLimit,
			});
		}
	}, [logger, componentName]);

	// カスタムパフォーマンス測定
	const measureCustom = useCallback(
		(name: string, _fn: () => void | Promise<void>) => {
			return logger.performance(name, 0, {
				component: componentName,
				customMeasurement: name,
			});
		},
		[logger, componentName],
	);

	return useMemo(
		() => ({
			measureMemory,
			measureCustom,
			renderCount: renderCountRef.current,
		}),
		[measureMemory, measureCustom],
	);
}

/**
 * useOptionalLogger カスタムフック
 * ロガーがオプションの環境で使用するフック
 * LoggerProviderが設定されていなくてもエラーにならない
 *
 * @returns ロガーメソッドまたはno-op関数
 */
export function useOptionalLogger() {
	const context = useOptionalLoggerContext();

	// no-opロガーの作成
	const noOpLogger = useMemo(
		() => ({
			debug: () => {},
			info: () => {},
			warn: () => {},
			error: () => {},
			track: () => {},
			pageView: () => {},
			userInteraction: () => {},
			apiCall: () => {},
			performance: () => {},
			setUserId: () => {},
			setComponent: () => {},
			flush: async () => {},
			setLevel: () => {},
			updateConfig: () => {},
			config: null,
			bufferSize: 0,
			isAvailable: false,
		}),
		[],
	);

	// 実際のロガー
	const realLogger = useMemo(() => {
		if (!context) return null;

		const { logger, config, updateConfig } = context;
		return {
			debug: (message: string, meta?: FrontendLogMeta) =>
				logger.debug(message, meta),
			info: (message: string, meta?: FrontendLogMeta) =>
				logger.info(message, meta),
			warn: (message: string, meta?: FrontendLogMeta) =>
				logger.warn(message, meta),
			error: (message: string, meta?: FrontendLogMeta) =>
				logger.error(message, meta),
			track: (event: string, properties?: FrontendLogMeta) =>
				logger.track(event, properties),
			pageView: (path: string, meta?: FrontendLogMeta) =>
				logger.pageView(path, meta),
			userInteraction: (
				action: string,
				element?: string,
				meta?: FrontendLogMeta,
			) => logger.userInteraction(action, element, meta),
			apiCall: (endpoint: string, method: string, meta?: FrontendLogMeta) =>
				logger.apiCall(endpoint, method, meta),
			performance: (metric: string, value: number, meta?: FrontendLogMeta) =>
				logger.performance(metric, value, meta),
			setUserId: (userId: string) => logger.setUserId(userId),
			setComponent: (componentName: string) =>
				logger.setComponent(componentName),
			flush: () => logger.flush(),
			setLevel: (level: LogLevel) => logger.setLevel(level),
			updateConfig,
			config,
			bufferSize: logger.getBufferSize(),
			isAvailable: true,
		};
	}, [context]);

	return realLogger || noOpLogger;
}
