import type { Category } from "../../../src/lib/api/types";

// カテゴリデータのモック
export const mockCategories: Category[] = [
	{
		id: "cat-1",
		name: "エンターテイメント",
		type: "expense",
		color: "#FF6B6B",
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: "cat-2",
		name: "仕事・ビジネス",
		type: "expense",
		color: "#4ECDC4",
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: "cat-3",
		name: "ライフスタイル",
		type: "expense",
		color: "#45B7D1",
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: "cat-4",
		name: "その他",
		type: "expense",
		color: "#96CEB4",
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: "cat-5",
		name: "給与",
		type: "income",
		color: "#FFEAA7",
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
];
