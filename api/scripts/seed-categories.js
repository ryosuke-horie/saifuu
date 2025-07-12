// カテゴリのシードデータを投入するスクリプト
import { db } from '../src/db/index.js';
import { categories } from '../src/db/schema.js';

const seedCategories = async () => {
  try {
    // 既存のカテゴリを削除
    await db.delete(categories);
    
    // グローバルカテゴリ設定に基づいたカテゴリを挿入
    const categoryData = [
      // 支出カテゴリ
      { name: '食費', type: 'expense', color: '#FF6B6B' },
      { name: '住居費', type: 'expense', color: '#4ECDC4' },
      { name: '交通費', type: 'expense', color: '#3498DB' },
      { name: 'エンターテイメント', type: 'expense', color: '#E67E22' },
      { name: '健康・フィットネス', type: 'expense', color: '#96CEB4' },
      { name: '学習・教育', type: 'expense', color: '#45B7D1' },
      { name: '仕事・ビジネス', type: 'expense', color: '#8E44AD' },
      { name: '買い物', type: 'expense', color: '#F39C12' },
      { name: 'その他', type: 'expense', color: '#FFEAA7' },
      // 収入カテゴリ
      { name: '給与', type: 'income', color: '#2ECC71' },
      { name: '副業・フリーランス', type: 'income', color: '#27AE60' },
      { name: '投資・資産運用', type: 'income', color: '#16A085' },
      { name: '贈与・お祝い', type: 'income', color: '#1ABC9C' },
      { name: 'その他', type: 'income', color: '#58D68D' },
    ];

    const result = await db.insert(categories).values(categoryData).returning();
    
    console.log('カテゴリのシードデータを投入しました:');
    result.forEach(cat => {
      console.log(`- ${cat.type}: ${cat.name} (ID: ${cat.id})`);
    });
  } catch (error) {
    console.error('エラー:', error);
  }
};

seedCategories();