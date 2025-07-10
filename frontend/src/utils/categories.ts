import type { Category } from "../types/category";
import { getCategoriesByType } from "../../../shared/config/categories";
import type { CategoryConfig } from "../../../shared/config/categories";

/**
 * グローバルカテゴリ設定をCategoryオブジェクトに変換する
 * 
 * グローバルカテゴリ設定は実行時の設定値として扱われるため、
 * DBのカテゴリエンティティとして扱うために固定の日付を設定する
 * 
 * @param type - 取得するカテゴリのタイプ ("expense" | "income")
 * @returns カテゴリの配列
 */
export const convertGlobalCategoriesToCategory = (type: "expense" | "income"): Category[] => {
  const globalCategories = getCategoriesByType(type);
  // 固定の日付を使用して参照の一貫性を保つ
  const fixedDate = "2024-01-01T00:00:00.000Z";
  
  return globalCategories.map((config: CategoryConfig) => ({
    id: config.id,
    name: config.name,
    type: config.type,
    color: config.color,
    createdAt: fixedDate,
    updatedAt: fixedDate,
  }));
};