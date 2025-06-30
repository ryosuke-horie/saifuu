import { Hono } from 'hono'
import type { Env } from '../../db'
import { createTestDatabase } from './test-db'

/**
 * テスト用Honoアプリヘルパー
 * APIエンドポイントのテストに使用するユーティリティ関数群
 */

/**
 * テスト用のHonoアプリケーションリクエストを作成
 * @param app - テスト対象のHonoアプリ
 * @param method - HTTPメソッド
 * @param path - リクエストパス
 * @param body - リクエストボディ（オプション）
 * @param headers - リクエストヘッダー（オプション）
 * @returns Responseオブジェクト
 */
export async function createTestRequest(
	app: Hono<{ Bindings: Env }>,
	method: 'GET' | 'POST' | 'PUT' | 'DELETE',
	path: string,
	body?: unknown,
	headers?: Record<string, string>
) {
	const url = `http://localhost${path}`
	const requestInit: RequestInit = {
		method,
		headers: {
			'Content-Type': 'application/json',
			...headers,
		},
	}

	if (body && (method === 'POST' || method === 'PUT')) {
		requestInit.body = JSON.stringify(body)
	}

	const request = new Request(url, requestInit)

	// Create a dummy environment - the actual database will be injected differently
	const env = {
		DB: {} as any, // This won't be used since we'll override database creation
	}

	const executionContext = {
		waitUntil: () => {},
		passThroughOnException: () => {},
		props: {},
	} as ExecutionContext

	return await app.fetch(request, env, executionContext)
}

/**
 * レスポンスのJSONデータを取得
 * @param response - Responseオブジェクト
 * @returns JSONデータ
 */
export async function getResponseJson(response: Response) {
	const text = await response.text()
	try {
		return JSON.parse(text)
	} catch {
		return text
	}
}

/**
 * ステータスコードをチェック
 */
export function expectStatus(response: Response, expectedStatus: number) {
	if (response.status !== expectedStatus) {
		throw new Error(`Expected status ${expectedStatus}, but got ${response.status}`)
	}
}

/**
 * レスポンスヘッダーをチェック
 */
export function expectHeader(response: Response, headerName: string, expectedValue: string) {
	const actualValue = response.headers.get(headerName)
	if (actualValue !== expectedValue) {
		throw new Error(
			`Expected header ${headerName} to be "${expectedValue}", but got "${actualValue}"`
		)
	}
}

/**
 * JSONレスポンスの構造をチェック
 */
export function expectJsonStructure(data: unknown, expectedKeys: string[]) {
	if (typeof data !== 'object' || data === null) {
		throw new Error('Response is not an object')
	}

	const actualKeys = Object.keys(data as Record<string, unknown>)
	for (const key of expectedKeys) {
		if (!actualKeys.includes(key)) {
			throw new Error(`Expected key "${key}" is missing from response`)
		}
	}
}

/**
 * エラーレスポンスの形式をチェック
 */
export function expectErrorResponse(data: unknown, expectedMessage: string) {
	if (typeof data !== 'object' || data === null) {
		throw new Error('Error response is not an object')
	}

	const errorData = data as Record<string, unknown>
	if (!errorData.error) {
		throw new Error("Error response missing 'error' field")
	}

	if (errorData.error !== expectedMessage) {
		throw new Error(`Expected error message "${expectedMessage}", but got "${errorData.error}"`)
	}
}

/**
 * APIレスポンスのアサーション用ヘルパー
 * @deprecated Use individual functions instead
 */
export class ApiTestHelper {
	/**
	 * ステータスコードをチェック
	 */
	static expectStatus = expectStatus
	static expectHeader = expectHeader
	static expectJsonStructure = expectJsonStructure
	static expectErrorResponse = expectErrorResponse
}
