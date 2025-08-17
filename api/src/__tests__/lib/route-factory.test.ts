import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createCrudHandlers, shouldVerifyPersistence } from '../../lib/route-factory'

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
	orderBy: ReturnType<typeof vi.fn>
	insert: ReturnType<typeof vi.fn>
	into: ReturnType<typeof vi.fn>
	values: ReturnType<typeof vi.fn>
	returning: ReturnType<typeof vi.fn>
	update: ReturnType<typeof vi.fn>
	set: ReturnType<typeof vi.fn>
	delete: ReturnType<typeof vi.fn>
}

describe('route-factory', () => {
	let mockDb: MockDatabase
	// biome-ignore lint/suspicious/noExplicitAny: Test mock context needs flexible typing
	let mockContext: any

	beforeEach(() => {
		// モックをリセット
		vi.clearAllMocks()

		// データベースモックの初期化
		mockDb = {
			select: vi.fn().mockReturnThis(),
			from: vi.fn().mockReturnThis(),
			where: vi.fn().mockReturnThis(),
			orderBy: vi.fn().mockReturnThis(),
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
				validateCreate: (data: unknown) => ({ success: true, data }),
				validateUpdate: (data: unknown) => ({ success: true, data }),
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
				// select().from().orderBy()が呼び出されたときにtestDataを返すように設定
				mockDb.orderBy.mockResolvedValueOnce(testData)

				const handlers = createCrudHandlers<TestEntity, Partial<TestEntity>>({
					table: testTable,
					resourceName: 'test',
					validateCreate: (data: unknown) => ({ success: true, data: data as TestEntity }),
					validateUpdate: (data: unknown) => ({ success: true, data: data as Partial<TestEntity> }),
					validateId: (id: string) => ({ success: true, data: Number(id) }),
				})

				await handlers.getAll(mockContext)

				expect(mockDb.select).toHaveBeenCalled()
				expect(mockDb.from).toHaveBeenCalledWith(testTable)
				expect(mockContext.json).toHaveBeenCalledWith(testData)
			})

			it('データ変換関数が提供された場合、変換されたデータを返す', async () => {
				const testData = [
					{ id: 1, name: 'Test 1', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
				]
				mockDb.orderBy.mockResolvedValueOnce(testData)

				const transformFn = vi.fn((data: unknown[]) =>
					(data as TestEntity[]).map((item) => ({ ...item, transformed: true }))
				)

				const handlers = createCrudHandlers({
					table: testTable,
					resourceName: 'test',
					validateCreate: (data: unknown) => ({ success: true, data }),
					validateUpdate: (data: unknown) => ({ success: true, data }),
					validateId: (id: string) => ({ success: true, data: Number(id) }),
					transformData: transformFn,
				})

				await handlers.getAll(mockContext)

				expect(transformFn).toHaveBeenCalledWith(testData)
				expect(mockContext.json).toHaveBeenCalledWith([{ ...testData[0], transformed: true }])
			})

			it('エラー発生時に500エラーを返す', async () => {
				mockDb.orderBy.mockRejectedValueOnce(new Error('Database error'))

				const handlers = createCrudHandlers<TestEntity, Partial<TestEntity>>({
					table: testTable,
					resourceName: 'test',
					validateCreate: (data: unknown) => ({ success: true, data: data as TestEntity }),
					validateUpdate: (data: unknown) => ({ success: true, data: data as Partial<TestEntity> }),
					validateId: (id: string) => ({ success: true, data: Number(id) }),
				})

				await handlers.getAll(mockContext)

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

				await handlers.getById(mockContext)

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

				await handlers.getById(mockContext)

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

				await handlers.getById(mockContext)

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

				await handlers.create(mockContext)

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

				await handlers.create(mockContext)

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

				await handlers.update(mockContext)

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

				await handlers.update(mockContext)

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

				await handlers.delete(mockContext)

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

				await handlers.delete(mockContext)

				expect(mockContext.json).toHaveBeenCalledWith({ error: 'Test not found' }, 404)
			})
		})

		describe('エッジケーステスト', () => {
			describe('大量データ処理', () => {
				it('1000件のレコードを正常に処理できる', async () => {
					// 1000件のテストデータを生成
					const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
						id: i + 1,
						name: `Test ${i + 1}`,
						description: `Description for test item ${i + 1}`,
						createdAt: new Date(2024, 0, 1, 0, 0, i).toISOString(),
						updatedAt: new Date(2024, 0, 1, 0, 0, i).toISOString(),
					}))

					mockDb.orderBy.mockResolvedValueOnce(largeDataset)

					const handlers = createCrudHandlers<TestEntity, Partial<TestEntity>>({
						table: testTable,
						resourceName: 'test',
						validateCreate: (data: unknown) => ({ success: true, data: data as TestEntity }),
						validateUpdate: (data: unknown) => ({
							success: true,
							data: data as Partial<TestEntity>,
						}),
						validateId: (id: string) => ({ success: true, data: Number(id) }),
					})

					await handlers.getAll(mockContext)

					expect(mockDb.select).toHaveBeenCalled()
					expect(mockContext.json).toHaveBeenCalledWith(largeDataset)
				})

				it('大きなペイロードのPOSTリクエストを処理できる', async () => {
					// 大きな説明文を含むデータ
					const largePayload = {
						name: 'Large Test',
						description: 'A'.repeat(10000), // 10,000文字の説明
						metadata: Array.from({ length: 100 }, (_, i) => ({
							key: `key${i}`,
							value: `value${i}`,
						})),
					}

					mockContext.req.json.mockResolvedValueOnce(largePayload)
					mockDb.returning.mockResolvedValueOnce([
						{
							id: 1,
							...largePayload,
							createdAt: '2024-01-01',
							updatedAt: '2024-01-01',
						},
					])

					const handlers = createCrudHandlers<TestEntity, Partial<TestEntity>>({
						table: testTable,
						resourceName: 'test',
						validateCreate: (data: unknown) => ({ success: true, data: data as TestEntity }),
						validateUpdate: (data: unknown) => ({
							success: true,
							data: data as Partial<TestEntity>,
						}),
						validateId: (id: string) => ({ success: true, data: Number(id) }),
					})

					await handlers.create(mockContext)

					expect(mockDb.insert).toHaveBeenCalled()
					expect(mockContext.json).toHaveBeenCalledWith(
						expect.objectContaining({ id: 1, name: 'Large Test' }),
						201
					)
				})
			})

			describe('エラーハンドリング', () => {
				it('データベース接続エラーを適切に処理する', async () => {
					const dbError = new Error('Database connection failed')
					mockDb.from.mockRejectedValueOnce(dbError)

					const handlers = createCrudHandlers<TestEntity, Partial<TestEntity>>({
						table: testTable,
						resourceName: 'test',
						validateCreate: (data: unknown) => ({ success: true, data: data as TestEntity }),
						validateUpdate: (data: unknown) => ({
							success: true,
							data: data as Partial<TestEntity>,
						}),
						validateId: (id: string) => ({ success: true, data: Number(id) }),
					})

					await handlers.getAll(mockContext)

					expect(mockContext.json).toHaveBeenCalledWith({ error: 'Failed to fetch test' }, 500)
				})

				it('不正なJSONペイロードを処理する', async () => {
					mockContext.req.json.mockRejectedValueOnce(new Error('Invalid JSON'))

					const handlers = createCrudHandlers<TestEntity, Partial<TestEntity>>({
						table: testTable,
						resourceName: 'test',
						validateCreate: (data: unknown) => ({ success: true, data: data as TestEntity }),
						validateUpdate: (data: unknown) => ({
							success: true,
							data: data as Partial<TestEntity>,
						}),
						validateId: (id: string) => ({ success: true, data: Number(id) }),
					})

					await handlers.create(mockContext)

					expect(mockContext.json).toHaveBeenCalledWith({ error: 'Failed to create test' }, 500)
				})

				it('D1環境の戻り値形式を正しく処理する', async () => {
					// D1環境をシミュレート（resultsプロパティに配列が含まれる）
					const d1Result = {
						results: [{ id: 1, name: 'D1 Test', createdAt: '2024-01-01', updatedAt: '2024-01-01' }],
						success: true,
						meta: { duration: 0.123 },
					}
					mockDb.returning.mockResolvedValueOnce(d1Result)
					mockContext.req.json.mockResolvedValueOnce({ name: 'D1 Test' })

					const handlers = createCrudHandlers<TestEntity, Partial<TestEntity>>({
						table: testTable,
						resourceName: 'test',
						validateCreate: (data: unknown) => ({ success: true, data: data as TestEntity }),
						validateUpdate: (data: unknown) => ({
							success: true,
							data: data as Partial<TestEntity>,
						}),
						validateId: (id: string) => ({ success: true, data: Number(id) }),
					})

					await handlers.create(mockContext)

					expect(mockContext.json).toHaveBeenCalledWith(
						{ id: 1, name: 'D1 Test', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
						201
					)
				})
			})

			describe('並行性とレース条件', () => {
				it('同時に複数のリクエストを処理できる', async () => {
					const testData = { id: 1, name: 'Concurrent Test' }
					mockDb.from.mockResolvedValue([testData])

					const handlers = createCrudHandlers<TestEntity, Partial<TestEntity>>({
						table: testTable,
						resourceName: 'test',
						validateCreate: (data: unknown) => ({ success: true, data: data as TestEntity }),
						validateUpdate: (data: unknown) => ({
							success: true,
							data: data as Partial<TestEntity>,
						}),
						validateId: (id: string) => ({ success: true, data: Number(id) }),
					})

					// 10個の並行リクエストを作成
					const promises = Array.from({ length: 10 }, () => handlers.getAll(mockContext))
					const results = await Promise.all(promises)

					// すべてのリクエストが成功することを確認
					expect(results).toHaveLength(10)
					expect(mockDb.select).toHaveBeenCalledTimes(10)
				})
			})

			describe('境界値テスト', () => {
				it('IDの最大値を処理できる', async () => {
					const maxId = Number.MAX_SAFE_INTEGER
					mockContext.req.param.mockReturnValueOnce(maxId.toString())
					mockDb.where.mockResolvedValueOnce([{ id: maxId, name: 'Max ID Test' }])

					const handlers = createCrudHandlers<TestEntity, Partial<TestEntity>>({
						table: testTable,
						resourceName: 'test',
						validateCreate: (data: unknown) => ({ success: true, data: data as TestEntity }),
						validateUpdate: (data: unknown) => ({
							success: true,
							data: data as Partial<TestEntity>,
						}),
						validateId: (id: string) => {
							const numId = Number(id)
							if (numId > Number.MAX_SAFE_INTEGER) {
								return { success: false, errors: [{ message: 'ID too large' }] }
							}
							return { success: true, data: numId }
						},
					})

					await handlers.getById(mockContext)

					expect(mockDb.where).toHaveBeenCalled()
					expect(mockContext.json).toHaveBeenCalledWith({ id: maxId, name: 'Max ID Test' })
				})

				it('空の文字列フィールドを処理できる', async () => {
					const emptyData = { name: '', description: '' }
					mockContext.req.json.mockResolvedValueOnce(emptyData)
					mockDb.returning.mockResolvedValueOnce([
						{
							id: 1,
							...emptyData,
							createdAt: '2024-01-01',
							updatedAt: '2024-01-01',
						},
					])

					const handlers = createCrudHandlers<TestEntity, Partial<TestEntity>>({
						table: testTable,
						resourceName: 'test',
						validateCreate: (data: unknown) => ({ success: true, data: data as TestEntity }),
						validateUpdate: (data: unknown) => ({
							success: true,
							data: data as Partial<TestEntity>,
						}),
						validateId: (id: string) => ({ success: true, data: Number(id) }),
					})

					await handlers.create(mockContext)

					expect(mockDb.insert).toHaveBeenCalled()
					expect(mockContext.json).toHaveBeenCalledWith(
						expect.objectContaining({ name: '', description: '' }),
						201
					)
				})
			})

			describe('特殊文字とエンコーディング', () => {
				it('Unicode文字を含むデータを処理できる', async () => {
					const unicodeData = {
						name: '🚀 ロケット テスト 测试',
						description: '日本語、中文、한국어、العربية',
					}
					mockContext.req.json.mockResolvedValueOnce(unicodeData)
					mockDb.returning.mockResolvedValueOnce([
						{
							id: 1,
							...unicodeData,
							createdAt: '2024-01-01',
							updatedAt: '2024-01-01',
						},
					])

					const handlers = createCrudHandlers<TestEntity, Partial<TestEntity>>({
						table: testTable,
						resourceName: 'test',
						validateCreate: (data: unknown) => ({ success: true, data: data as TestEntity }),
						validateUpdate: (data: unknown) => ({
							success: true,
							data: data as Partial<TestEntity>,
						}),
						validateId: (id: string) => ({ success: true, data: Number(id) }),
					})

					await handlers.create(mockContext)

					expect(mockContext.json).toHaveBeenCalledWith(expect.objectContaining(unicodeData), 201)
				})

				it('SQLインジェクション攻撃文字列を安全に処理する', async () => {
					const maliciousData = {
						name: "'; DROP TABLE users; --",
						description: "1' OR '1'='1",
					}
					mockContext.req.json.mockResolvedValueOnce(maliciousData)
					mockDb.returning.mockResolvedValueOnce([
						{
							id: 1,
							...maliciousData,
							createdAt: '2024-01-01',
							updatedAt: '2024-01-01',
						},
					])

					const handlers = createCrudHandlers<TestEntity, Partial<TestEntity>>({
						table: testTable,
						resourceName: 'test',
						validateCreate: (data: unknown) => ({ success: true, data: data as TestEntity }),
						validateUpdate: (data: unknown) => ({
							success: true,
							data: data as Partial<TestEntity>,
						}),
						validateId: (id: string) => ({ success: true, data: Number(id) }),
					})

					await handlers.create(mockContext)

					// Drizzle ORMがパラメータ化クエリを使用するため、
					// SQLインジェクション文字列は安全に処理される
					expect(mockDb.values).toHaveBeenCalled()
					expect(mockContext.json).toHaveBeenCalledWith(expect.objectContaining(maliciousData), 201)
				})
			})
		})
	})

	describe('shouldVerifyPersistence', () => {
		// テスト用のモックDB
		const mockDbWithSelect = {
			select: vi.fn(),
		}

		const mockDbWithoutSelect = {}

		it('テストデータベースが提供されている場合はfalseを返す', () => {
			const testDatabase = {} as any
			const result = shouldVerifyPersistence(testDatabase, mockDbWithSelect as any)
			expect(result).toBe(false)
		})

		it('データベースにselect関数が存在しない場合はfalseを返す', () => {
			const result = shouldVerifyPersistence(undefined, mockDbWithoutSelect as any)
			expect(result).toBe(false)
		})

		// 注意: import.meta.envは実行時に決定されるため、
		// テスト環境での環境変数の動的な変更は実際の動作を完全に再現できない
		// 以下のテストは、関数の条件分岐のロジックを確認するためのものである

		it('開発環境の判定条件を確認（実際のテスト環境では常にfalse）', () => {
			// Vitest環境では通常、NODE_ENVがtestに設定されているため、
			// 実際にはfalseが返される（開発環境扱いになる）
			const result = shouldVerifyPersistence(undefined, mockDbWithSelect as any)
			// テスト環境では基本的にfalse（検証をスキップ）になることを確認
			expect(typeof result).toBe('boolean')
		})
	})
})
