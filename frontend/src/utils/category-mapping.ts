import type { Category } from "../lib/api/types";
import type { CategoryConfig } from "../../../shared/config/categories";

/**
 * グローバルカテゴリ設定の文字列IDとデータベースの数値IDをマッピング
 * 
 * このマッピングは、グローバルカテゴリ設定（文字列ID）と
 * データベースのカテゴリ（数値ID）の間の変換を行います。
 */

// カテゴリ名からデータベースのカテゴリIDを検索
export function findCategoryIdByName(
  categories: Category[],
  name: string
): number | undefined {
  const category = categories.find(cat => cat.name === name);
  return category?.id;
}

// グローバルカテゴリIDからデータベースのカテゴリIDを検索
export function mapGlobalCategoryIdToDbId(
  categories: Category[],
  globalCategoryId: string,
  globalCategories: CategoryConfig[]
): number | undefined {
  // グローバルカテゴリ設定から名前を取得
  const globalCategory = globalCategories.find(cat => cat.id === globalCategoryId);
  if (!globalCategory) return undefined;
  
  // データベースのカテゴリから同じ名前のものを検索
  return findCategoryIdByName(categories, globalCategory.name);
}

// 支出フォーム送信時のデータ変換
export function convertExpenseFormData(
  formData: any,
  categories: Category[],
  globalCategories: CategoryConfig[]
): any {
  const converted = { ...formData };
  
  // カテゴリIDの変換（文字列 → 数値）
  if (formData.categoryId && typeof formData.categoryId === 'string') {
    const dbCategoryId = mapGlobalCategoryIdToDbId(
      categories,
      formData.categoryId,
      globalCategories
    );
    converted.categoryId = dbCategoryId;
  }
  
  return converted;
}