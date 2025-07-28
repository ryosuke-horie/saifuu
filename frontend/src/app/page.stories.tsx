import type { Meta, StoryObj } from "@storybook/react";
import { HttpResponse, http } from "msw";
import Page from "./page";

const meta = {
	title: "Pages/Dashboard",
	component: Page,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"家計管理アプリケーションのダッシュボードページ。支出・収入・サブスクリプションのサマリーと各管理ページへのナビゲーションを提供します。",
			},
		},
	},
	tags: ["autodocs"],
} satisfies Meta<typeof Page>;

export default meta;
type Story = StoryObj<typeof meta>;

// モックデータ
const mockExpenses = [
	{
		id: "1",
		amount: 1500,
		type: "expense" as const,
		description: "ランチ",
		date: "2024-01-15",
		category: {
			id: "1",
			name: "食費",
			type: "expense" as const,
			color: "#FF6B6B",
			createdAt: "2024-01-01",
			updatedAt: "2024-01-01",
		},
		createdAt: "2024-01-15",
		updatedAt: "2024-01-15",
	},
	{
		id: "2",
		amount: 3000,
		type: "expense" as const,
		description: "電車代",
		date: "2024-01-16",
		category: {
			id: "2",
			name: "交通費",
			type: "expense" as const,
			color: "#4ECDC4",
			createdAt: "2024-01-01",
			updatedAt: "2024-01-01",
		},
		createdAt: "2024-01-16",
		updatedAt: "2024-01-16",
	},
];

const mockIncomes = [
	{
		id: "3",
		amount: 300000,
		type: "income" as const,
		description: "給与",
		date: "2024-01-25",
		category: {
			id: "3",
			name: "給与",
			type: "income" as const,
			color: "#51CF66",
			createdAt: "2024-01-01",
			updatedAt: "2024-01-01",
		},
		createdAt: "2024-01-25",
		updatedAt: "2024-01-25",
	},
];

const mockSubscriptionStats = {
	stats: {
		totalActive: 5,
		totalInactive: 2,
		monthlyTotal: 15980,
		yearlyTotal: 191760,
		avgMonthlyAmount: 3196,
		categoryBreakdown: [
			{
				categoryId: "4",
				categoryName: "エンタメ",
				count: 3,
				totalAmount: 3970,
			},
			{
				categoryId: "5",
				categoryName: "仕事効率化",
				count: 2,
				totalAmount: 12010,
			},
		],
	},
	upcomingBillings: [
		{
			subscriptionId: "sub1",
			subscriptionName: "Netflix",
			amount: 1490,
			billingDate: "2024-02-01",
			daysUntilBilling: 5,
		},
		{
			subscriptionId: "sub2",
			subscriptionName: "GitHub Pro",
			amount: 1130,
			billingDate: "2024-02-05",
			daysUntilBilling: 9,
		},
	],
};

// 基本的なストーリー
export const Default: Story = {
	parameters: {
		msw: {
			handlers: [
				http.get("/api/transactions", () => {
					return HttpResponse.json([...mockExpenses, ...mockIncomes]);
				}),
				http.get("/api/subscriptions/stats", () => {
					return HttpResponse.json(mockSubscriptionStats);
				}),
			],
		},
	},
};

// ローディング状態
export const Loading: Story = {
	parameters: {
		msw: {
			handlers: [
				http.get("/api/transactions", async () => {
					await new Promise((resolve) => setTimeout(resolve, 10000));
					return HttpResponse.json([]);
				}),
				http.get("/api/subscriptions/stats", async () => {
					await new Promise((resolve) => setTimeout(resolve, 10000));
					return HttpResponse.json({});
				}),
			],
		},
	},
};

// エラー状態
export const ErrorState: Story = {
	parameters: {
		msw: {
			handlers: [
				http.get("/api/transactions", () => {
					return HttpResponse.error();
				}),
				http.get("/api/subscriptions/stats", () => {
					return HttpResponse.error();
				}),
			],
		},
	},
};

// データなし
export const EmptyData: Story = {
	parameters: {
		msw: {
			handlers: [
				http.get("/api/transactions", () => {
					return HttpResponse.json([]);
				}),
				http.get("/api/subscriptions/stats", () => {
					return HttpResponse.json({
						stats: {
							totalActive: 0,
							totalInactive: 0,
							monthlyTotal: 0,
							yearlyTotal: 0,
							avgMonthlyAmount: 0,
							categoryBreakdown: [],
						},
						upcomingBillings: [],
					});
				}),
			],
		},
	},
};

// 高額な取引データ
export const HighAmounts: Story = {
	parameters: {
		msw: {
			handlers: [
				http.get("/api/transactions", () => {
					return HttpResponse.json([
						{
							id: "4",
							amount: 1500000,
							type: "expense" as const,
							description: "車の購入",
							date: "2024-01-20",
							category: null,
							createdAt: "2024-01-20",
							updatedAt: "2024-01-20",
						},
						{
							id: "5",
							amount: 5000000,
							type: "income" as const,
							description: "ボーナス",
							date: "2024-01-25",
							category: null,
							createdAt: "2024-01-25",
							updatedAt: "2024-01-25",
						},
					]);
				}),
				http.get("/api/subscriptions/stats", () => {
					return HttpResponse.json({
						stats: {
							totalActive: 25,
							totalInactive: 5,
							monthlyTotal: 150000,
							yearlyTotal: 1800000,
							avgMonthlyAmount: 6000,
							categoryBreakdown: [],
						},
						upcomingBillings: [],
					});
				}),
			],
		},
	},
};

// 部分的なエラー（支出データのみエラー）
export const PartialError: Story = {
	parameters: {
		msw: {
			handlers: [
				http.get("/api/transactions", () => {
					return HttpResponse.error();
				}),
				http.get("/api/subscriptions/stats", () => {
					return HttpResponse.json(mockSubscriptionStats);
				}),
			],
		},
	},
};
