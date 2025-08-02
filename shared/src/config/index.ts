// 設定ファイルのエクスポート

// CategoryTypeはtypesからインポートされるので、ここでは再エクスポートしない
export type { CategoryConfig } from "./categories";
export { 
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  ALL_CATEGORIES,
  getCategoriesByType,
  getCategoryById,
  getCategoryByName,
  getCategoryOptions,
  getDefaultCategory,
  validateCategoryConfig 
} from "./categories";