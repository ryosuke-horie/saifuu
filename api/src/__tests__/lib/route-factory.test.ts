import { eq } from 'drizzle-orm'
import type { Context } from 'hono'
import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AnyDatabase } from '../../db'
import { createCrudHandlers } from '../../lib/route-factory'
import { type LoggingVariables } from '../../middleware/logging'

// モックの設定
vi.mock('../../middleware/logging', () => ({
	logWithContext: vi.fn(),
}))

// テスト用のスキーマ定義
const testTable = {
	id: 'id',
	name: 'name',
	description: 'description',
	createdAt: 'createdAt',
	updatedAt: 'updatedAt',
}

// テスト用の型定義
type TestEntity = {
	id: number
	name: string
	description?: string
	createdAt: string
	updatedAt: string
}

// モックデータベースの型定義
type MockDatabase = {
	select: ReturnType<typeof vi.fn>
	from: ReturnType<typeof vi.fn>
	where: ReturnType<typeof vi.fn>
	insert: ReturnType<typeof vi.fn>
	into: ReturnType<typeof vi.fn>
	values: ReturnType<typeof vi.fn>
	returning: ReturnType<typeof vi.fn>
	update: ReturnType<typeof vi.fn>
	set: ReturnType<typeof vi.fn>
	delete: ReturnType<typeof vi.fn>
}

// モックコンテキストの型定義
type MockContext = {
	req: {
		param: ReturnType<typeof vi.fn>
		json: ReturnType<typeof vi.fn>
	}
	json: ReturnType<typeof vi.fn>
	get: ReturnType<typeof vi.fn>
}

