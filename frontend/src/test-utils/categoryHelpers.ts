/**
 * テスト用カテゴリヘルパー
 *
 * テストで使用するカテゴリデータ生成ユーティリティ
 */

import type { CategoryConfig } from "@shared/config";
import type { Category } from "../lib/api/types";

/**
 * CategoryConfigからCategoryオブジェクトを生成
 * テストで一貫したモックデータを作成するため
 */
export function createMockCategory(config: CategoryConfig): Category {
	const now = new Date().toISOString();
	return {
		id: config.numericId.toString(), // 実際のAPIと同じく、numericIdを文字列化して使用
		name: config.name,
		type: config.type,
		color: config.color,
		numericId: config.numericId, // numericIdも保持
		createdAt: now,
		updatedAt: now,
	};
}

/**
 * CategoryConfig配列からCategory配列を生成
 */
export function createMockCategories(configs: CategoryConfig[]): Category[] {
	return configs.map(createMockCategory);
}
