import type {
	BillingCycle,
	Category,
	CategoryType,
	CreateTransactionRequest,
	Subscription,
	Transaction,
	TransactionType,
	UpdateTransactionRequest,
} from "@shared/types";
import { describe, expect, it } from "vitest";

describe("Frontend Shared Types Import", () => {
	it("should be able to import and use shared types", () => {
		// 型が正しくインポートできることを確認
		const transaction: Transaction = {
			id: "1",
			amount: 1000,
			type: "expense",
			description: "Test transaction",
			date: "2024-01-01",
			categoryId: "cat1",
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		};

		const category: Category = {
			id: "1",
			name: "Food",
			type: "expense",
			description: "Food expenses",
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		};

		const subscription: Subscription = {
			id: "1",
			name: "Netflix",
			amount: 1500,
			billingCycle: "monthly",
			startDate: "2024-01-01",
			endDate: null,
			categoryId: "cat1",
			description: "Streaming service",
			isActive: true,
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		};

		expect(transaction.type).toBe("expense");
		expect(category.type).toBe("expense");
		expect(subscription.billingCycle).toBe("monthly");
	});

	it("should be able to use request types", () => {
		const createRequest: CreateTransactionRequest = {
			amount: 1000,
			type: "income",
			description: "Salary",
			date: "2024-01-01",
			categoryId: "cat1",
		};

		const updateRequest: UpdateTransactionRequest = {
			amount: 2000,
			description: "Updated salary",
		};

		expect(createRequest.type).toBe("income");
		expect(updateRequest.amount).toBe(2000);
	});

	it("should be able to use literal types", () => {
		const transactionType: TransactionType = "income";
		const categoryType: CategoryType = "expense";
		const billingCycle: BillingCycle = "monthly";

		const types: TransactionType[] = ["income", "expense"];
		const categoryTypes: CategoryType[] = ["expense", "income"];
		const cycles: BillingCycle[] = ["monthly", "yearly", "weekly"];

		expect(types).toContain(transactionType);
		expect(categoryTypes).toContain(categoryType);
		expect(cycles).toContain(billingCycle);
	});
});
