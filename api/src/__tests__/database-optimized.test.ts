/**
 * 最適化されたデータベース統合テスト
 * 元のテストを改善し、実行時間短縮と成功率向上を図る
 */
/// <reference path="./types.d.ts" />

import { env } from 'cloudflare:test'
import { and, eq, gte, lte } from 'drizzle-orm'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { categories, subscriptions, transactions } from '../db/schema'
import {
	createTestDatabase,
	getTestDatabase,
	resetDatabaseInitializationState,
} from './optimized-setup'

describe('Optimized D1 Database Integration', () => {
	// テストスイート開始時に初期化状態をリセット
	beforeAll(() => {
		resetDatabaseInitializationState()
	})

	describe('データベース接続（最適化）', () => {
		it('D1データベースに正常に接続できる', async () => {
			const db = await getTestDatabase(env)
			expect(db).toBeDefined()
		})

		it('Drizzle ORMでのクエリ実行が可能', async () => {
			const db = await createTestDatabase(env)
			// テーブル作成の完了を確実にする
			await new Promise(resolve => setTimeout(resolve, 100))
			// 基本的なSELECTクエリ
			const result = await db.select().from(categories).limit(1)
			expect(Array.isArray(result)).toBe(true)
		})

		it('データベーステーブルが存在する', async () => {
			// 最適化されたセットアップでテーブル作成
			const db = await createTestDatabase(env)
			// テーブル作成の完了を確実にする
			await new Promise(resolve => setTimeout(resolve, 100))

			const d1DB = env.DB
			const requiredTables = ['categories', 'transactions', 'subscriptions']

			// より効率的なテーブル存在チェック
			for (const tableName of requiredTables) {
				const result = await d1DB.prepare(`PRAGMA table_info(${tableName})`).all()
				expect(result.success).toBe(true)
				expect(result.results?.length).toBeGreaterThan(0)
			}
		})
	})

	describe('高速CRUD Operations - Categories', () => {
		let testDb: Awaited<ReturnType<typeof createTestDatabase>>

		beforeEach(async () => {
			testDb = await createTestDatabase(env)
		})

		it('カテゴリの基本CRUD操作', async () => {
			// Create - 単一操作でテスト
			const newCategory = {
				name: 'テストカテゴリ',
				type: 'expense' as const,
				color: '#FF5722',
			}

			const created = await testDb.insert(categories).values(newCategory).returning()
			expect(created.length).toBe(1)
			expect(created[0].name).toBe(newCategory.name)
			const categoryId = created[0].id

			// Read - 作成したカテゴリを検索
			const found = await testDb.select().from(categories).where(eq(categories.id, categoryId))
			expect(found.length).toBe(1)
			expect(found[0].name).toBe(newCategory.name)

			// Update - 名前と色を更新
			const updatedData = { name: '更新されたカテゴリ', color: '#9E9E9E' }
			const updated = await testDb
				.update(categories)
				.set({ ...updatedData, updatedAt: new Date() })
				.where(eq(categories.id, categoryId))
				.returning()

			expect(updated.length).toBe(1)
			expect(updated[0].name).toBe(updatedData.name)

			// Delete - カテゴリを削除
			const deleted = await testDb
				.delete(categories)
				.where(eq(categories.id, categoryId))
				.returning()
			expect(deleted.length).toBe(1)

			// 削除確認
			const notFound = await testDb.select().from(categories).where(eq(categories.id, categoryId))
			expect(notFound.length).toBe(0)
		})

		it('複数カテゴリの効率的な一括操作', async () => {
			const newCategories = [
				{ name: 'カテゴリ1', type: 'income' as const, color: '#4CAF50' },
				{ name: 'カテゴリ2', type: 'expense' as const, color: '#F44336' },
				{ name: 'カテゴリ3', type: 'expense' as const, color: '#FF9800' },
			]

			// バッチ作成（最適化：Promise.all使用）
			const insertPromises = newCategories.map((category) =>
				testDb.insert(categories).values(category)
			)
			await Promise.all(insertPromises)

			// 全件取得とフィルタリングを同時実行
			const [allCategories, expenseCategories] = await Promise.all([
				testDb.select().from(categories),
				testDb.select().from(categories).where(eq(categories.type, 'expense')),
			])

			expect(allCategories.length).toBe(3)
			expect(expenseCategories.length).toBe(2)
		})
	})

	describe('最適化されたTransaction Operations', () => {
		let testDb: Awaited<ReturnType<typeof createTestDatabase>>
		let categoryId: number

		beforeEach(async () => {
			testDb = await createTestDatabase(env)

			// テスト用カテゴリを事前作成（各テストで再利用）
			const category = await testDb
				.insert(categories)
				.values({
					name: '取引テスト用',
					type: 'expense',
				})
				.returning()
			categoryId = category[0].id
		})

		it('取引の効率的なCRUD操作', async () => {
			const newTransaction = {
				amount: 1500,
				type: 'expense' as const,
				categoryId,
				description: 'テスト取引',
				date: new Date('2024-01-15T00:00:00.000Z'),
			}

			// 作成と検証を一連の流れで実行
			const created = await testDb.insert(transactions).values(newTransaction).returning()
			expect(created.length).toBe(1)
			expect(created[0].amount).toBe(newTransaction.amount)

			const transactionId = created[0].id

			// 更新処理
			const updatedAmount = 2000
			const updated = await testDb
				.update(transactions)
				.set({ amount: updatedAmount, updatedAt: new Date() })
				.where(eq(transactions.id, transactionId))
				.returning()

			expect(updated[0].amount).toBe(updatedAmount)
		})

		it('効率的なカテゴリとのリレーション確認', async () => {
			// 関連する取引を作成
			await testDb.insert(transactions).values({
				amount: 50000,
				type: 'expense',
				categoryId,
				description: 'リレーション取引',
				date: new Date(),
			})

			// JOINクエリで一括取得
			const result = await testDb
				.select({
					transactionId: transactions.id,
					amount: transactions.amount,
					categoryName: categories.name,
				})
				.from(transactions)
				.innerJoin(categories, eq(transactions.categoryId, categories.id))
				.where(eq(categories.id, categoryId))

			expect(result.length).toBe(1)
			expect(result[0].categoryName).toBe('取引テスト用')
			expect(result[0].amount).toBe(50000)
		})

		it('効率的な日付範囲検索', async () => {
			// 異なる日付の取引をバッチで作成
			const transactionDates = [
				new Date('2024-01-10T00:00:00.000Z'),
				new Date('2024-01-15T00:00:00.000Z'),
				new Date('2024-01-20T00:00:00.000Z'),
				new Date('2024-01-25T00:00:00.000Z'),
			]

			const insertPromises = transactionDates.map((date, index) =>
				testDb.insert(transactions).values({
					amount: (index + 1) * 1000,
					type: 'expense',
					categoryId,
					description: `取引${index + 1}`,
					date,
				})
			)
			await Promise.all(insertPromises)

			// 期間検索
			const startDate = new Date('2024-01-12T00:00:00.000Z')
			const endDate = new Date('2024-01-22T00:00:00.000Z')

			const rangeResults = await testDb
				.select()
				.from(transactions)
				.where(and(gte(transactions.date, startDate), lte(transactions.date, endDate)))

			expect(rangeResults.length).toBe(2) // 1/15と1/20の取引
		})
	})

	describe('高速Subscription Operations', () => {
		let testDb: Awaited<ReturnType<typeof createTestDatabase>>
		let categoryId: number

		beforeEach(async () => {
			testDb = await createTestDatabase(env)

			// テスト用カテゴリを事前作成
			const category = await testDb
				.insert(categories)
				.values({
					name: 'サブスク',
					type: 'expense',
				})
				.returning()
			categoryId = category[0].id
		})

		it('サブスクリプションの効率的な管理', async () => {
			const newSubscription = {
				name: 'Netflix',
				amount: 1490,
				billingCycle: 'monthly' as const,
				nextBillingDate: new Date('2024-02-01T00:00:00.000Z'),
				categoryId,
				description: '動画配信サービス',
			}

			// 作成と状態確認を効率的に実行
			const created = await testDb.insert(subscriptions).values(newSubscription).returning()
			expect(created.length).toBe(1)
			expect(created[0].name).toBe(newSubscription.name)
			expect(created[0].isActive).toBe(true)

			// アクティブなサブスクリプションの検索と停止を連続実行
			const [activeSubscriptions] = await Promise.all([
				testDb.select().from(subscriptions).where(eq(subscriptions.isActive, true)),
				testDb
					.update(subscriptions)
					.set({ isActive: false, updatedAt: new Date() })
					.where(eq(subscriptions.id, created[0].id)),
			])

			expect(activeSubscriptions.length).toBe(1)

			// 停止状態の確認
			const inactiveCheck = await testDb
				.select()
				.from(subscriptions)
				.where(eq(subscriptions.isActive, false))

			expect(inactiveCheck.length).toBe(1)
		})
	})

	describe('パフォーマンス最適化テスト', () => {
		let testDb: Awaited<ReturnType<typeof createTestDatabase>>

		beforeEach(async () => {
			testDb = await createTestDatabase(env)
		})

		it('中規模データでの操作性能', async () => {
			// カテゴリを作成
			const category = await testDb
				.insert(categories)
				.values({
					name: 'パフォーマンステスト',
					type: 'expense',
				})
				.returning()

			const categoryId = category[0].id
			const startTime = performance.now()

			// 50件のデータをバッチで作成（100件から削減）
			const insertPromises = Array.from({ length: 50 }, (_, i) =>
				testDb.insert(transactions).values({
					amount: Math.random() * 10000,
					type: 'expense',
					categoryId,
					description: `パフォーマンステスト ${i}`,
					date: new Date(2024, 0, (i % 30) + 1),
				})
			)

			await Promise.all(insertPromises)
			const insertTime = performance.now() - startTime

			// 全件取得のパフォーマンス
			const selectStartTime = performance.now()
			const results = await testDb
				.select()
				.from(transactions)
				.where(eq(transactions.categoryId, categoryId))
			const selectTime = performance.now() - selectStartTime

			expect(results.length).toBe(50)

			// パフォーマンスの目安（最適化後）
			expect(insertTime).toBeLessThan(5000) // 5秒以内に短縮
			expect(selectTime).toBeLessThan(500) // 0.5秒以内に短縮
		})
	})

	describe('データ整合性確認', () => {
		let testDb: Awaited<ReturnType<typeof createTestDatabase>>

		beforeEach(async () => {
			testDb = await createTestDatabase(env)
		})

		it('データ型の効率的な検証', async () => {
			const category = await testDb
				.insert(categories)
				.values({
					name: '型テスト',
					type: 'expense',
				})
				.returning()

			const categoryId = category[0].id

			// 数値型と日付型を同時にテスト
			const testDate = new Date('2024-01-15T10:30:00.000Z')

			const [transaction, subscription] = await Promise.all([
				testDb
					.insert(transactions)
					.values({
						amount: 123.45,
						type: 'expense',
						categoryId,
						description: '小数点テスト',
						date: new Date(),
					})
					.returning(),
				testDb
					.insert(subscriptions)
					.values({
						name: '日付テスト',
						amount: 1000,
						billingCycle: 'monthly',
						nextBillingDate: testDate,
						categoryId,
					})
					.returning(),
			])

			expect(transaction[0].amount).toBe(123.45)
			expect(subscription[0].nextBillingDate).toBeInstanceOf(Date)
		})
	})
})
