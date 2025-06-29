import { HttpResponse, http } from "msw";

// APIハンドラーの例
export const handlers = [
	// 今後のAPI用のプレースホルダー
	http.get("/api/transactions", () => {
		return HttpResponse.json([
			{
				id: "1",
				amount: 1000,
				category: "food",
				description: "ランチ",
				date: "2025-06-29",
				type: "expense",
			},
			{
				id: "2",
				amount: 50000,
				category: "salary",
				description: "給与",
				date: "2025-06-25",
				type: "income",
			},
		]);
	}),

	http.get("/api/subscriptions", () => {
		return HttpResponse.json([
			{
				id: "1",
				name: "Netflix",
				amount: 1480,
				billingCycle: "monthly",
				nextBillingDate: "2025-07-01",
			},
		]);
	}),
];
