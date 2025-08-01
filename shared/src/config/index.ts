// 設定ファイルのエクスポート

// CategoryTypeはtypesからインポートされるので、ここでは再エクスポートしない
export type { CategoryConfig } from './categories'
export {
	ALL_CATEGORIES,
	EXPENSE_CATEGORIES,
	getCategoriesByType,
	getCategoryById,
	getCategoryByName,
	getCategoryOptions,
	getDefaultCategory,
	INCOME_CATEGORIES,
	validateCategoryConfig,
} from './categories'
