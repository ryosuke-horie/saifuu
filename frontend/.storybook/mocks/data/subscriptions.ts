// サブスクリプションデータのモック
export const mockSubscriptions = [
	{
		id: "1",
		name: "Netflix",
		amount: 1480,
		billingCycle: "monthly" as const,
		nextBillingDate: "2025-07-01",
		category: "entertainment",
	},
	{
		id: "2",
		name: "Spotify",
		amount: 980,
		billingCycle: "monthly" as const,
		nextBillingDate: "2025-07-15",
		category: "entertainment",
	},
	{
		id: "3",
		name: "Adobe Creative Suite",
		amount: 5680,
		billingCycle: "monthly" as const,
		nextBillingDate: "2025-07-10",
		category: "work",
	},
];
