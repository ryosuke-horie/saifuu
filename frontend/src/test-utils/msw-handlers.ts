// MSWハンドラーユーティリティ
// テスト用のMSWハンドラーを簡単に作成するためのヘルパー関数
// 一貫性のあるAPIモックを提供

import { HttpResponse, http } from "msw";
import { apiConfig } from "@/lib/api/config";
import {
	createMockCategories,
	createMockSubscriptions,
} from "./mock-factories";

// 成功レスポンスのハンドラー作成
export const createSuccessHandlers = () => [
	// カテゴリー一覧取得
	http.get(`${apiConfig.baseUrl}/categories`, () => {
		return HttpResponse.json({
			categories: createMockCategories(5),
		});
	}),

	// サブスクリプション一覧取得
	http.get(`${apiConfig.baseUrl}/subscriptions`, () => {
		return HttpResponse.json({
			subscriptions: createMockSubscriptions(10),
		});
	}),

	// サブスクリプション作成
	http.post(`${apiConfig.baseUrl}/subscriptions`, async ({ request }) => {
		const body = (await request.json()) as Record<string, unknown>;
		return HttpResponse.json({
			subscription: {
				id: Math.floor(Math.random() * 1000),
				...body,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			},
		});
	}),

	// サブスクリプション更新
	http.put(
		`${apiConfig.baseUrl}/subscriptions/:id`,
		async ({ request, params }) => {
			const body = (await request.json()) as Record<string, unknown>;
			return HttpResponse.json({
				subscription: {
					id: Number(params.id),
					...body,
					updatedAt: new Date().toISOString(),
				},
			});
		},
	),

	// サブスクリプション削除
	http.delete(`${apiConfig.baseUrl}/subscriptions/:id`, () => {
		return HttpResponse.json({ success: true });
	}),
];

// エラーレスポンスのハンドラー作成
export const createErrorHandlers = () => [
	// ネットワークエラー
	http.get(`${apiConfig.baseUrl}/categories`, () => {
		return HttpResponse.error();
	}),

	// サーバーエラー
	http.get(`${apiConfig.baseUrl}/subscriptions`, () => {
		return HttpResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}),

	// バリデーションエラー
	http.post(`${apiConfig.baseUrl}/subscriptions`, () => {
		return HttpResponse.json(
			{
				error: "Validation Error",
				details: {
					name: ["名前は必須です"],
					amount: ["金額は0より大きい数値を入力してください"],
				},
			},
			{ status: 400 },
		);
	}),
];

// 遅延レスポンスのハンドラー作成
export const createDelayedHandlers = (delay = 1000) => [
	http.get(`${apiConfig.baseUrl}/categories`, async () => {
		await new Promise((resolve) => setTimeout(resolve, delay));
		return HttpResponse.json({
			categories: createMockCategories(5),
		});
	}),

	http.get(`${apiConfig.baseUrl}/subscriptions`, async () => {
		await new Promise((resolve) => setTimeout(resolve, delay));
		return HttpResponse.json({
			subscriptions: createMockSubscriptions(10),
		});
	}),
];

// 空レスポンスのハンドラー作成
export const createEmptyHandlers = () => [
	http.get(`${apiConfig.baseUrl}/categories`, () => {
		return HttpResponse.json({ categories: [] });
	}),

	http.get(`${apiConfig.baseUrl}/subscriptions`, () => {
		return HttpResponse.json({ subscriptions: [] });
	}),
];
