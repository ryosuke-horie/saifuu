import { beforeEach, describe, expect, it, vi } from 'vitest'
import { type AnyDatabase } from '../../db'
import {
	type IncomeStatisticsResponse,
	IncomeStatisticsService,
} from '../income-statistics.service'

/**
 * IncomeStatisticsServiceのユニットテスト
 * TDD方針：Red → Green → Refactor サイクルに従った実装テスト
 * Mock使用によりデータベース依存を排除し、ビジネスロジックに集中
 */
describe('IncomeStatisticsService', () => {
	let mockDb: AnyDatabase
	let service: IncomeStatisticsService

	beforeEach(() => {
		// データベースのモック作成
		mockDb = {
			select: vi.fn().mockReturnThis(),
			from: vi.fn().mockReturnThis(),
			where: vi.fn().mockReturnThis(),
			groupBy: vi.fn().mockReturnThis(),
		} as unknown as AnyDatabase

		service = new IncomeStatisticsService(mockDb)
	})

	describe('calculateIncomeStatistics', () => {
		it('正常系：収入統計データを正しく計算して返す', async () => {
			// Arrange: モックデータの設定
			const mockCurrentMonthStats = [{ totalAmount: '50000' }]
			const mockLastMonthStats = [{ totalAmount: '40000' }]
			const mockCurrentYearStats = [{ totalAmount: '500000' }]
			const mockCategoryStats = [
				{ categoryId: 1, totalAmount: '30000' },
				{ categoryId: 2, totalAmount: '20000' },
			]

			// クエリメソッドのモック設定
			vi.mocked(mockDb.select)
				.mockReturnValueOnce({
					from: vi.fn().mockReturnValue({
						where: vi.fn().mockResolvedValue(mockCurrentMonthStats),
					}),
				} as any)
				.mockReturnValueOnce({
					from: vi.fn().mockReturnValue({
						where: vi.fn().mockResolvedValue(mockLastMonthStats),
					}),
				} as any)
				.mockReturnValueOnce({
					from: vi.fn().mockReturnValue({
						where: vi.fn().mockResolvedValue(mockCurrentYearStats),
					}),
				} as any)
				.mockReturnValueOnce({
					from: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							groupBy: vi.fn().mockResolvedValue(mockCategoryStats),
						}),
					}),
				} as any)

			// Act: テスト対象メソッドの実行
			const result = await service.calculateIncomeStatistics()

			// Assert: 結果の検証
			expect(result).toEqual({
				currentMonth: 50000,
				lastMonth: 40000,
				currentYear: 500000,
				monthOverMonth: 25.0, // (50000 - 40000) / 40000 * 100 = 25%
				categoryBreakdown: expect.arrayContaining([
					expect.objectContaining({
						categoryId: 1,
						amount: 30000,
						percentage: 60.0, // 30000 / 50000 * 100 = 60%
					}),
					expect.objectContaining({
						categoryId: 2,
						amount: 20000,
						percentage: 40.0, // 20000 / 50000 * 100 = 40%
					}),
				]),
			} satisfies IncomeStatisticsResponse)
		})

		it('エッジケース：先月が0円の場合、前月比が0%になる', async () => {
			// Arrange: 先月が0円のモックデータ
			const mockCurrentMonthStats = [{ totalAmount: '30000' }]
			const mockLastMonthStats = [{ totalAmount: null }] // null = 0円
			const mockCurrentYearStats = [{ totalAmount: '30000' }]
			const mockCategoryStats = [{ categoryId: 1, totalAmount: '30000' }]

			// モック設定（簡略化）
			vi.mocked(mockDb.select)
				.mockReturnValueOnce({
					from: vi.fn().mockReturnValue({
						where: vi.fn().mockResolvedValue(mockCurrentMonthStats),
					}),
				} as any)
				.mockReturnValueOnce({
					from: vi.fn().mockReturnValue({
						where: vi.fn().mockResolvedValue(mockLastMonthStats),
					}),
				} as any)
				.mockReturnValueOnce({
					from: vi.fn().mockReturnValue({
						where: vi.fn().mockResolvedValue(mockCurrentYearStats),
					}),
				} as any)
				.mockReturnValueOnce({
					from: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							groupBy: vi.fn().mockResolvedValue(mockCategoryStats),
						}),
					}),
				} as any)

			// Act
			const result = await service.calculateIncomeStatistics()

			// Assert: 前月比が0%であることを確認
			expect(result.monthOverMonth).toBe(0)
			expect(result.lastMonth).toBe(0)
		})

		it('エッジケース：今月が0円の場合、カテゴリ別割合が0%になる', async () => {
			// Arrange: 今月が0円のモックデータ
			const mockCurrentMonthStats = [{ totalAmount: null }] // null = 0円
			const mockLastMonthStats = [{ totalAmount: '10000' }]
			const mockCurrentYearStats = [{ totalAmount: '10000' }]
			const mockCategoryStats: any[] = [] // 空配列

			// モック設定
			vi.mocked(mockDb.select)
				.mockReturnValueOnce({
					from: vi.fn().mockReturnValue({
						where: vi.fn().mockResolvedValue(mockCurrentMonthStats),
					}),
				} as any)
				.mockReturnValueOnce({
					from: vi.fn().mockReturnValue({
						where: vi.fn().mockResolvedValue(mockLastMonthStats),
					}),
				} as any)
				.mockReturnValueOnce({
					from: vi.fn().mockReturnValue({
						where: vi.fn().mockResolvedValue(mockCurrentYearStats),
					}),
				} as any)
				.mockReturnValueOnce({
					from: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							groupBy: vi.fn().mockResolvedValue(mockCategoryStats),
						}),
					}),
				} as any)

			// Act
			const result = await service.calculateIncomeStatistics()

			// Assert: 今月が0円で適切に処理されることを確認
			expect(result.currentMonth).toBe(0)
			expect(result.categoryBreakdown).toEqual([])
			expect(result.monthOverMonth).toBe(-100) // (0 - 10000) / 10000 * 100 = -100%
		})

		it('異常系：無効なカテゴリIDとnull金額をフィルタリングする', async () => {
			// Arrange: 無効データを含むモックデータ
			const mockCurrentMonthStats = [{ totalAmount: '40000' }]
			const mockLastMonthStats = [{ totalAmount: '30000' }]
			const mockCurrentYearStats = [{ totalAmount: '400000' }]
			const mockCategoryStats = [
				{ categoryId: 1, totalAmount: '20000' }, // 有効
				{ categoryId: null, totalAmount: '10000' }, // 無効：categoryIdがnull
				{ categoryId: 2, totalAmount: null }, // 無効：totalAmountがnull
				{ categoryId: 3, totalAmount: '20000' }, // 有効
			]

			// モック設定
			vi.mocked(mockDb.select)
				.mockReturnValueOnce({
					from: vi.fn().mockReturnValue({
						where: vi.fn().mockResolvedValue(mockCurrentMonthStats),
					}),
				} as any)
				.mockReturnValueOnce({
					from: vi.fn().mockReturnValue({
						where: vi.fn().mockResolvedValue(mockLastMonthStats),
					}),
				} as any)
				.mockReturnValueOnce({
					from: vi.fn().mockReturnValue({
						where: vi.fn().mockResolvedValue(mockCurrentYearStats),
					}),
				} as any)
				.mockReturnValueOnce({
					from: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							groupBy: vi.fn().mockResolvedValue(mockCategoryStats),
						}),
					}),
				} as any)

			// Act
			const result = await service.calculateIncomeStatistics()

			// Assert: 有効なデータのみ処理されることを確認
			expect(result.categoryBreakdown).toHaveLength(2)
			expect(result.categoryBreakdown.every((item) => item.categoryId !== null)).toBe(true)
			expect(result.categoryBreakdown.every((item) => item.amount > 0)).toBe(true)
		})
	})
})
