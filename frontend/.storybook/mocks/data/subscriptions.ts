import type { SubscriptionWithCategory } from "../../../src/lib/api/types";
import { mockCategories } from "./categories";

// サブスクリプションデータのモック
export const mockSubscriptions: SubscriptionWithCategory[] = [
	{
		id: "1",
		name: "Netflix",
		amount: 1480,
		billingCycle: "monthly" as const,
		nextBillingDate: "2025-07-01",
		category: mockCategories[3], // その他
		categoryId: mockCategories[3]?.id || null,
		startDate: "2025-01-01",
		isActive: true,
		description: "動画ストリーミングサービス",
		createdAt: "2025-01-01T00:00:00Z",
		updatedAt: "2025-01-01T00:00:00Z",
	},
	{
		id: "2",
		name: "Spotify",
		amount: 980,
		billingCycle: "monthly" as const,
		nextBillingDate: "2025-07-15",
		category: mockCategories[3], // その他
		categoryId: mockCategories[3]?.id || null,
		startDate: "2025-01-01",
		isActive: true,
		description: "音楽ストリーミングサービス",
		createdAt: "2025-01-02T00:00:00Z",
		updatedAt: "2025-01-02T00:00:00Z",
	},
	{
		id: "3",
		name: "Adobe Creative Suite",
		amount: 5680,
		billingCycle: "monthly" as const,
		nextBillingDate: "2025-07-10",
		category: mockCategories[1], // 仕事・ビジネス
		categoryId: mockCategories[1]?.id || null,
		startDate: "2025-01-01",
		isActive: true,
		description: "デザイン・動画編集ソフトウェア",
		createdAt: "2025-01-03T00:00:00Z",
		updatedAt: "2025-01-03T00:00:00Z",
	},
];
