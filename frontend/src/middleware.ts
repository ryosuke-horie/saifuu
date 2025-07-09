/**
 * Next.js Middleware
 * requestIdの生成・管理とロガー機能統合
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * requestID生成（フロントエンドロガーと共通）
 */
function generateRequestId(): string {
	// crypto.randomUUIDが利用可能な場合
	if (typeof crypto !== "undefined" && crypto.randomUUID) {
		return crypto.randomUUID();
	}

	// フォールバック: 簡易UUID生成
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		const v = c === "x" ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

/**
 * Next.js Middleware関数
 * 全てのリクエストにrequestIdを生成・追加
 */
export function middleware(request: NextRequest) {
	// 既存のrequestIdをチェック、なければ新規生成
	const existingRequestId = request.headers.get("X-Request-ID");
	const requestId = existingRequestId || generateRequestId();

	// レスポンスを作成
	const response = NextResponse.next();

	// レスポンスヘッダーにrequestIdを追加
	response.headers.set("X-Request-ID", requestId);

	// クライアントサイドでアクセス可能にするため、カスタムヘッダーも追加
	response.headers.set("X-Saifuu-Request-ID", requestId);

	// 開発環境では詳細なリクエスト情報をログ出力
	if (process.env.NODE_ENV === "development") {
		console.log(
			`[MIDDLEWARE] ${request.method} ${request.url} - RequestID: ${requestId}`,
		);
	}

	return response;
}

/**
 * Middleware設定
 * API routesとstatic filesを除外
 */
export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public files (images, etc.)
		 */
		"/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
