import { describe, expect, it } from "vitest";
import type { TransactionWithCategory } from "@/lib/api/types";
import {
  isCategoryArray,
  isTransactionArray,
  isTransactionWithCategory,
  isTransactionWithCategoryArray,
} from "../typeGuards";

const validCategory = {
  id: "c1",
  name: "Salary",
  type: "income",
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
};

const validTransaction: TransactionWithCategory = {
  id: "t1",
  amount: 1000,
  type: "income",
  date: "2024-01-01",
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
  categoryId: "c1",
  category: validCategory,
};

describe("typeGuards", () => {
  it("isTransactionWithCategoryArray should validate array", () => {
    expect(isTransactionWithCategoryArray([validTransaction])).toBe(true);
    expect(isTransactionWithCategoryArray([{}])).toBe(false);
  });

  it("isTransactionWithCategory should validate single transaction", () => {
    expect(isTransactionWithCategory(validTransaction)).toBe(true);
    expect(
      isTransactionWithCategory({ ...validTransaction, amount: "1000" })
    ).toBe(false);
  });

  it("isTransactionArray should validate transactions", () => {
    expect(isTransactionArray([validTransaction])).toBe(true);
    expect(isTransactionArray([{ id: "1" }])).toBe(false);
  });

  it("isCategoryArray should validate categories", () => {
    expect(isCategoryArray([validCategory])).toBe(true);
    expect(isCategoryArray([{ id: "1" }])).toBe(false);
  });
});

