// 基本的な型定義

export type TransactionType = "income" | "expense";

export type CategoryType = "expense" | "income";

export type BillingCycle = "monthly" | "yearly" | "weekly";

// 基本的なエンティティ型
export interface BaseTransaction {
  id: string;
  amount: number;
  type: TransactionType;
  description?: string | null;
  date: string;
  categoryId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BaseCategory {
  id: string;
  name: string;
  type: CategoryType;
  color?: string | null;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BaseSubscription {
  id: string;
  name: string;
  amount: number;
  billingCycle: BillingCycle;
  startDate: string;
  endDate?: string | null;
  nextBillingDate?: string | null;
  categoryId?: string | null;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 統計情報の型
export interface BaseBalanceSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  incomeCount: number;
  expenseCount: number;
}

export interface BaseTransactionStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  incomeCount: number;
  expenseCount: number;
  monthlyStats: Array<{
    month: string;
    income: number;
    expense: number;
    balance: number;
  }>;
  categoryStats: Array<{
    categoryId: string;
    categoryName: string;
    amount: number;
    count: number;
  }>;
}