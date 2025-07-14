/**
 * 取引データのモック
 *
 * API Transaction型に準拠したモックデータ
 * ExpenseListコンポーネントのStorybookとテストで使用
 */

import type { Transaction } from "../../../src/lib/api/types";
import { mockCategories } from "./categories";

// 支出・収入データのモック
export const mockTransactions: Transaction[] = [
	{
		id: "txn-1",
		amount: 1000,
		type: "expense",
		description: "昼食代（コンビニ弁当）",
		date: "2025-07-09",
		category: mockCategories.find((cat) => cat.name === "その他") || null,
		createdAt: "2025-07-09T12:30:00Z",
		updatedAt: "2025-07-09T12:30:00Z",
	},
	{
		id: "txn-2",
		amount: 5000,
		type: "expense",
		description: "書籍代",
		date: "2025-07-01",
		category: mockCategories.find((cat) => cat.name === "その他") || null,
		createdAt: "2025-07-01T09:00:00Z",
		updatedAt: "2025-07-01T09:00:00Z",
	},
	{
		id: "txn-3",
		amount: 800,
		type: "expense",
		description: "電車代（通勤）",
		date: "2025-07-08",
		category: mockCategories.find((cat) => cat.name === "その他") || null,
		createdAt: "2025-07-08T08:15:00Z",
		updatedAt: "2025-07-08T08:15:00Z",
	},
	{
		id: "txn-4",
		amount: 2500,
		type: "expense",
		description: "映画チケット",
		date: "2025-07-07",
		category: mockCategories.find((cat) => cat.name === "その他") || null,
		createdAt: "2025-07-07T19:30:00Z",
		updatedAt: "2025-07-07T19:30:00Z",
	},
	{
		id: "txn-5",
		amount: 15000,
		type: "expense",
		description: "書籍購入（技術書）",
		date: "2025-07-05",
		category:
			mockCategories.find((cat) => cat.name === "仕事・ビジネス") || null,
		createdAt: "2025-07-05T14:20:00Z",
		updatedAt: "2025-07-05T14:20:00Z",
	},
];

// レガシーmockCategoriesは削除（categories.tsから参照）
// 代わりにmockCategoriesを categories.ts からインポート
