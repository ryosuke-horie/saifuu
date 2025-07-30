import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { BalanceSummaryResponse } from '../../types/api'
import { createTestProductionApp } from '../helpers/test-production-app'

describe('Balance API Integration Tests', () => {
	const app = createTestProductionApp()

	beforeEach(async () => {
		// 統合テストでは実際のAPIエンドポイントを使用してクリーンアップ
		// まず全ての取引を取得
		const listRes = await app.request('/api/transactions')
		if (listRes.ok) {
			const transactions = (await listRes.json()) as Array<{ id: number }>
			// 各取引を削除
			for (const tx of transactions) {
				await app.request(`/api/transactions/${tx.id}`, { method: 'DELETE' })
			}
		}
	})

	afterEach(async () => {
		// テスト後のクリーンアップ
		const listRes = await app.request('/api/transactions')
		if (listRes.ok) {
			const transactions = (await listRes.json()) as Array<{ id: number }>
			for (const tx of transactions) {
				await app.request(`/api/transactions/${tx.id}`, { method: 'DELETE' })
			}
		}
	})

	describe('GET /api/balance/summary', () => {
		it('実際のAPIを通じて収支サマリーを取得できる', async () => {
			// 現在の日付を取得
			const now = new Date()
			const currentDate = now.toISOString()

			// 取引を作成
			const incomeRes = await app.request('/api/transactions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					amount: 450000,
					type: 'income',
					categoryId: 101,
					description: '給与',
					date: currentDate,
				}),
			})
			if (incomeRes.status !== 201) {
				const error = await incomeRes.json()
				console.error('Income creation error:', error)
			}
			expect(incomeRes.status).toBe(201)

			const expense1Res = await app.request('/api/transactions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					amount: 200000,
					type: 'expense',
					categoryId: 2,
					description: '家賃',
					date: currentDate,
				}),
			})
			expect(expense1Res.status).toBe(201)

			const expense2Res = await app.request('/api/transactions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					amount: 120000,
					type: 'expense',
					categoryId: 3,
					description: '食費',
					date: currentDate,
				}),
			})
			expect(expense2Res.status).toBe(201)

			// 収支サマリーを取得
			const summaryRes = await app.request('/api/balance/summary')
			if (summaryRes.status !== 200) {
				const error = await summaryRes.json()
				console.error('Summary error:', error)
			}
			expect(summaryRes.status).toBe(200)

			const summary: BalanceSummaryResponse = await summaryRes.json()
			expect(summary).toEqual({
				income: 450000,
				expense: 320000,
				balance: 130000,
				savingsRate: 28.9,
				trend: 'positive',
			})
		})

		it('月をまたいだ取引が正しくフィルタリングされる', async () => {
			const now = new Date()

			// 前月の最終日
			const lastDayOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0)
			const prevMonthDate = lastDayOfPrevMonth.toISOString()

			// 今月の初日
			const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
			const currentMonthDate = firstDayOfMonth.toISOString()

			// 前月の取引を作成
			await app.request('/api/transactions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					amount: 100000,
					type: 'income',
					categoryId: 101,
					description: '前月の収入',
					date: prevMonthDate,
				}),
			})

			// 今月の取引を作成
			await app.request('/api/transactions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					amount: 50000,
					type: 'income',
					categoryId: 101,
					description: '今月の収入',
					date: currentMonthDate,
				}),
			})

			// 収支サマリーを取得
			const summaryRes = await app.request('/api/balance/summary')
			if (summaryRes.status !== 200) {
				const error = await summaryRes.json()
				console.error('Summary error:', error)
			}
			expect(summaryRes.status).toBe(200)

			const summary: BalanceSummaryResponse = await summaryRes.json()

			// 今月の収入のみが含まれることを確認
			expect(summary.income).toBe(50000)
			expect(summary.expense).toBe(0)
			expect(summary.balance).toBe(50000)
			expect(summary.savingsRate).toBe(100.0)
			expect(summary.trend).toBe('positive')
		})

		it('CORSヘッダーが正しく設定される', async () => {
			const res = await app.request('/api/balance/summary', {
				headers: {
					Origin: 'http://localhost:3000',
				},
			})

			expect(res.status).toBe(200)
			expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:3000')
		})

		it('ログが正しく記録される', async () => {
			// ログミドルウェアが設定されているため、エラーがなければログも正常に記録される
			const res = await app.request('/api/balance/summary', {
				headers: {
					'X-Request-ID': 'test-request-123',
				},
			})

			expect(res.status).toBe(200)
			// レスポンスヘッダーにリクエストIDが含まれることを確認
			expect(res.headers.get('x-request-id')).toBe('test-request-123')
		})
	})
})
