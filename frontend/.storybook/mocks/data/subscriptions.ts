import type { Subscription } from "../../../src/types/subscription";
import { mockCategories } from "./categories";

// サブスクリプションデータのモック
export const mockSubscriptions: Subscription[] = [
	{
		id: "1",
		name: "Netflix",
		amount: 1480,
		billingCycle: "monthly" as const,
		nextBillingDate: "2025-07-01",
		category: mockCategories[0], // エンターテイメント
		isActive: true,
		description: "動画ストリーミングサービス",
	},
	{
		id: "2",
		name: "Spotify",
		amount: 980,
		billingCycle: "monthly" as const,
		nextBillingDate: "2025-07-15",
		category: mockCategories[0], // エンターテイメント
		isActive: true,
		description: "音楽ストリーミングサービス",
	},
	{
		id: "3",
		name: "Adobe Creative Suite",
		amount: 5680,
		billingCycle: "monthly" as const,
		nextBillingDate: "2025-07-10",
		category: mockCategories[1], // 仕事・ビジネス
		isActive: true,
		description: "デザイン・動画編集ソフトウェア",
	},
];