describe('route-factory', () => {
	let mockDb: MockDatabase
	let mockContext: MockContext

	beforeEach(() => {
		// データベースモックの初期化
		mockDb = {
			select: vi.fn().mockReturnThis(),
			from: vi.fn().mockReturnThis(),
			where: vi.fn().mockReturnThis(),
			insert: vi.fn().mockReturnThis(),
			into: vi.fn().mockReturnThis(),
			values: vi.fn().mockReturnThis(),
			returning: vi.fn(),
			update: vi.fn().mockReturnThis(),
			set: vi.fn().mockReturnThis(),
			delete: vi.fn().mockReturnThis(),
		}

		// コンテキストモックの初期化
		mockContext = {
			get: vi.fn((key) => {
				if (key === 'db') return mockDb
				return undefined
			}),
			json: vi.fn(),
			req: {
				param: vi.fn(),
				json: vi.fn(),
			},
		}
	})

	describe('createCrudHandlers', () => {
		it('CRUDハンドラーオブジェクトを生成する', () => {
			const handlers = createCrudHandlers({
				table: testTable,
				resourceName: 'test',
				validateCreate: (data: any) => ({ success: true, data }),
				validateUpdate: (data: any) => ({ success: true, data }),
				validateId: (id: string) => ({ success: true, data: Number(id) }),
			})

			expect(handlers).toHaveProperty('getAll')
			expect(handlers).toHaveProperty('getById')
			expect(handlers).toHaveProperty('create')
			expect(handlers).toHaveProperty('update')
			expect(handlers).toHaveProperty('delete')
		})

		describe('getAll handler', () => {
			it('すべてのレコードを取得する', async () => {
				const testData = [
					{ id: 1, name: 'Test 1', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
					{ id: 2, name: 'Test 2', createdAt: '2024-01-02', updatedAt: '2024-01-02' },
				]
				// select().from()が呼び出されたときにtestDataを返すように設定
				mockDb.from.mockResolvedValueOnce(testData)

				const handlers = createCrudHandlers<TestEntity, Partial<TestEntity>>({
					table: testTable,
					resourceName: 'test',
					validateCreate: (data: unknown) => ({ success: true, data: data as TestEntity }),
					validateUpdate: (data: unknown) => ({ success: true, data: data as Partial<TestEntity> }),
					validateId: (id: string) => ({ success: true, data: Number(id) }),
				})

				await handlers.getAll(mockContext as any)

				expect(mockDb.select).toHaveBeenCalled()
				expect(mockDb.from).toHaveBeenCalledWith(testTable)
				expect(mockContext.json).toHaveBeenCalledWith(testData)
			})

			it('データ変換関数が提供された場合、変換されたデータを返す', async () => {
				const testData = [
					{ id: 1, name: 'Test 1', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
				]
				mockDb.from.mockResolvedValueOnce(testData)

				const transformFn = vi.fn((data) =>
					data.map((item: any) => ({ ...item, transformed: true }))
				)

				const handlers = createCrudHandlers({
					table: testTable,
					resourceName: 'test',
					validateCreate: (data: any) => ({ success: true, data }),
					validateUpdate: (data: any) => ({ success: true, data }),
					validateId: (id: string) => ({ success: true, data: Number(id) }),
					transformData: transformFn,
				})

				await handlers.getAll(mockContext as any)

				expect(transformFn).toHaveBeenCalledWith(testData)
				expect(mockContext.json).toHaveBeenCalledWith([{ ...testData[0], transformed: true }])
			})

			it('エラー発生時に500エラーを返す', async () => {
				mockDb.from.mockRejectedValueOnce(new Error('Database error'))

				const handlers = createCrudHandlers<TestEntity, Partial<TestEntity>>({
					table: testTable,
					resourceName: 'test',
					validateCreate: (data: unknown) => ({ success: true, data: data as TestEntity }),
					validateUpdate: (data: unknown) => ({ success: true, data: data as Partial<TestEntity> }),
					validateId: (id: string) => ({ success: true, data: Number(id) }),
				})

				await handlers.getAll(mockContext as any)

				expect(mockContext.json).toHaveBeenCalledWith({ error: 'Failed to fetch test' }, 500)
			})
		})

		describe('getById handler', () => {
			it('IDで特定のレコードを取得する', async () => {
				const testData = [
					{ id: 1, name: 'Test 1', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
				]
				mockDb.where.mockResolvedValueOnce(testData)
				mockContext.req.param.mockReturnValueOnce('1')

				const handlers = createCrudHandlers<TestEntity, Partial<TestEntity>>({
					table: testTable,
					resourceName: 'test',
					validateCreate: (data: unknown) => ({ success: true, data: data as TestEntity }),
					validateUpdate: (data: unknown) => ({ success: true, data: data as Partial<TestEntity> }),
					validateId: (id: string) => ({ success: true, data: Number(id) }),
				})

				await handlers.getById(mockContext as any)

				expect(mockDb.where).toHaveBeenCalled()
				expect(mockContext.json).toHaveBeenCalledWith(testData[0])
			})

			it('レコードが見つからない場合404を返す', async () => {
				mockDb.where.mockResolvedValueOnce([])
				mockContext.req.param.mockReturnValueOnce('999')

				const handlers = createCrudHandlers<TestEntity, Partial<TestEntity>>({
					table: testTable,
					resourceName: 'test',
					validateCreate: (data: unknown) => ({ success: true, data: data as TestEntity }),
					validateUpdate: (data: unknown) => ({ success: true, data: data as Partial<TestEntity> }),
					validateId: (id: string) => ({ success: true, data: Number(id) }),
				})

				await handlers.getById(mockContext as any)

				expect(mockContext.json).toHaveBeenCalledWith({ error: 'Test not found' }, 404)
			})

			it('無効なIDの場合400エラーを返す', async () => {
				mockContext.req.param.mockReturnValueOnce('invalid')

				const handlers = createCrudHandlers<TestEntity, Partial<TestEntity>>({
					table: testTable,
					resourceName: 'test',
					validateCreate: (data: unknown) => ({ success: true, data: data as TestEntity }),
					validateUpdate: (data: unknown) => ({ success: true, data: data as Partial<TestEntity> }),
					validateId: (_id: string) => ({
						success: false,
						errors: [{ message: 'Invalid ID format' }],
					}),
				})

				await handlers.getById(mockContext as any)

				expect(mockContext.json).toHaveBeenCalledWith(
					{ error: 'Invalid ID format', details: [{ message: 'Invalid ID format' }] },
					400
				)
			})
		})

		describe('create handler', () => {
			it('新しいレコードを作成する', async () => {
				const newData = { name: 'New Test', description: 'Test description' }
				const createdData = {
					id: 1,
					...newData,
					createdAt: '2024-01-01',
					updatedAt: '2024-01-01',
				}
				mockContext.req.json.mockResolvedValueOnce(newData)
				mockDb.returning.mockResolvedValueOnce([createdData])

				const handlers = createCrudHandlers<TestEntity, Partial<TestEntity>>({
					table: testTable,
					resourceName: 'test',
					validateCreate: (data: unknown) => ({ success: true, data: data as TestEntity }),
					validateUpdate: (data: unknown) => ({ success: true, data: data as Partial<TestEntity> }),
					validateId: (id: string) => ({ success: true, data: Number(id) }),
				})

				await handlers.create(mockContext as any)

				expect(mockDb.insert).toHaveBeenCalledWith(testTable)
				expect(mockDb.values).toHaveBeenCalled()
				expect(mockContext.json).toHaveBeenCalledWith(createdData, 201)
			})

			it('バリデーションエラーの場合400を返す', async () => {
				const invalidData = { name: '' }
				mockContext.req.json.mockResolvedValueOnce(invalidData)

				const handlers = createCrudHandlers<TestEntity, Partial<TestEntity>>({
					table: testTable,
					resourceName: 'test',
					validateCreate: (_data: unknown) => ({
						success: false,
						errors: [{ message: 'Name is required' }],
					}),
					validateUpdate: (data: unknown) => ({ success: true, data: data as Partial<TestEntity> }),
					validateId: (id: string) => ({ success: true, data: Number(id) }),
				})

				await handlers.create(mockContext as any)

				expect(mockContext.json).toHaveBeenCalledWith(
					{ error: 'Name is required', details: [{ message: 'Name is required' }] },
					400
				)
			})
		})

		describe('update handler', () => {
			it('既存のレコードを更新する', async () => {
				const updateData = { name: 'Updated Test' }
				const updatedData = {
					id: 1,
					name: 'Updated Test',
					description: 'Original description',
					createdAt: '2024-01-01',
					updatedAt: '2024-01-02',
				}
				mockContext.req.param.mockReturnValueOnce('1')
				mockContext.req.json.mockResolvedValueOnce(updateData)
				mockDb.returning.mockResolvedValueOnce([updatedData])

				const handlers = createCrudHandlers<TestEntity, Partial<TestEntity>>({
					table: testTable,
					resourceName: 'test',
					validateCreate: (data: unknown) => ({ success: true, data: data as TestEntity }),
					validateUpdate: (data: unknown) => ({ success: true, data: data as Partial<TestEntity> }),
					validateId: (id: string) => ({ success: true, data: Number(id) }),
				})

				await handlers.update(mockContext as any)

				expect(mockDb.update).toHaveBeenCalledWith(testTable)
				expect(mockDb.set).toHaveBeenCalled()
				expect(mockDb.where).toHaveBeenCalled()
				expect(mockContext.json).toHaveBeenCalledWith(updatedData)
			})

			it('レコードが見つからない場合404を返す', async () => {
				mockContext.req.param.mockReturnValueOnce('999')
				mockContext.req.json.mockResolvedValueOnce({ name: 'Updated' })
				mockDb.returning.mockResolvedValueOnce([])

				const handlers = createCrudHandlers<TestEntity, Partial<TestEntity>>({
					table: testTable,
					resourceName: 'test',
					validateCreate: (data: unknown) => ({ success: true, data: data as TestEntity }),
					validateUpdate: (data: unknown) => ({ success: true, data: data as Partial<TestEntity> }),
					validateId: (id: string) => ({ success: true, data: Number(id) }),
				})

				await handlers.update(mockContext as any)

				expect(mockContext.json).toHaveBeenCalledWith({ error: 'Test not found' }, 404)
			})
		})

		describe('delete handler', () => {
			it('レコードを削除する', async () => {
				const deletedData = { id: 1, name: 'Deleted Test' }
				mockContext.req.param.mockReturnValueOnce('1')
				mockDb.returning.mockResolvedValueOnce([deletedData])

				const handlers = createCrudHandlers<TestEntity, Partial<TestEntity>>({
					table: testTable,
					resourceName: 'test',
					validateCreate: (data: unknown) => ({ success: true, data: data as TestEntity }),
					validateUpdate: (data: unknown) => ({ success: true, data: data as Partial<TestEntity> }),
					validateId: (id: string) => ({ success: true, data: Number(id) }),
				})

				await handlers.delete(mockContext as any)

				expect(mockDb.delete).toHaveBeenCalledWith(testTable)
				expect(mockDb.where).toHaveBeenCalled()
				expect(mockContext.json).toHaveBeenCalledWith({
					message: 'Test deleted successfully',
				})
			})

			it('レコードが見つからない場合404を返す', async () => {
				mockContext.req.param.mockReturnValueOnce('999')
				mockDb.returning.mockResolvedValueOnce([])

				const handlers = createCrudHandlers<TestEntity, Partial<TestEntity>>({
					table: testTable,
					resourceName: 'test',
					validateCreate: (data: unknown) => ({ success: true, data: data as TestEntity }),
					validateUpdate: (data: unknown) => ({ success: true, data: data as Partial<TestEntity> }),
					validateId: (id: string) => ({ success: true, data: Number(id) }),
				})

				await handlers.delete(mockContext as any)

				expect(mockContext.json).toHaveBeenCalledWith({ error: 'Test not found' }, 404)
			})
		})
	})
})
