/**
 * Next.js統合機能
 *
 * Next.js App Routerとの統合により、
 * SSR/CSR対応とrequestId管理を提供
 */

"use client";

import { type ReactNode, useEffect, useState } from "react";
import { generateRequestId } from "../utils/request-id";
import { LoggerProvider } from "./context";
import type { BrowserLoggerConfig } from "./types";

/**
 * Next.js専用LoggerProviderの設定
 */
interface NextjsLoggerProviderProps {
	children: ReactNode;
	config?: Partial<BrowserLoggerConfig>;
}

/**
 * Next.js App Router対応LoggerProvider
 * SSR/CSRハイブリッド環境での適切なロガー初期化を提供
 */
export function NextjsLoggerProvider({
	children,
	config = {},
}: NextjsLoggerProviderProps) {
	const [isClient, setIsClient] = useState(false);
	const [requestId, setRequestId] = useState<string>("");

	// クライアントサイドレンダリング検出
	useEffect(() => {
		setIsClient(true);

		// クライアントサイドでrequestIdを生成
		if (typeof window !== "undefined") {
			const clientRequestId = generateRequestId();
			setRequestId(clientRequestId);

			// グローバルなrequestIdとして設定（デバッグ用）
			(window as any).__requestId = clientRequestId;
		}
	}, []);

	// SSR時は基本的なLoggerProviderのみ提供
	if (!isClient) {
		return (
			<LoggerProvider
				config={{
					...config,
					environment: "development", // SSR時はログを最小限に
					level: "warn", // 警告レベル以上のみ
					enableConsole: false, // SSR時はコンソール出力を無効
				}}
			>
				{children}
			</LoggerProvider>
		);
	}

	// CSR時は完全なロガー機能を提供
	const clientConfig: Partial<BrowserLoggerConfig> = {
		...config,
		// requestIdを設定に含める
		...(requestId && { requestId }),
	};

	return <LoggerProvider config={clientConfig}>{children}</LoggerProvider>;
}

/**
 * Next.js環境でのrequestId取得フック
 */
export function useNextjsLogger() {
	const [requestId, setRequestId] = useState<string>("");
	const [isSSR, setIsSSR] = useState(true);

	useEffect(() => {
		setIsSSR(false);

		// クライアントサイドでrequestIdを取得
		if (typeof window !== "undefined") {
			const windowRequestId = (window as any).__requestId;
			if (windowRequestId) {
				setRequestId(windowRequestId);
			} else {
				// 新しいrequestIdを生成
				const newRequestId = generateRequestId();
				setRequestId(newRequestId);
				(window as any).__requestId = newRequestId;
			}
		}
	}, []);

	return {
		requestId,
		isSSR,
		isClient: !isSSR,
	};
}

/**
 * Next.js middleware用のrequestId生成関数
 * middleware.ts で使用することを想定
 */
export function createMiddlewareRequestId(): string {
	return generateRequestId();
}

/**
 * レスポンスヘッダーにrequestIdを追加するヘルパー
 * Next.js middleware で使用
 */
export function addRequestIdToResponse(
	response: Response,
	requestId: string,
): Response {
	const newResponse = new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers: response.headers,
	});

	newResponse.headers.set("X-Request-ID", requestId);
	return newResponse;
}

/**
 * Next.js App Router用のエラーバウンダリ統合
 */
export function NextjsErrorBoundary({ children }: { children: ReactNode }) {
	// 基本的なエラーバウンダリ（実装は既存のLoggedErrorBoundaryを使用）
	return <>{children}</>;
}

/**
 * ページコンポーネント用のロガー設定
 * 各ページで個別の設定を適用したい場合に使用
 */
export function withPageLogging<P extends object>(
	Component: React.ComponentType<P>,
	pageConfig?: {
		pageName?: string;
		logLevel?: "debug" | "info" | "warn" | "error";
		additionalMeta?: Record<string, any>;
	},
) {
	return function PageWithLogging(props: P) {
		const loggerConfig: Partial<BrowserLoggerConfig> = {
			...(pageConfig?.logLevel && { level: pageConfig.logLevel }),
		};

		return (
			<NextjsLoggerProvider config={loggerConfig}>
				<Component {...props} />
			</NextjsLoggerProvider>
		);
	};
}

/**
 * Next.js API Routes用のrequestId取得
 * サーバーサイドでrequestIdを取得する場合に使用
 */
export function getServerSideRequestId(request: Request): string | null {
	return request.headers.get("X-Request-ID");
}

/**
 * Next.js環境検出ユーティリティ
 */
export function isNextjsEnvironment(): boolean {
	return (
		typeof window !== "undefined" &&
		typeof (window as any).__NEXT_DATA__ !== "undefined"
	);
}

/**
 * App Router layout.tsx統合用の設定
 */
export const nextjsLoggerConfig = {
	development: {
		level: "debug" as const,
		enableConsole: true,
		bufferSize: 10,
		flushInterval: 1000,
	},
	production: {
		level: "warn" as const,
		enableConsole: false,
		bufferSize: 100,
		flushInterval: 10000,
	},
	test: {
		level: "error" as const,
		enableConsole: false,
		bufferSize: 5,
		flushInterval: 500,
	},
} as const;
