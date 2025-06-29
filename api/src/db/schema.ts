import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// カテゴリテーブル
// 支出・収入のカテゴリを管理する
export const categories = sqliteTable('categories', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	type: text('type', { enum: ['income', 'expense'] }).notNull(),
	color: text('color'), // UIでの色表示用
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
})

// 取引テーブル
// 支出・収入の記録を管理する
export const transactions = sqliteTable('transactions', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	amount: real('amount').notNull(), // 金額
	type: text('type', { enum: ['income', 'expense'] }).notNull(),
	categoryId: integer('category_id').references(() => categories.id),
	description: text('description'), // 説明・メモ
	date: integer('date', { mode: 'timestamp' }).notNull(), // 取引日
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
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
	nextBillingDate: integer('next_billing_date', { mode: 'timestamp' }).notNull(),
	categoryId: integer('category_id').references(() => categories.id),
	description: text('description'),
	isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
})

// 型推論のためのエクスポート
export type Category = typeof categories.$inferSelect
export type NewCategory = typeof categories.$inferInsert
export type Transaction = typeof transactions.$inferSelect
export type NewTransaction = typeof transactions.$inferInsert
export type Subscription = typeof subscriptions.$inferSelect
export type NewSubscription = typeof subscriptions.$inferInsert
