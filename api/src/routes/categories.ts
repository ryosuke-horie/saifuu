// 共有型定義からCategory型をインポート（型安全性向上のため）

import { Hono } from 'hono'
import { ALL_CATEGORIES } from '../../../shared/src/config/categories'
import type { Env } from '../db'
import { type LoggingVariables, logWithContext } from '../middleware/logging'

const app = new Hono<{
	Bindings: Env
	Variables: LoggingVariables
}>()

// カテゴリ一覧取得（設定ファイルから）
app.get('/', async (c) => {
	// 構造化ログ: カテゴリ一覧取得操作の開始
	logWithContext(c, 'info', 'カテゴリ一覧取得を開始', {
		operationType: 'read',
		resource: 'categories',
		source: 'config',
	})

	try {
		// 設定ファイルからカテゴリを取得し、API形式に変換
		const result = ALL_CATEGORIES.map((category) => ({
			id: category.numericId, // 数値IDを返す（後方互換性のため）
			name: category.name,
			type: category.type,
			color: category.color,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		}))

		// 構造化ログ: 取得成功時のログ
		logWithContext(c, 'info', 'カテゴリ一覧取得が完了', {
			categoriesCount: result.length,
			resource: 'categories',
			source: 'config',
		})

		return c.json(result)
	} catch (error) {
		// 構造化ログ: エラー時の詳細ログ
		logWithContext(c, 'error', 'カテゴリ一覧取得でエラーが発生', {
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
			resource: 'categories',
			operationType: 'read',
		})

		return c.json({ error: 'Failed to fetch categories' }, 500)
	}
})

// カテゴリ作成（設定ファイル固定のため無効）
app.post('/', async (c) => {
	// 構造化ログ: カテゴリ作成の拒否
	logWithContext(c, 'warn', 'カテゴリ作成が試行されましたが、設定ファイル固定のため拒否しました', {
		operationType: 'write',
		resource: 'categories',
		reason: 'categories_fixed_in_config',
	})

	return c.json({ error: 'Categories are fixed and cannot be created' }, 405)
})

// カテゴリ更新（設定ファイル固定のため無効）
app.put('/:id', async (c) => {
	// 構造化ログ: カテゴリ更新の拒否
	logWithContext(c, 'warn', 'カテゴリ更新が試行されましたが、設定ファイル固定のため拒否しました', {
		categoryId: c.req.param('id'),
		operationType: 'write',
		resource: 'categories',
		reason: 'categories_fixed_in_config',
	})

	return c.json({ error: 'Categories are fixed and cannot be updated' }, 405)
})

// カテゴリ削除（設定ファイル固定のため無効）
app.delete('/:id', async (c) => {
	// 構造化ログ: カテゴリ削除の拒否
	logWithContext(c, 'warn', 'カテゴリ削除が試行されましたが、設定ファイル固定のため拒否しました', {
		categoryId: c.req.param('id'),
		operationType: 'delete',
		resource: 'categories',
		reason: 'categories_fixed_in_config',
	})

	return c.json({ error: 'Categories are fixed and cannot be deleted' }, 405)
})

export default app
