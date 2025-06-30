/**
 * カテゴリ関連の型定義
 * lib/api/types.ts からカテゴリ型をre-exportし、
 * 追加のカテゴリ固有の型を定義
 */

// 基本的なカテゴリ型をre-export
export type { Category, CategoryType, CreateCategoryRequest, UpdateCategoryRequest } from '../lib/api/types';

/**
 * カテゴリ選択用の簡易型
 * フォームのselect要素などで使用
 */
export interface CategoryOption {
  id: string;
  name: string;
}

// 基本的なカテゴリ型をインポート
import type { Category } from '../lib/api/types';

/**
 * カテゴリ一覧表示用のプロパティ
 */
export interface CategoryListProps {
  /**
   * カテゴリデータの配列
   */
  categories: Category[];

  /**
   * ローディング状態
   */
  isLoading?: boolean;

  /**
   * エラー状態
   */
  error?: string | null;

  /**
   * 追加のCSSクラス名
   */
  className?: string;
}