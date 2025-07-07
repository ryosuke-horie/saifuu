/**
 * API設定とエンドポイント管理
 *
 * 環境別のAPI設定を管理し、開発環境・本番環境での
 * 適切なエンドポイントを提供する
 */

/**
 * 環境変数から設定を取得する際のデフォルト値
 */
const DEFAULT_CONFIG = {
	// 開発環境のデフォルトポート（Hono + Viteの一般的な設定）
	DEV_API_PORT: "5173",
	// タイムアウト設定（ミリ秒）
	REQUEST_TIMEOUT: 30000,
	// リトライ設定
	MAX_RETRIES: 3,
	RETRY_DELAY: 1000,
} as const;

/**
 * 環境種別
 */
export type Environment = "development" | "production" | "test";

/**
 * API設定インターフェース
 */
export interface ApiConfig {
	/** ベースURL */
	baseUrl: string;
	/** タイムアウト（ミリ秒） */
	timeout: number;
	/** 最大リトライ回数 */
	maxRetries: number;
	/** リトライ間隔（ミリ秒） */
	retryDelay: number;
	/** 現在の環境 */
	environment: Environment;
}

/**
 * 現在の環境を判定する
 * Next.jsの環境変数を使用して適切な環境を返す
 */
function getCurrentEnvironment(): Environment {
	// Next.js環境でのテスト判定
	if (process.env.NODE_ENV === "test") {
		return "test";
	}

	// 開発環境判定
	if (process.env.NODE_ENV === "development") {
		return "development";
	}

	// その他は本番として扱う
	return "production";
}

/**
 * 環境別のベースURLを取得する
 * CI環境での安全なビルドのため、実行時のみ環境変数をチェック
 */
function getBaseUrl(environment: Environment): string {
	switch (environment) {
		case "development": {
			// 開発環境: ローカルのHonoサーバーを想定
			// ポートは環境変数で設定可能（デフォルト: 5173）
			const devPort =
				process.env.NEXT_PUBLIC_API_PORT || DEFAULT_CONFIG.DEV_API_PORT;
			return (
				process.env.NEXT_PUBLIC_API_URL || `http://localhost:${devPort}/api`
			);
		}

		case "production":
			// 本番環境: Cloudflare Workersのエンドポイント
			// .env.production または CI/CD環境で設定された環境変数を使用
			// ビルド時に環境変数が設定されていない場合の警告
			if (!process.env.NEXT_PUBLIC_API_URL) {
				console.warn(
					"NEXT_PUBLIC_API_URL is not defined. Using placeholder URL. " +
						"Please set it in .env.production for production builds.",
				);
			}
			return process.env.NEXT_PUBLIC_API_URL || "https://api.placeholder.local";

		case "test":
			// テスト環境: テスト用のAPIサーバー（E2E用）
			return (
				process.env.NEXT_PUBLIC_TEST_API_URL || "http://localhost:3003/api"
			);

		default:
			throw new Error(`Unsupported environment: ${environment}`);
	}
}

/**
 * 環境変数から数値を安全に取得する
 */
function safeParseNumber(
	value: string | undefined,
	defaultValue: number,
): number {
	if (!value) return defaultValue;
	const parsed = Number(value);
	return Number.isNaN(parsed) ? defaultValue : parsed;
}

/**
 * API設定を作成する
 * 環境変数と環境種別に基づいて適切な設定を生成
 */
function createApiConfig(): ApiConfig {
	const environment = getCurrentEnvironment();
	const baseUrl = getBaseUrl(environment);

	return {
		baseUrl,
		timeout: safeParseNumber(
			process.env.NEXT_PUBLIC_API_TIMEOUT,
			DEFAULT_CONFIG.REQUEST_TIMEOUT,
		),
		maxRetries: safeParseNumber(
			process.env.NEXT_PUBLIC_API_MAX_RETRIES,
			DEFAULT_CONFIG.MAX_RETRIES,
		),
		retryDelay: safeParseNumber(
			process.env.NEXT_PUBLIC_API_RETRY_DELAY,
			DEFAULT_CONFIG.RETRY_DELAY,
		),
		environment,
	};
}

/**
 * グローバルAPI設定
 * アプリケーション全体で使用される設定インスタンス
 */
export const apiConfig: ApiConfig = createApiConfig();

/**
 * API エンドポイント定義
 * 各リソースのエンドポイントパスを定義
 */
export const endpoints = {
	subscriptions: {
		list: "/subscriptions",
		create: "/subscriptions",
		detail: (id: string) => `/subscriptions/${id}`,
		update: (id: string) => `/subscriptions/${id}`,
		delete: (id: string) => `/subscriptions/${id}`,
		stats: "/subscriptions/stats",
	},
	categories: {
		list: "/categories",
		create: "/categories",
		detail: (id: string) => `/categories/${id}`,
		update: (id: string) => `/categories/${id}`,
		delete: (id: string) => `/categories/${id}`,
	},
	transactions: {
		list: "/transactions",
		create: "/transactions",
		detail: (id: string) => `/transactions/${id}`,
		update: (id: string) => `/transactions/${id}`,
		delete: (id: string) => `/transactions/${id}`,
		stats: "/transactions/stats",
	},
} as const;

/**
 * 本番環境での実行時バリデーション
 * API使用時に適切な環境変数が設定されているかチェック
 */
function validateProductionConfig(): void {
	if (apiConfig.environment === "production") {
		// プレースホルダーURLが使用されている場合、本番環境で必要な環境変数が未設定
		if (apiConfig.baseUrl === "https://api.placeholder.local") {
			throw new Error(
				"NEXT_PUBLIC_API_URL environment variable is required in production. " +
					"This error occurs at runtime when the API is actually used, " +
					"allowing CI builds to succeed while ensuring production safety.",
			);
		}
	}
}

/**
 * 完全なURLを生成する
 * ベースURLとエンドポイントパスを結合
 * 本番環境では実行時にバリデーションを行う
 */
export function buildUrl(endpoint: string): string {
	// 本番環境での実行時バリデーション
	validateProductionConfig();

	const baseUrl = apiConfig.baseUrl.replace(/\/$/, ""); // 末尾のスラッシュを除去
	const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
	return `${baseUrl}${path}`;
}

/**
 * 開発時のデバッグ情報
 */
export function getDebugInfo() {
	return {
		environment: apiConfig.environment,
		baseUrl: apiConfig.baseUrl,
		timeout: apiConfig.timeout,
		maxRetries: apiConfig.maxRetries,
		retryDelay: apiConfig.retryDelay,
		nodeEnv: process.env.NODE_ENV,
		publicApiUrl: process.env.NEXT_PUBLIC_API_URL,
	};
}
