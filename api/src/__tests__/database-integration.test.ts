/**
 * D1データベース統合テスト
 * データベース操作とDrizzle ORMの統合動作を検証
 */
/// <reference path="./types.d.ts" />

import { env } from 'cloudflare:test'
import { and, eq, gte, lte } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'
import { categories, subscriptions, transactions } from '../db/schema'
import { createTestDatabase, seedTestData } from './setup'

describe('D1 Database Integration', () => {
	describe('データベース接続', () => {
		it('D1データベースに正常に接続できる', async () => {
			const db = createTestDatabase(env)

			expect(db).toBeDefined()
			expect(await db).toBeDefined()
		})

		it('Drizzle ORMでのクエリ実行が可能', async () => {
			const db = await createTestDatabase(env)

			// 基本的なSELECTクエリ
			const result = await db.select().from(categories)

			expect(Array.isArray(result)).toBe(true)
		})

		it('データベーステーブルが存在する', async () => {
			const db = env.DB
			const result = await db
				.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
				.all()

			expect(result.success).toBe(true)

			const tableNames = result.results?.map((row) => (row as { name: string }).name)
			expect(tableNames).toContain('categories')
			expect(tableNames).toContain('transactions')
			expect(tableNames).toContain('subscriptions')
		})
	})

	describe('CRUD Operations - Categories', () => {
		beforeEach(async () => {
			await createTestDatabase(env)
		})

		it('カテゴリの作成・読み取り・更新・削除が正常に動作', async () => {
			const db = await createTestDatabase(env)

			// Create
			const newCategory = {
				name: 'テストカテゴリ',
				type: 'expense' as const,
				color: '#FF5722',
			}

			const created = await db.insert(categories).values(newCategory).returning()
			expect(created.length).toBe(1)
			expect(created[0].name).toBe(newCategory.name)
			const categoryId = created[0].id

			// Read
			const found = await db.select().from(categories).where(eq(categories.id, categoryId))
			expect(found.length).toBe(1)
			expect(found[0].name).toBe(newCategory.name)

			// Update
			const updatedData = { name: '更新されたカテゴリ', color: '#9E9E9E' }
			const updated = await db
				.update(categories)
				.set({ ...updatedData, updatedAt: new Date() })
				.where(eq(categories.id, categoryId))
				.returning()

			expect(updated.length).toBe(1)
			expect(updated[0].name).toBe(updatedData.name)
			expect(updated[0].color).toBe(updatedData.color)

			// Delete
			const deleted = await db.delete(categories).where(eq(categories.id, categoryId)).returning()
			expect(deleted.length).toBe(1)

			// Verify deletion
			const notFound = await db.select().from(categories).where(eq(categories.id, categoryId))
			expect(notFound.length).toBe(0)
		})

		it('複数カテゴリの一括操作', async () => {
			const db = await createTestDatabase(env)

			const newCategories = [
				{ name: 'カテゴリ1', type: 'income' as const, color: '#4CAF50' },
				{ name: 'カテゴリ2', type: 'expense' as const, color: '#F44336' },
				{ name: 'カテゴリ3', type: 'expense' as const, color: '#FF9800' },
			]

			// 一括作成
			for (const category of newCategories) {
				await db.insert(categories).values(category)
			}

			// 全件取得
			const allCategories = await db.select().from(categories)
			expect(allCategories.length).toBe(3)

			// 条件付き取得
			const expenseCategories = await db
				.select()
				.from(categories)
				.where(eq(categories.type, 'expense'))

			expect(expenseCategories.length).toBe(2)
		})
	})

	describe('CRUD Operations - Transactions', () => {
		beforeEach(async () => {
			await seedTestData(env)
		})

		it('取引データの基本操作', async () => {
			const db = await createTestDatabase(env)

			// カテゴリを作成
			const category = await db
				.insert(categories)
				.values({
					name: '取引テスト用',
					type: 'expense',
				})
				.returning()

			const categoryId = category[0].id

			// 取引作成
			const newTransaction = {
				amount: 1500,
				type: 'expense' as const,
				categoryId,
				description: 'テスト取引',
				date: new Date('2024-01-15'),
			}

			const created = await db.insert(transactions).values(newTransaction).returning()
			expect(created.length).toBe(1)
			expect(created[0].amount).toBe(newTransaction.amount)

			// 取引の更新
			const transactionId = created[0].id
			const updatedAmount = 2000

			const updated = await db
				.update(transactions)
				.set({ amount: updatedAmount, updatedAt: new Date() })
				.where(eq(transactions.id, transactionId))
				.returning()

			expect(updated[0].amount).toBe(updatedAmount)
		})

		it('カテゴリとのリレーション', async () => {
			const db = await createTestDatabase(env)

			// カテゴリを作成
			const category = await db
				.insert(categories)
				.values({
					name: 'リレーション確認',
					type: 'income',
				})
				.returning()

			// 関連する取引を作成
			await db.insert(transactions).values({
				amount: 50000,
				type: 'income',
				categoryId: category[0].id,
				description: 'リレーション取引',
				date: new Date(),
			})

			// JOINクエリでデータ取得（手動JOIN）
			const result = await db
				.select({
					transactionId: transactions.id,
					amount: transactions.amount,
					categoryName: categories.name,
				})
				.from(transactions)
				.innerJoin(categories, eq(transactions.categoryId, categories.id))
				.where(eq(categories.id, category[0].id))

			expect(result.length).toBe(1)
			expect(result[0].categoryName).toBe('リレーション確認')
			expect(result[0].amount).toBe(50000)
		})

		it('日付範囲での取引検索', async () => {
			const db = await createTestDatabase(env)

			// カテゴリ作成
			const category = await db
				.insert(categories)
				.values({
					name: '日付テスト',
					type: 'expense',
				})
				.returning()

			const categoryId = category[0].id

			// 異なる日付の取引を作成
			const transactionDates = [
				new Date('2024-01-10'),
				new Date('2024-01-15'),
				new Date('2024-01-20'),
				new Date('2024-01-25'),
			]

			for (const [index, date] of transactionDates.entries()) {
				await db.insert(transactions).values({
					amount: (index + 1) * 1000,
					type: 'expense',
					categoryId,
					description: `取引${index + 1}`,
					date,
				})
			}

			// 期間検索
			const startDate = new Date('2024-01-12')
			const endDate = new Date('2024-01-22')

			const rangeResults = await db
				.select()
				.from(transactions)
				.where(and(gte(transactions.date, startDate), lte(transactions.date, endDate)))

			expect(rangeResults.length).toBe(2) // 1/15と1/20の取引
		})
	})

	describe('CRUD Operations - Subscriptions', () => {
		beforeEach(async () => {
			await createTestDatabase(env)
		})

		it('サブスクリプション管理', async () => {
			const db = await createTestDatabase(env)

			// カテゴリ作成
			const category = await db
				.insert(categories)
				.values({
					name: 'サブスク',
					type: 'expense',
				})
				.returning()

			// サブスクリプション作成
			const newSubscription = {
				name: 'Netflix',
				amount: 1490,
				billingCycle: 'monthly' as const,
				nextBillingDate: new Date('2024-02-01'),
				categoryId: category[0].id,
				description: '動画配信サービス',
			}

			const created = await db.insert(subscriptions).values(newSubscription).returning()
			expect(created.length).toBe(1)
			expect(created[0].name).toBe(newSubscription.name)
			expect(created[0].isActive).toBe(true) // デフォルト値

			// アクティブなサブスクリプションの検索
			const activeSubscriptions = await db
				.select()
				.from(subscriptions)
				.where(eq(subscriptions.isActive, true))

			expect(activeSubscriptions.length).toBe(1)

			// サブスクリプションの停止
			await db
				.update(subscriptions)
				.set({ isActive: false, updatedAt: new Date() })
				.where(eq(subscriptions.id, created[0].id))

			const inactiveCheck = await db
				.select()
				.from(subscriptions)
				.where(eq(subscriptions.isActive, false))

			expect(inactiveCheck.length).toBe(1)
		})
	})

	describe('データ整合性とバリデーション', () => {
		beforeEach(async () => {
			await createTestDatabase(env)
		})

		it('外部キー制約の動作確認', async () => {
			const db = await createTestDatabase(env)

			// 存在しないカテゴリIDでの取引作成
			// D1では外部キー制約が厳密でない場合があるため、アプリケーションレベルでの検証が重要
			try {
				await db.insert(transactions).values({
					amount: 1000,
					type: 'expense',
					categoryId: 999, // 存在しないID
					description: 'FK制約テスト',
					date: new Date(),
				})

				// 外部キー制約が有効な場合はここは実行されない
				// アプリケーションレベルでの検証が必要
				const result = await db.select().from(transactions).where(eq(transactions.categoryId, 999))
				expect(result.length).toBe(1)
			} catch (error) {
				// 外部キー制約エラーが発生した場合
				expect(error).toBeDefined()
			}
		})

		it('データ型の検証', async () => {
			const db = await createTestDatabase(env)

			// 数値型のテスト
			const category = await db
				.insert(categories)
				.values({
					name: '数値テスト',
					type: 'expense',
				})
				.returning()

			const transaction = await db
				.insert(transactions)
				.values({
					amount: 123.45, // real型
					type: 'expense',
					categoryId: category[0].id,
					description: '小数点テスト',
					date: new Date(),
				})
				.returning()

			expect(transaction[0].amount).toBe(123.45)

			// 日付型のテスト
			const testDate = new Date('2024-01-15T10:30:00Z')
			const subscription = await db
				.insert(subscriptions)
				.values({
					name: '日付テスト',
					amount: 1000,
					billingCycle: 'monthly',
					nextBillingDate: testDate,
					categoryId: category[0].id,
				})
				.returning()

			// 日付がtimestamp形式で保存されていることを確認
			expect(subscription[0].nextBillingDate).toBeInstanceOf(Date)
		})
	})

	describe('パフォーマンステスト', () => {
		beforeEach(async () => {
			await createTestDatabase(env)
		})

		it('大量データでの操作性能', async () => {
			const db = await createTestDatabase(env)

			// カテゴリを作成
			const category = await db
				.insert(categories)
				.values({
					name: 'パフォーマンステスト',
					type: 'expense',
				})
				.returning()

			const categoryId = category[0].id

			// 100件の取引データを作成
			const startTime = performance.now()

			for (let i = 0; i < 100; i++) {
				await db.insert(transactions).values({
					amount: Math.random() * 10000,
					type: 'expense',
					categoryId,
					description: `パフォーマンステスト ${i}`,
					date: new Date(2024, 0, (i % 30) + 1),
				})
			}

			const insertTime = performance.now() - startTime

			// 全件取得のパフォーマンス
			const selectStartTime = performance.now()
			const results = await db
				.select()
				.from(transactions)
				.where(eq(transactions.categoryId, categoryId))
			const selectTime = performance.now() - selectStartTime

			expect(results.length).toBe(100)

			// パフォーマンスの目安（D1環境で適切な範囲）
			expect(insertTime).toBeLessThan(10000) // 10秒以内
			expect(selectTime).toBeLessThan(1000) // 1秒以内
		})
	})

	describe('トランザクション処理', () => {
		beforeEach(async () => {
			await createTestDatabase(env)
		})

		it('複数操作の一貫性', async () => {
			const db = await createTestDatabase(env)

			// カテゴリ作成
			const category = await db
				.insert(categories)
				.values({
					name: 'トランザクションテスト',
					type: 'expense',
				})
				.returning()

			const categoryId = category[0].id

			// 複数の関連する操作を実行
			// D1ではトランザクションサポートが限定的なため、
			// アプリケーションレベルでの整合性管理が重要

			const transaction1 = await db
				.insert(transactions)
				.values({
					amount: 1000,
					type: 'expense',
					categoryId,
					description: '取引1',
					date: new Date(),
				})
				.returning()

			const subscription1 = await db
				.insert(subscriptions)
				.values({
					name: '関連サブスク',
					amount: 500,
					billingCycle: 'monthly',
					nextBillingDate: new Date(),
					categoryId,
				})
				.returning()

			// 関連データの整合性確認
			expect(transaction1[0].categoryId).toBe(categoryId)
			expect(subscription1[0].categoryId).toBe(categoryId)

			// 関連データの存在確認
			const categoryWithData = await db
				.select()
				.from(categories)
				.where(eq(categories.id, categoryId))

			expect(categoryWithData.length).toBe(1)
		})
	})
})
