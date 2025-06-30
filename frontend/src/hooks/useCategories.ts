/**
 * カテゴリ管理のカスタムフック
 * カテゴリの取得とローディング状態を管理
 */

import { useState, useEffect } from 'react';
import type { Category } from '../types/category';
import { fetchCategories } from '../lib/api/categories';

interface UseCategoriesState {
  categories: Category[];
  loading: boolean;
  error: string | null;
}

interface UseCategoriesReturn extends UseCategoriesState {
  refetch: () => Promise<void>;
}

/**
 * カテゴリデータを管理するカスタムフック
 * @returns カテゴリ一覧とローディング状態、エラー状態、再取得関数
 */
export function useCategories(): UseCategoriesReturn {
  const [state, setState] = useState<UseCategoriesState>({
    categories: [],
    loading: true,
    error: null,
  });

  const loadCategories = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const categories = await fetchCategories();
      setState(prev => ({ ...prev, categories, loading: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'カテゴリの取得に失敗しました';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
    }
  };

  const refetch = async () => {
    await loadCategories();
  };

  useEffect(() => {
    loadCategories();
  }, []);

  return {
    ...state,
    refetch,
  };
}