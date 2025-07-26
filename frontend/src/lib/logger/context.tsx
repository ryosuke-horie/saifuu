/**
 * LoggerContext & Provider実装
 *
 * Reactアプリケーション全体でのロガーインスタンス共有
 * Provider階層での設定継承とスコープ管理機能
 */

"use client";

import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useMemo,
	useRef,
} from "react";
import { createBrowserLogger } from "./browser-logger";
import { createLoggerConfig, getDefaultConfig } from "./config";
import type { BrowserLoggerConfig, FrontendLogger } from "./types";

/**
 * LoggerContextの型定義
 * ロガーインスタンスと設定更新機能を提供
 */
interface LoggerContextValue {
	logger: FrontendLogger;
	config: BrowserLoggerConfig;
	updateConfig: (newConfig: Partial<BrowserLoggerConfig>) => void;
	isInitialized: boolean;
}

/**
 * LoggerContextの作成
 * undefinedの場合はProviderが設定されていないことを示す
 */
const LoggerContext = createContext<LoggerContextValue | undefined>(undefined);

/**
 * LoggerProvider プロパティの型定義
 */
interface LoggerProviderProps {
	children: ReactNode;
	config?: Partial<BrowserLoggerConfig>;
	userId?: string;
	component?: string;
	inheritParent?: boolean;
}

/**
 * LoggerProvider コンポーネント
 * アプリケーション全体またはコンポーネントツリーの一部にロガー機能を提供
 *
 * @param children 子コンポーネント
 * @param config ロガー設定のオーバーライド
 * @param userId ユーザーID（自動設定用）
 * @param component コンポーネント名（自動設定用）
 * @param inheritParent 親Providerの設定を継承するか（デフォルト: true）
 */
export function LoggerProvider({
	children,
	config = {},
	userId,
	component,
	inheritParent = true,
}: LoggerProviderProps) {
	// 親コンテキストの取得（ネストされたProvider用）
	const parentContext = useContext(LoggerContext);

	// ロガーインスタンスの参照を保持
	const loggerRef = useRef<FrontendLogger | null>(null);
	const isInitializedRef = useRef(false);

	// 設定の計算（親設定の継承とマージ）
	const finalConfig = useMemo(() => {
		let baseConfig: BrowserLoggerConfig;

		if (inheritParent && parentContext) {
			// 親Providerの設定を継承
			baseConfig = parentContext.config;
		} else {
			// 環境変数から基本設定を作成
			const env = typeof process !== "undefined" ? process.env : {};
			baseConfig = createLoggerConfig(env);
		}

		// プロパティで渡された設定をマージ
		return { ...baseConfig, ...config };
	}, [config, parentContext, inheritParent]);

	// ロガーインスタンスの作成・更新
	const logger = useMemo(() => {
		// 既存のロガーがある場合は破棄
		if (loggerRef.current) {
			loggerRef.current.destroy();
		}

		// 新しいロガーインスタンスを作成
		const newLogger = createBrowserLogger(finalConfig);
		loggerRef.current = newLogger;
		isInitializedRef.current = true;

		// ユーザーIDとコンポーネント名の自動設定
		if (userId) {
			newLogger.setUserId(userId);
		}
		if (component) {
			newLogger.setComponent(component);
		}

		return newLogger;
	}, [finalConfig, userId, component]);

	// 設定更新関数
	const updateConfig = useMemo(
		() => (newConfig: Partial<BrowserLoggerConfig>) => {
			logger.updateConfig(newConfig);
		},
		[logger],
	);

	// コンテキスト値の作成
	const contextValue = useMemo<LoggerContextValue>(
		() => ({
			logger,
			config: finalConfig,
			updateConfig,
			isInitialized: isInitializedRef.current,
		}),
		[logger, finalConfig, updateConfig],
	);

	// クリーンアップ処理
	useEffect(() => {
		return () => {
			if (loggerRef.current) {
				loggerRef.current.destroy();
				loggerRef.current = null;
				isInitializedRef.current = false;
			}
		};
	}, []);

	// Provider階層でのページビュー自動記録
	useEffect(() => {
		if (typeof window !== "undefined" && logger) {
			logger.pageView(window.location.pathname, {
				component: component || "Provider",
				action: "mount",
			});
		}
	}, [logger, component]);

	return (
		<LoggerContext.Provider value={contextValue}>
			{children}
		</LoggerContext.Provider>
	);
}

/**
 * useLoggerContext カスタムフック
 * LoggerContextの値を取得し、Providerが設定されているかチェック
 *
 * @returns LoggerContextの値
 * @throws {Error} Providerが設定されていない場合
 */
export function useLoggerContext(): LoggerContextValue {
	const context = useContext(LoggerContext);

	if (context === undefined) {
		throw new Error(
			"useLoggerContext must be used within a LoggerProvider. " +
				"Please wrap your component tree with <LoggerProvider>.",
		);
	}

	return context;
}

/**
 * useOptionalLoggerContext カスタムフック
 * LoggerContextの値を取得し、Providerが未設定でもエラーを投げない
 * ライブラリコンポーネントなど、ロガーがオプションの場合に使用
 *
 * @returns LoggerContextの値またはundefined
 */
export function useOptionalLoggerContext(): LoggerContextValue | undefined {
	return useContext(LoggerContext);
}

/**
 * LoggerScope コンポーネント
 * 特定のスコープでロガー設定をオーバーライドするためのヘルパー
 *
 * @param children 子コンポーネント
 * @param component スコープ名（コンポーネント名として設定）
 * @param config スコープ固有の設定
 */
interface LoggerScopeProps {
	children: ReactNode;
	component: string;
	config?: Partial<BrowserLoggerConfig>;
}

export function LoggerScope({ children, component, config }: LoggerScopeProps) {
	return (
		<LoggerProvider config={config} component={component} inheritParent={true}>
			{children}
		</LoggerProvider>
	);
}

/**
 * デフォルトロガーProvider
 * アプリケーションルートで使用する最小設定のProvider
 */
export function DefaultLoggerProvider({ children }: { children: ReactNode }) {
	return (
		<LoggerProvider config={getDefaultConfig()}>{children}</LoggerProvider>
	);
}
