// 支出・収入データのモック
export const mockTransactions = [
	{
		id: "1",
		amount: 1000,
		category: "food",
		description: "ランチ",
		date: "2025-06-29",
		type: "expense" as const,
	},
	{
		id: "2",
		amount: 50000,
		category: "salary",
		description: "給与",
		date: "2025-06-25",
		type: "income" as const,
	},
	{
		id: "3",
		amount: 800,
		category: "transport",
		description: "電車代",
		date: "2025-06-28",
		type: "expense" as const,
	},
];

export const mockCategories = [
	{ id: "food", name: "食費", type: "expense" },
	{ id: "transport", name: "交通費", type: "expense" },
	{ id: "entertainment", name: "娯楽", type: "expense" },
	{ id: "salary", name: "給与", type: "income" },
	{ id: "bonus", name: "ボーナス", type: "income" },
];
