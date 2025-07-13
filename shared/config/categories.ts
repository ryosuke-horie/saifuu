/**
 * カテゴリマスターデータ
 * 
 * フロントエンドとバックエンドで共通利用されるカテゴリ設定
 * 
 * 設計方針:
 * - 固定カテゴリによる一貫性確保
 * - 収入・支出両方のカテゴリを包括
 * - 視覚的な識別のための色設定
 * - 既存のデータベースカテゴリとの互換性維持
 */

export type CategoryType = 'income' | 'expense'

export interface CategoryConfig {
  id: string
  name: string
  type: CategoryType
  color: string
  description?: string
}

/**
 * 支出カテゴリ設定
 */
export const EXPENSE_CATEGORIES: CategoryConfig[] = [
  // 生活必需品関連
  {
    id: 'utilities',
    name: '家賃・水道・光熱・通信費',
    type: 'expense',
    color: '#D35400',
    description: '家賃、電気、ガス、水道、インターネット、携帯電話'
  },
  {
    id: 'housing',
    name: '住居費',
    type: 'expense',
    color: '#4ECDC4',
    description: '家賃、光熱費、住居関連費用'
  },
  {
    id: 'food',
    name: '食費',
    type: 'expense',
    color: '#FF6B6B',
    description: '食材、外食、飲食代'
  },
  {
    id: 'transportation',
    name: '交通費',
    type: 'expense',
    color: '#3498DB',
    description: '電車、バス、タクシー、ガソリン代'
  },
  
  // 仕事・学習関連
  {
    id: 'business',
    name: '仕事・ビジネス',
    type: 'expense',
    color: '#8E44AD',
    description: '開発費、ツール、サービス、ビジネス関連'
  },
  {
    id: 'system_fee',
    name: 'システム関係日',
    type: 'expense',
    color: '#9B59B6',
    description: 'システム利用料、サブスクリプション費用'
  },
  {
    id: 'education',
    name: '学習・教育',
    type: 'expense',
    color: '#45B7D1',
    description: '書籍、講座、研修、学習教材'
  },
  {
    id: 'books',
    name: '書籍代',
    type: 'expense',
    color: '#1E8BC3',
    description: '書籍、電子書籍、雑誌'
  },
  
  // 趣味・娯楽関連
  {
    id: 'entertainment',
    name: 'エンターテイメント',
    type: 'expense',
    color: '#E67E22',
    description: '映画、ゲーム、音楽、書籍'
  },
  {
    id: 'health',
    name: '健康・フィットネス',
    type: 'expense',
    color: '#96CEB4',
    description: '医療費、薬代、ジム、スポーツ'
  },
  {
    id: 'shopping',
    name: '買い物',
    type: 'expense',
    color: '#F39C12',
    description: '衣類、日用品、雑貨'
  },
  
  // その他
  {
    id: 'other_expense',
    name: 'その他',
    type: 'expense',
    color: '#FFEAA7',
    description: 'その他の支出'
  }
]

/**
 * 収入カテゴリ設定
 */
export const INCOME_CATEGORIES: CategoryConfig[] = [
  {
    id: 'salary',
    name: '給与',
    type: 'income',
    color: '#2ECC71',
    description: '月給、賞与、給与所得'
  },
  {
    id: 'freelance',
    name: '副業・フリーランス',
    type: 'income',
    color: '#27AE60',
    description: '副業収入、フリーランス収入'
  },
  {
    id: 'investment',
    name: '投資・資産運用',
    type: 'income',
    color: '#16A085',
    description: '株式、投資信託、配当金'
  },
  {
    id: 'gift',
    name: '贈与・お祝い',
    type: 'income',
    color: '#1ABC9C',
    description: 'お祝い金、贈り物、臨時収入'
  },
  {
    id: 'other_income',
    name: 'その他',
    type: 'income',
    color: '#58D68D',
    description: 'その他の収入'
  }
]

/**
 * 全カテゴリ設定
 */
export const ALL_CATEGORIES: CategoryConfig[] = [
  ...EXPENSE_CATEGORIES,
  ...INCOME_CATEGORIES
]

/**
 * カテゴリタイプ別の設定取得
 */
export function getCategoriesByType(type: CategoryType): CategoryConfig[] {
  return type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES
}

/**
 * IDによるカテゴリ検索
 */
export function getCategoryById(id: string): CategoryConfig | undefined {
  return ALL_CATEGORIES.find(category => category.id === id)
}

/**
 * カテゴリ名による検索
 */
export function getCategoryByName(name: string): CategoryConfig | undefined {
  return ALL_CATEGORIES.find(category => category.name === name)
}

/**
 * カテゴリ選択用オプション生成
 */
export function getCategoryOptions(type?: CategoryType): Array<{
  value: string
  label: string
  color: string
}> {
  const categories = type ? getCategoriesByType(type) : ALL_CATEGORIES
  
  return categories.map(category => ({
    value: category.id,
    label: category.name,
    color: category.color
  }))
}

/**
 * デフォルトカテゴリの取得
 */
export function getDefaultCategory(type: CategoryType): CategoryConfig {
  return type === 'expense' ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0]
}

/**
 * カテゴリ設定の妥当性検証
 */
export function validateCategoryConfig(): boolean {
  const allIds = ALL_CATEGORIES.map(c => c.id)
  const uniqueIds = [...new Set(allIds)]
  
  // ID重複チェック
  if (allIds.length !== uniqueIds.length) {
    const duplicates = allIds.filter((id, index) => allIds.indexOf(id) !== index)
    console.error('Duplicate category IDs found:', duplicates)
    return false
  }
  
  // 必須フィールドチェック
  const invalidCategories = ALL_CATEGORIES.filter(category => 
    !category.id || 
    !category.name || 
    !category.type || 
    !category.color
  )
  
  if (invalidCategories.length > 0) {
    console.error('Invalid category configuration found:', invalidCategories)
    return false
  }
  
  // 色の形式チェック
  const invalidColors = ALL_CATEGORIES.filter(category => 
    !category.color.match(/^#[0-9A-F]{6}$/i)
  )
  
  if (invalidColors.length > 0) {
    console.error('Invalid color format found:', invalidColors)
    return false
  }
  
  // タイプの妥当性チェック
  const invalidTypes = ALL_CATEGORIES.filter(category =>
    category.type !== 'expense' && category.type !== 'income'
  )
  
  if (invalidTypes.length > 0) {
    console.error('Invalid category types found:', invalidTypes)
    return false
  }
  
  return true
}