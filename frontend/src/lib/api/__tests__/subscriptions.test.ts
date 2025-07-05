/**
 * Subscriptions API のテスト
 * 
 * Issue #53 修正対応:
 * - APIレスポンス形式変更（オブジェクト→配列）の検証
 * - fetchSubscriptions() の動作確認とカテゴリ連携テスト
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  fetchSubscriptions,
  fetchSubscriptionById,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  updateSubscriptionStatus,
} from '../subscriptions/api'
import { apiClient } from '../client'
import type { ApiSubscriptionResponse } from '../subscriptions/types'
import type { Category } from '../../../types/category'
import type { SubscriptionFormData } from '../../../types/subscription'

// apiClientをモック化
vi.mock('../client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('Subscriptions API', () => {
  const mockCategories: Category[] = [
    {
      id: '1',
      name: 'エンターテイメント',
      type: 'expense',
      color: '#FF6B6B',
      createdAt: '2025-07-05T07:06:39Z',
      updatedAt: '2025-07-05T07:06:39Z',
    },
    {
      id: '2',
      name: '仕事・ビジネス',
      type: 'expense',
      color: '#4ECDC4',
      createdAt: '2025-07-05T07:06:39Z',
      updatedAt: '2025-07-05T07:06:39Z',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('fetchSubscriptions', () => {
    it('should fetch subscriptions successfully with array response format', async () => {
      // 今回の修正: APIが配列を直接返すケース
      const mockApiResponse: ApiSubscriptionResponse[] = [
        {
          id: 1,
          name: 'Netflix',
          amount: 1980,
          categoryId: 1,
          billingCycle: 'monthly',
          nextBillingDate: '2025-08-01T00:00:00Z',
          isActive: true,
          description: '動画ストリーミング',
          createdAt: '2025-07-05T07:06:39Z',
          updatedAt: '2025-07-05T07:06:39Z',
        },
        {
          id: 2,
          name: 'GitHub Pro',
          amount: 400,
          categoryId: 2,
          billingCycle: 'monthly',
          nextBillingDate: '2025-08-01T00:00:00Z',
          isActive: true,
          description: null,
          createdAt: '2025-07-05T07:06:39Z',
          updatedAt: '2025-07-05T07:06:39Z',
        },
      ]

      const mockGet = vi.mocked(apiClient.get)
      mockGet.mockResolvedValueOnce(mockApiResponse)

      const result = await fetchSubscriptions(mockCategories)

      expect(mockGet).toHaveBeenCalledWith('/subscriptions')
      expect(result).toHaveLength(2)
      
      // 第1サブスクリプションの検証
      expect(result[0]).toEqual({
        id: '1',
        name: 'Netflix',
        amount: 1980,
        category: mockCategories[0], // カテゴリ連携の確認
        billingCycle: 'monthly',
        nextBillingDate: '2025-08-01', // YYYY-MM-DD形式に変換される
        isActive: true,
        description: '動画ストリーミング',
      })

      // 第2サブスクリプションの検証
      expect(result[1]).toEqual({
        id: '2',
        name: 'GitHub Pro',
        amount: 400,
        category: mockCategories[1], // カテゴリ連携の確認
        billingCycle: 'monthly',
        nextBillingDate: '2025-08-01', // YYYY-MM-DD形式に変換される
        isActive: true,
        description: undefined, // null -> undefined 変換
      })
    })

    it('should handle empty subscriptions array', async () => {
      // 空配列レスポンスのテスト
      const mockGet = vi.mocked(apiClient.get)
      mockGet.mockResolvedValueOnce([])

      const result = await fetchSubscriptions(mockCategories)

      expect(mockGet).toHaveBeenCalledWith('/subscriptions')
      expect(result).toEqual([])
    })

    it('should handle missing category with error', async () => {
      // 存在しないカテゴリIDを持つサブスクリプション
      const mockApiResponse: ApiSubscriptionResponse[] = [
        {
          id: 1,
          name: 'Unknown Service',
          amount: 1000,
          categoryId: 999, // 存在しないカテゴリID
          billingCycle: 'monthly',
          nextBillingDate: '2025-08-01T00:00:00Z',
          isActive: true,
          description: null,
          createdAt: '2025-07-05T07:06:39Z',
          updatedAt: '2025-07-05T07:06:39Z',
        },
      ]

      const mockGet = vi.mocked(apiClient.get)
      mockGet.mockResolvedValueOnce(mockApiResponse)

      // 存在しないカテゴリの場合、エラーが投げられることを確認
      await expect(fetchSubscriptions(mockCategories)).rejects.toThrow(
        'サブスクリプション一覧の取得に失敗しました'
      )
    })

    it('should handle API errors', async () => {
      const mockGet = vi.mocked(apiClient.get)
      mockGet.mockRejectedValueOnce(new Error('Network Error'))

      await expect(fetchSubscriptions(mockCategories)).rejects.toThrow(
        'サブスクリプション一覧の取得に失敗しました'
      )
    })
  })

  describe('fetchSubscriptionById', () => {
    it('should fetch single subscription by id', async () => {
      const mockApiResponse: ApiSubscriptionResponse = {
        id: 1,
        name: 'Netflix',
        amount: 1980,
        categoryId: 1,
        billingCycle: 'monthly',
        nextBillingDate: '2025-08-01T00:00:00Z',
        isActive: true,
        description: '動画ストリーミング',
        createdAt: '2025-07-05T07:06:39Z',
        updatedAt: '2025-07-05T07:06:39Z',
      }

      const mockGet = vi.mocked(apiClient.get)
      mockGet.mockResolvedValueOnce(mockApiResponse)

      const result = await fetchSubscriptionById('1', mockCategories)

      expect(mockGet).toHaveBeenCalledWith('/subscriptions/1')
      expect(result.id).toBe('1')
      expect(result.name).toBe('Netflix')
      expect(result.category).toEqual(mockCategories[0])
    })
  })

  describe('createSubscription', () => {
    it('should create subscription successfully', async () => {
      const mockFormData: SubscriptionFormData = {
        name: 'Spotify',
        amount: 980,
        categoryId: '1',
        billingCycle: 'monthly',
        nextBillingDate: '2025-08-01',
        isActive: true,
        description: '音楽ストリーミング',
      }

      const mockApiResponse: ApiSubscriptionResponse = {
        id: 3,
        name: 'Spotify',
        amount: 980,
        categoryId: 1,
        billingCycle: 'monthly',
        nextBillingDate: '2025-08-01T00:00:00Z',
        isActive: true,
        description: '音楽ストリーミング',
        createdAt: '2025-07-05T07:06:39Z',
        updatedAt: '2025-07-05T07:06:39Z',
      }

      const mockPost = vi.mocked(apiClient.post)
      mockPost.mockResolvedValueOnce(mockApiResponse)

      const result = await createSubscription(mockFormData, mockCategories)

      expect(mockPost).toHaveBeenCalledWith('/subscriptions', expect.any(Object))
      expect(result.id).toBe('3')
      expect(result.name).toBe('Spotify')
    })
  })

  describe('updateSubscription', () => {
    it('should update subscription successfully', async () => {
      const mockFormData: Partial<SubscriptionFormData> = {
        name: 'Spotify Premium',
        amount: 1480,
      }

      const mockApiResponse: ApiSubscriptionResponse = {
        id: 1,
        name: 'Spotify Premium',
        amount: 1480,
        categoryId: 1,
        billingCycle: 'monthly',
        nextBillingDate: '2025-08-01T00:00:00Z',
        isActive: true,
        description: '音楽ストリーミング',
        createdAt: '2025-07-05T07:06:39Z',
        updatedAt: '2025-07-05T07:06:39Z',
      }

      const mockPut = vi.mocked(apiClient.put)
      mockPut.mockResolvedValueOnce(mockApiResponse)

      const result = await updateSubscription('1', mockFormData, mockCategories)

      expect(mockPut).toHaveBeenCalledWith('/subscriptions/1', expect.any(Object))
      expect(result.name).toBe('Spotify Premium')
      expect(result.amount).toBe(1480)
    })
  })

  describe('deleteSubscription', () => {
    it('should delete subscription successfully', async () => {
      const mockDelete = vi.mocked(apiClient.delete)
      mockDelete.mockResolvedValueOnce(undefined)

      await deleteSubscription('1')

      expect(mockDelete).toHaveBeenCalledWith('/subscriptions/1')
    })
  })

  describe('updateSubscriptionStatus', () => {
    it('should update subscription status successfully', async () => {
      const mockApiResponse: ApiSubscriptionResponse = {
        id: 1,
        name: 'Netflix',
        amount: 1980,
        categoryId: 1,
        billingCycle: 'monthly',
        nextBillingDate: '2025-08-01T00:00:00Z',
        isActive: false, // ステータス更新後
        description: '動画ストリーミング',
        createdAt: '2025-07-05T07:06:39Z',
        updatedAt: '2025-07-05T07:06:39Z',
      }

      const mockPut = vi.mocked(apiClient.put)
      mockPut.mockResolvedValueOnce(mockApiResponse)

      const result = await updateSubscriptionStatus('1', false, mockCategories)

      expect(mockPut).toHaveBeenCalledWith('/subscriptions/1', { isActive: false })
      expect(result.isActive).toBe(false)
    })
  })

  describe('API Response Format Validation', () => {
    it('should handle array response format correctly (Issue #53 fix)', async () => {
      // 今回の修正の核心: 配列レスポンス形式の正しい処理
      const mockArrayResponse: ApiSubscriptionResponse[] = [
        {
          id: 1,
          name: 'Service 1',
          amount: 1000,
          categoryId: 1,
          billingCycle: 'monthly',
          nextBillingDate: '2025-08-01T00:00:00Z',
          isActive: true,
          description: null,
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
        },
      ]

      const mockGet = vi.mocked(apiClient.get)
      mockGet.mockResolvedValueOnce(mockArrayResponse)

      const result = await fetchSubscriptions(mockCategories)

      // 配列が正しく処理されることを確認
      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(1)
      
      // 要素が正しく変換されることを確認
      expect(result[0].id).toBe('1')
      expect(result[0].name).toBe('Service 1')
      expect(result[0].category).toEqual(mockCategories[0])
    })
  })
})