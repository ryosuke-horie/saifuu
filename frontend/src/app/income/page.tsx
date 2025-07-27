"use client";

import { useState, useEffect, useCallback } from "react";
import { IncomeForm } from "../../components/income/IncomeForm";
import { IncomeList } from "../../components/income/IncomeList";
import { apiClient } from "@/lib/api";
import type { Transaction } from "@/lib/api/types";
import type { Category } from "@/types/category";

/**
 * 収入管理メインページ
 * 
 * 収入の一覧表示と登録・編集・削除機能を提供する統合ページ
 * 支出管理ページのパターンを踏襲し、収入に特化した実装
 */
export default function IncomePage() {
  // 状態管理
  const [incomes, setIncomes] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [operationLoading, setOperationLoading] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Transaction | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  
  // 収入データの取得
  const fetchIncomes = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.transactions.list({ type: "income" });
      setIncomes(response.data);
    } catch (err) {
      setError("データの取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // カテゴリデータの取得
  const fetchCategories = useCallback(async () => {
    try {
      const response = await apiClient.categories.list();
      setCategories(response as Category[]);
    } catch (err) {
      console.error("カテゴリの取得に失敗しました", err);
    }
  }, []);

  // 初期データ取得
  useEffect(() => {
    fetchIncomes();
    fetchCategories();
  }, [fetchIncomes, fetchCategories]);

  // フォーム送信ハンドラー
  const handleSubmit = async (data: any) => {
    try {
      setOperationLoading(true);
      if (editingIncome) {
        await apiClient.transactions.update(editingIncome.id, {
          ...data,
          type: "income",
        });
      } else {
        await apiClient.transactions.create({
          ...data,
          type: "income",
        });
      }
      setEditingIncome(null);
      await fetchIncomes();
    } catch (err) {
      console.error("操作に失敗しました", err);
    } finally {
      setOperationLoading(false);
    }
  };

  // 編集ハンドラー
  const handleEdit = (transaction: Transaction) => {
    setEditingIncome(transaction);
  };

  // 削除ハンドラー
  const handleDelete = (id: string) => {
    setDeleteTargetId(id);
  };

  // 削除確認ハンドラー
  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    try {
      setOperationLoading(true);
      await apiClient.transactions.delete(deleteTargetId);
      setDeleteTargetId(null);
      await fetchIncomes();
    } catch (err) {
      console.error("削除に失敗しました", err);
    } finally {
      setOperationLoading(false);
    }
  };

  // 削除キャンセルハンドラー
  const handleDeleteCancel = () => {
    setDeleteTargetId(null);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">収入管理</h1>
      
      {/* 収入登録フォーム */}
      <div className="mb-8">
        <IncomeForm
          onSubmit={handleSubmit}
          onCancel={() => setEditingIncome(null)}
          isSubmitting={operationLoading}
          initialData={editingIncome ? {
            amount: editingIncome.amount,
            type: "income" as const,
            date: editingIncome.date,
            description: editingIncome.description || "",
            categoryId: editingIncome.category?.id || "",
          } : undefined}
          categories={categories}
        />
      </div>

      {/* エラー表示 */}
      {error && !isLoading && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* ローディング表示 */}
      {isLoading && (
        <div className="text-center py-8">
          読み込み中...
        </div>
      )}

      {/* 収入一覧 */}
      {!isLoading && (
        <IncomeList
          transactions={incomes}
          isLoading={isLoading}
          error={error}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* 削除確認ダイアログ（簡易版） */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">削除の確認</h3>
            <p className="mb-6">この収入を削除してもよろしいですか？</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleDeleteCancel}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded"
              >
                キャンセル
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded"
                disabled={operationLoading}
              >
                削除を確定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}