import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// 取引テーブル
// 支出・収入の記録を管理する
export const transactions = sqliteTable('transactions', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	amount: real('amount').notNull(), // 金額
	type: text('type', { enum: ['expense', 'income'] }).notNull(),
	categoryId: integer('category_id'), // 設定ファイルのnumericIdを参照
	description: text('description'), // 説明・メモ
	date: text('date').notNull(), // 取引日
	createdAt: text('created_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
	updatedAt: text('updated_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
})

// サブスクリプションテーブル
// 定期的な支出を管理する
export const subscriptions = sqliteTable('subscriptions', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(), // サービス名
	amount: real('amount').notNull(), // 月額料金
	billingCycle: text('billing_cycle', { enum: ['monthly', 'yearly', 'weekly'] })
		.notNull()
		.default('monthly'),
	nextBillingDate: text('next_billing_date').notNull(),
	categoryId: integer('category_id'), // 設定ファイルのnumericIdを参照
	description: text('description'),
	isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
	createdAt: text('created_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
	updatedAt: text('updated_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
})

// 型推論のためのエクスポート
export type Transaction = typeof transactions.$inferSelect
export type NewTransaction = typeof transactions.$inferInsert
export type Subscription = typeof subscriptions.$inferSelect
export type NewSubscription = typeof subscriptions.$inferInsert
