/**
 * カテゴリAPI関連のエクスポート
 */

// API関数
export { fetchCategories, fetchCategoryById } from './api';

// 型定義
export type {
  ApiCategoryResponse,
  ApiCategoryListResponse,
  ApiCategoryErrorResponse,
} from './types';

// 変換関数
export { transformApiCategoryToFrontend, transformApiCategoriesToFrontend } from './transformers';