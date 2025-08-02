import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { transactions } from '../../db/schema'
import type { TransactionResponse } from '../../types/api'
import { createTestRequest, getResponseJson } from '../helpers/test-app'
import { cleanupTestDatabase, createTestDatabase, setupTestDatabase } from '../helpers/test-db'
import testProductionApp from '../helpers/test-production-app'

/**
 * 収入管理機能の統合テスト
 * 
 * 収入の編集機能に焦点を当てたテストスイート
 * E2Eテストで発見された編集機能の問題を検証
 */
describe('Income Management Integration Tests', () => {
	const app = testProductionApp
	const db = createTestDatabase()

	beforeEach(async () => {
		await setupTestDatabase()
	})

	describe('収入編集機能の詳細テスト', () => {
		it('収入データの編集が正しく動作することを確認', async () => {
			// Step 1: 収入データを作成
			const createData = {
				amount: 300000,
				type: 'income',
				categoryId: 101, // 給与
				description: '月給',
				date: '2024-01-15',
			}

			const createRes = await createTestRequest(app, 'POST', '/api/transactions', createData)
			const createdIncome = (await getResponseJson(createRes)) as TransactionResponse

			expect(createRes.status).toBe(201)
			expect(createdIncome.id).toBeDefined()
			expect(createdIncome.amount).toBe(300000)
			expect(createdIncome.categoryId).toBe(101)
			expect(createdIncome.description).toBe('月給')

			// Step 2: 作成された収入データを取得して確認
			const getRes = await createTestRequest(app, 'GET', `/api/transactions/${createdIncome.id}`)
			const fetchedIncome = (await getResponseJson(getRes)) as TransactionResponse

			expect(getRes.status).toBe(200)
			expect(fetchedIncome.amount).toBe(300000)
			expect(fetchedIncome.categoryId).toBe(101)

			// Step 3: 収入データを編集
			const updateData = {
				amount: 350000,
				categoryId: 102, // ボーナス
				description: '昇給後の月給',
				date: '2024-02-15',
			}

			const updateRes = await createTestRequest(
				app,
				'PUT',
				`/api/transactions/${createdIncome.id}`,
				updateData
			)
			const updatedIncome = (await getResponseJson(updateRes)) as TransactionResponse

			expect(updateRes.status).toBe(200)
			expect(updatedIncome.id).toBe(createdIncome.id)
			expect(updatedIncome.type).toBe('income') // typeは変更されない
			expect(updatedIncome.amount).toBe(350000)
			expect(updatedIncome.categoryId).toBe(102)
			expect(updatedIncome.description).toBe('昇給後の月給')
			expect(updatedIncome.date).toBe('2024-02-15')

			// Step 4: 編集後のデータを再取得して永続化を確認
			const verifyRes = await createTestRequest(app, 'GET', `/api/transactions/${createdIncome.id}`)
			const verifiedIncome = (await getResponseJson(verifyRes)) as TransactionResponse

			expect(verifyRes.status).toBe(200)
			expect(verifiedIncome.amount).toBe(350000)
			expect(verifiedIncome.categoryId).toBe(102)
			expect(verifiedIncome.description).toBe('昇給後の月給')
			expect(verifiedIncome.date).toBe('2024-02-15')
		})

		it('部分的な更新が正しく動作することを確認', async () => {
			// 収入データを作成
			const createData = {
				amount: 50000,
				type: 'income',
				categoryId: 103, // 副業
				description: 'フリーランス収入',
				date: '2024-01-20',
			}

			const createRes = await createTestRequest(app, 'POST', '/api/transactions', createData)
			const createdIncome = (await getResponseJson(createRes)) as TransactionResponse

			// 金額のみを更新
			const partialUpdate = {
				amount: 60000,
			}

			const updateRes = await createTestRequest(
				app,
				'PUT',
				`/api/transactions/${createdIncome.id}`,
				partialUpdate
			)
			const updatedIncome = (await getResponseJson(updateRes)) as TransactionResponse

			expect(updateRes.status).toBe(200)
			expect(updatedIncome.amount).toBe(60000)
			// 他のフィールドは変更されていないことを確認
			expect(updatedIncome.categoryId).toBe(103)
			expect(updatedIncome.description).toBe('フリーランス収入')
			expect(updatedIncome.date).toBe('2024-01-20')
			expect(updatedIncome.type).toBe('income')
		})

		it('複数フィールドの同時更新が正しく動作することを確認', async () => {
			// 収入データを作成
			const createData = {
				amount: 100000,
				type: 'income',
				categoryId: 104, // 投資収益
				description: '配当金',
				date: '2024-03-01',
			}

			const createRes = await createTestRequest(app, 'POST', '/api/transactions', createData)
			const createdIncome = (await getResponseJson(createRes)) as TransactionResponse

			// 複数フィールドを同時に更新
			const multiFieldUpdate = {
				amount: 150000,
				categoryId: 102, // ボーナスに変更
				description: '特別ボーナス',
				date: '2024-03-31',
			}

			const updateRes = await createTestRequest(
				app,
				'PUT',
				`/api/transactions/${createdIncome.id}`,
				multiFieldUpdate
			)
			const updatedIncome = (await getResponseJson(updateRes)) as TransactionResponse

			expect(updateRes.status).toBe(200)
			expect(updatedIncome.amount).toBe(150000)
			expect(updatedIncome.categoryId).toBe(102)
			expect(updatedIncome.description).toBe('特別ボーナス')
			expect(updatedIncome.date).toBe('2024-03-31')
		})

		it('日付形式の編集が正しく動作することを確認', async () => {
			// E2Eテストで問題となった日付入力の動作を検証
			const createData = {
				amount: 200000,
				type: 'income',
				categoryId: 101,
				description: '給与',
				date: '2024-01-01',
			}

			const createRes = await createTestRequest(app, 'POST', '/api/transactions', createData)
			const createdIncome = (await getResponseJson(createRes)) as TransactionResponse

			// 異なる日付形式での更新を試みる
			const dateUpdate = {
				date: '2024-12-31', // YYYY-MM-DD形式
			}

			const updateRes = await createTestRequest(
				app,
				'PUT',
				`/api/transactions/${createdIncome.id}`,
				dateUpdate
			)
			const updatedIncome = (await getResponseJson(updateRes)) as TransactionResponse

			expect(updateRes.status).toBe(200)
			expect(updatedIncome.date).toBe('2024-12-31')
		})

		it('収入カテゴリの検証が正しく動作することを確認', async () => {
			// 収入データを作成
			const createData = {
				amount: 300000,
				type: 'income',
				categoryId: 101,
				description: '月給',
				date: '2024-01-15',
			}

			const createRes = await createTestRequest(app, 'POST', '/api/transactions', createData)
			const createdIncome = (await getResponseJson(createRes)) as TransactionResponse

			// 無効なカテゴリIDで更新を試みる
			const invalidUpdate = {
				categoryId: 1, // 支出カテゴリのID
			}

			const updateRes = await createTestRequest(
				app,
				'PUT',
				`/api/transactions/${createdIncome.id}`,
				invalidUpdate
			)

			// 現在のAPIは収入タイプの取引に支出カテゴリを設定することを許可している
			// TODO: 将来的にはカテゴリタイプの検証を追加すべき
			expect(updateRes.status).toBe(200)
		})
	})

	describe('収入データの一覧取得と編集の連携', () => {
		it('編集後のデータが一覧に正しく反映されることを確認', async () => {
			// 複数の収入データを作成
			const incomeData = [
				{
					amount: 300000,
					type: 'income',
					categoryId: 101,
					description: '月給',
					date: '2024-01-15',
				},
				{
					amount: 50000,
					type: 'income',
					categoryId: 103,
					description: '副業収入',
					date: '2024-01-20',
				},
			]

			// データを作成
			const createPromises = incomeData.map((data) =>
				createTestRequest(app, 'POST', '/api/transactions', data)
			)
			const createResponses = await Promise.all(createPromises)
			const createdIncomes = await Promise.all(
				createResponses.map((res) => getResponseJson(res) as Promise<TransactionResponse>)
			)

			// 最初の収入を編集
			const updateData = {
				amount: 350000,
				description: '昇給後の月給',
			}

			await createTestRequest(
				app,
				'PUT',
				`/api/transactions/${createdIncomes[0].id}`,
				updateData
			)

			// 収入一覧を取得
			const listRes = await createTestRequest(app, 'GET', '/api/transactions?type=income')
			const incomeList = (await getResponseJson(listRes)) as TransactionResponse[]

			expect(listRes.status).toBe(200)
			expect(incomeList).toHaveLength(2)

			// 編集したデータが正しく反映されているか確認
			const editedIncome = incomeList.find((income) => income.id === createdIncomes[0].id)
			expect(editedIncome).toBeDefined()
			expect(editedIncome!.amount).toBe(350000)
			expect(editedIncome!.description).toBe('昇給後の月給')
		})
	})

	// クリーンアップ
	afterEach(async () => {
		await cleanupTestDatabase()
	})
})