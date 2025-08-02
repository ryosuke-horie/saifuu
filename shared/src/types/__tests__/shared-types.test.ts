import { describe, it, expect } from "vitest";
import type {
  TransactionType,
  CategoryType,
  BillingCycle,
  BaseTransaction,
  BaseCategory,
  BaseSubscription,
  Transaction,
  Category,
  Subscription,
  CreateTransactionRequest,
  UpdateTransactionRequest,
} from "../index";
import {
  isTransactionType,
  isCategoryType,
  isBillingCycle,
  isTransaction,
  isCategory,
  isSubscription,
  assertTransactionType,
  assertCategoryType,
  assertBillingCycle,
  assertTransaction,
  assertCategory,
  assertSubscription,
} from "../index";

describe("Shared Types", () => {
  describe("Type Guards", () => {
    describe("isTransactionType", () => {
      it("should return true for valid transaction types", () => {
        expect(isTransactionType("income")).toBe(true);
        expect(isTransactionType("expense")).toBe(true);
      });

      it("should return false for invalid transaction types", () => {
        expect(isTransactionType("invalid")).toBe(false);
        expect(isTransactionType(123)).toBe(false);
        expect(isTransactionType(null)).toBe(false);
        expect(isTransactionType(undefined)).toBe(false);
      });
    });

    describe("isCategoryType", () => {
      it("should return true for valid category types", () => {
        expect(isCategoryType("expense")).toBe(true);
        expect(isCategoryType("income")).toBe(true);
      });

      it("should return false for invalid category types", () => {
        expect(isCategoryType("invalid")).toBe(false);
        expect(isCategoryType(123)).toBe(false);
        expect(isCategoryType(null)).toBe(false);
      });
    });

    describe("isBillingCycle", () => {
      it("should return true for valid billing cycles", () => {
        expect(isBillingCycle("monthly")).toBe(true);
        expect(isBillingCycle("yearly")).toBe(true);
        expect(isBillingCycle("weekly")).toBe(true);
      });

      it("should return false for invalid billing cycles", () => {
        expect(isBillingCycle("daily")).toBe(false);
        expect(isBillingCycle(123)).toBe(false);
        expect(isBillingCycle(null)).toBe(false);
      });
    });

    describe("isTransaction", () => {
      const validTransaction: Transaction = {
        id: "1",
        amount: 1000,
        type: "expense",
        description: "Test transaction",
        date: "2024-01-01",
        categoryId: "cat1",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      it("should return true for valid transaction", () => {
        expect(isTransaction(validTransaction)).toBe(true);
      });

      it("should return true for transaction without optional fields", () => {
        const minimalTransaction = {
          id: "1",
          amount: 1000,
          type: "income",
          date: "2024-01-01",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        };
        expect(isTransaction(minimalTransaction)).toBe(true);
      });

      it("should return false for invalid transaction", () => {
        expect(isTransaction({})).toBe(false);
        expect(isTransaction({ id: "1" })).toBe(false);
        expect(isTransaction({ ...validTransaction, type: "invalid" })).toBe(false);
        expect(isTransaction(null)).toBe(false);
        expect(isTransaction(undefined)).toBe(false);
      });
    });

    describe("isCategory", () => {
      const validCategory: Category = {
        id: "1",
        name: "Food",
        type: "expense",
        description: "Food expenses",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      it("should return true for valid category", () => {
        expect(isCategory(validCategory)).toBe(true);
      });

      it("should return true for category without optional fields", () => {
        const minimalCategory = {
          id: "1",
          name: "Food",
          type: "expense",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        };
        expect(isCategory(minimalCategory)).toBe(true);
      });

      it("should return false for invalid category", () => {
        expect(isCategory({})).toBe(false);
        expect(isCategory({ id: "1" })).toBe(false);
        expect(isCategory({ ...validCategory, type: "invalid" })).toBe(false);
        expect(isCategory(null)).toBe(false);
      });
    });

    describe("isSubscription", () => {
      const validSubscription: Subscription = {
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

      it("should return true for valid subscription", () => {
        expect(isSubscription(validSubscription)).toBe(true);
      });

      it("should return true for subscription without optional fields", () => {
        const minimalSubscription = {
          id: "1",
          name: "Netflix",
          amount: 1500,
          billingCycle: "monthly",
          startDate: "2024-01-01",
          isActive: true,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        };
        expect(isSubscription(minimalSubscription)).toBe(true);
      });

      it("should return false for invalid subscription", () => {
        expect(isSubscription({})).toBe(false);
        expect(isSubscription({ id: "1" })).toBe(false);
        expect(isSubscription({ ...validSubscription, billingCycle: "invalid" })).toBe(false);
        expect(isSubscription(null)).toBe(false);
      });
    });
  });

  describe("Assertion Functions", () => {
    describe("assertTransactionType", () => {
      it("should not throw for valid transaction type", () => {
        expect(() => assertTransactionType("income")).not.toThrow();
        expect(() => assertTransactionType("expense")).not.toThrow();
      });

      it("should throw for invalid transaction type", () => {
        expect(() => assertTransactionType("invalid")).toThrow("Invalid transaction type: invalid");
        expect(() => assertTransactionType(123)).toThrow();
      });
    });

    describe("assertCategoryType", () => {
      it("should not throw for valid category type", () => {
        expect(() => assertCategoryType("expense")).not.toThrow();
        expect(() => assertCategoryType("income")).not.toThrow();
      });

      it("should throw for invalid category type", () => {
        expect(() => assertCategoryType("invalid")).toThrow("Invalid category type: invalid");
        expect(() => assertCategoryType(123)).toThrow();
      });
    });

    describe("assertBillingCycle", () => {
      it("should not throw for valid billing cycle", () => {
        expect(() => assertBillingCycle("monthly")).not.toThrow();
        expect(() => assertBillingCycle("yearly")).not.toThrow();
        expect(() => assertBillingCycle("weekly")).not.toThrow();
      });

      it("should throw for invalid billing cycle", () => {
        expect(() => assertBillingCycle("daily")).toThrow("Invalid billing cycle: daily");
        expect(() => assertBillingCycle(123)).toThrow();
      });
    });

    describe("assertTransaction", () => {
      const validTransaction: Transaction = {
        id: "1",
        amount: 1000,
        type: "expense",
        date: "2024-01-01",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      it("should not throw for valid transaction", () => {
        expect(() => assertTransaction(validTransaction)).not.toThrow();
      });

      it("should throw for invalid transaction", () => {
        expect(() => assertTransaction({})).toThrow("Value is not a valid Transaction");
        expect(() => assertTransaction(null)).toThrow();
      });
    });

    describe("assertCategory", () => {
      const validCategory: Category = {
        id: "1",
        name: "Food",
        type: "expense",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      it("should not throw for valid category", () => {
        expect(() => assertCategory(validCategory)).not.toThrow();
      });

      it("should throw for invalid category", () => {
        expect(() => assertCategory({})).toThrow("Value is not a valid Category");
        expect(() => assertCategory(null)).toThrow();
      });
    });

    describe("assertSubscription", () => {
      const validSubscription: Subscription = {
        id: "1",
        name: "Netflix",
        amount: 1500,
        billingCycle: "monthly",
        startDate: "2024-01-01",
        isActive: true,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      it("should not throw for valid subscription", () => {
        expect(() => assertSubscription(validSubscription)).not.toThrow();
      });

      it("should throw for invalid subscription", () => {
        expect(() => assertSubscription({})).toThrow("Value is not a valid Subscription");
        expect(() => assertSubscription(null)).toThrow();
      });
    });
  });

  describe("Type Compatibility", () => {
    it("should allow creating valid request objects", () => {
      const createRequest: CreateTransactionRequest = {
        amount: 1000,
        type: "expense",
        description: "Test",
        date: "2024-01-01",
        categoryId: "cat1",
      };

      const updateRequest: UpdateTransactionRequest = {
        amount: 2000,
        description: "Updated",
      };

      expect(createRequest.type).toBe("expense");
      expect(updateRequest.amount).toBe(2000);
    });

    it("should maintain type safety for literal types", () => {
      const transactionType: TransactionType = "income";
      const categoryType: CategoryType = "expense";
      const billingCycle: BillingCycle = "monthly";

      expect(transactionType).toBe("income");
      expect(categoryType).toBe("expense");
      expect(billingCycle).toBe("monthly");
    });
  });
});