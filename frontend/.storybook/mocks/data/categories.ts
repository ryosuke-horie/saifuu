import type { Category } from "../../../src/lib/api/types";

// カテゴリデータのモック
export const mockCategories: Category[] = [
	{
		id: "3",
		name: "食費",
		type: "expense",
		color: "#FF6B6B",
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: "5",
		name: "仕事・ビジネス",
		type: "expense",
		color: "#8E44AD",
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: "10",
		name: "健康・フィットネス",
		type: "expense",
		color: "#96CEB4",
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: "12",
		name: "その他",
		type: "expense",
		color: "#FFEAA7",
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
];
