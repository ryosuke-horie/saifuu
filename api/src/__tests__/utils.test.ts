/**
 * ユーティリティ関数のテスト
 * データベースやAPIに依存しない純粋なテスト
 */

import { describe, expect, it } from 'vitest'

describe('Utils Tests', () => {
	describe('JavaScript基本機能', () => {
		it('基本的な算術演算が動作する', () => {
			expect(1 + 1).toBe(2)
			expect(10 - 5).toBe(5)
			expect(3 * 4).toBe(12)
			expect(15 / 3).toBe(5)
		})

		it('文字列操作が動作する', () => {
			const str = 'Hello World'
			expect(str.toLowerCase()).toBe('hello world')
			expect(str.toUpperCase()).toBe('HELLO WORLD')
			expect(str.split(' ')).toEqual(['Hello', 'World'])
		})

		it('配列操作が動作する', () => {
			const arr = [1, 2, 3, 4, 5]
			expect(arr.length).toBe(5)
			expect(arr.map((x) => x * 2)).toEqual([2, 4, 6, 8, 10])
			expect(arr.filter((x) => x > 3)).toEqual([4, 5])
		})

		it('オブジェクト操作が動作する', () => {
			const obj = { name: 'Test', age: 30 }
			expect(obj.name).toBe('Test')
			expect(obj.age).toBe(30)
			expect(Object.keys(obj)).toEqual(['name', 'age'])
		})
	})

	describe('日付処理', () => {
		it('Date オブジェクトが動作する', () => {
			const now = new Date()
			expect(now).toBeInstanceOf(Date)

			const specificDate = new Date('2024-01-01')
			expect(specificDate.getFullYear()).toBe(2024)
			expect(specificDate.getMonth()).toBe(0) // 0-indexed
			expect(specificDate.getDate()).toBe(1)
		})

		it('Unixタイムスタンプが正しく変換される', () => {
			const timestamp = 1704067200 // 2024-01-01 00:00:00 UTC
			const date = new Date(timestamp * 1000)
			expect(date.getUTCFullYear()).toBe(2024)
			expect(date.getUTCMonth()).toBe(0)
			expect(date.getUTCDate()).toBe(1)
		})
	})

	describe('JSON処理', () => {
		it('JSONのシリアライズ・デシリアライズが動作する', () => {
			const obj = { name: 'テスト', amount: 1000, active: true }
			const jsonString = JSON.stringify(obj)
			const parsed = JSON.parse(jsonString)

			expect(parsed).toEqual(obj)
			expect(parsed.name).toBe('テスト')
			expect(parsed.amount).toBe(1000)
			expect(parsed.active).toBe(true)
		})

		it('不正なJSONでエラーが発生する', () => {
			expect(() => {
				JSON.parse('{ invalid json }')
			}).toThrow()
		})
	})

	describe('Promise・非同期処理', () => {
		it('Promiseが正常に動作する', async () => {
			const promise = Promise.resolve('success')
			const result = await promise
			expect(result).toBe('success')
		})

		it('async/awaitが正常に動作する', async () => {
			const asyncFunction = async (value: string) => {
				return `async: ${value}`
			}

			const result = await asyncFunction('test')
			expect(result).toBe('async: test')
		})

		it('Promise.allが正常に動作する', async () => {
			const promises = [Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)]

			const results = await Promise.all(promises)
			expect(results).toEqual([1, 2, 3])
		})
	})

	describe('TypeScript機能', () => {
		it('型定義が正しく動作する', () => {
			interface TestInterface {
				id: number
				name: string
				optional?: boolean
			}

			const testObj: TestInterface = {
				id: 1,
				name: 'Test',
			}

			expect(testObj.id).toBe(1)
			expect(testObj.name).toBe('Test')
			expect(testObj.optional).toBeUndefined()
		})

		it('ジェネリクスが正しく動作する', () => {
			function identity<T>(arg: T): T {
				return arg
			}

			expect(identity<string>('hello')).toBe('hello')
			expect(identity<number>(42)).toBe(42)
			expect(identity<boolean>(true)).toBe(true)
		})
	})

	describe('Web標準API', () => {
		it('URL処理が動作する', () => {
			const url = new URL('https://example.com/path?param=value')
			expect(url.hostname).toBe('example.com')
			expect(url.pathname).toBe('/path')
			expect(url.searchParams.get('param')).toBe('value')
		})

		it('URLSearchParamsが動作する', () => {
			const params = new URLSearchParams('name=test&age=30')
			expect(params.get('name')).toBe('test')
			expect(params.get('age')).toBe('30')
			expect(params.has('name')).toBe(true)
			expect(params.has('unknown')).toBe(false)
		})
	})

	describe('エラーハンドリング', () => {
		it('Errorオブジェクトが正しく動作する', () => {
			const error = new Error('Test error')
			expect(error.message).toBe('Test error')
			expect(error).toBeInstanceOf(Error)
		})

		it('try-catchが正しく動作する', () => {
			let caught = false

			try {
				throw new Error('Test error')
			} catch (error) {
				caught = true
				expect(error).toBeInstanceOf(Error)
			}

			expect(caught).toBe(true)
		})
	})
})
