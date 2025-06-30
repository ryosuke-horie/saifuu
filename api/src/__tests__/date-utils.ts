/**
 * テスト用の日付・タイムスタンプユーティリティ
 * 全テストで一貫した日付処理を提供し、型の不一致を解決
 */

/**
 * 標準化されたテスト用日付
 * D1データベースではタイムスタンプがinteger型として保存される
 */
export const TEST_DATES = {
	BASE_DATE: new Date('2024-01-01T00:00:00.000Z'),
	TRANSACTION_DATE_1: new Date('2024-01-15T00:00:00.000Z'),
	TRANSACTION_DATE_2: new Date('2024-01-16T00:00:00.000Z'),
	SUBSCRIPTION_NEXT_BILLING: new Date('2024-02-01T00:00:00.000Z'),
	SEARCH_START: new Date('2024-01-12T00:00:00.000Z'),
	SEARCH_END: new Date('2024-01-22T00:00:00.000Z'),
} as const

/**
 * JavaScriptのDateオブジェクトをD1のタイムスタンプ（integer）に変換
 */
export function toTimestamp(date: Date): number {
	return Math.floor(date.getTime() / 1000)
}

/**
 * D1のタイムスタンプ（integer）をJavaScriptのDateオブジェクトに変換
 */
export function fromTimestamp(timestamp: number): Date {
	return new Date(timestamp * 1000)
}

/**
 * ISO文字列をD1のタイムスタンプに変換
 */
export function isoToTimestamp(isoString: string): number {
	return toTimestamp(new Date(isoString))
}

/**
 * 現在時刻のタイムスタンプを取得
 */
export function nowTimestamp(): number {
	return toTimestamp(new Date())
}

/**
 * テスト用の固定タイムスタンプを取得
 */
export function getTestTimestamp(key: keyof typeof TEST_DATES): number {
	return toTimestamp(TEST_DATES[key])
}

/**
 * 値がタイムスタンプ形式（数値）かどうかを検証
 */
export function isTimestamp(value: unknown): value is number {
	return typeof value === 'number' && value > 0 && Number.isInteger(value)
}

/**
 * 値がDate形式かどうかを検証
 */
export function isDate(value: unknown): value is Date {
	return value instanceof Date && !Number.isNaN(value.getTime())
}

/**
 * 値がISO文字列形式かどうかを検証
 */
export function isISOString(value: unknown): value is string {
	if (typeof value !== 'string') return false
	try {
		const date = new Date(value)
		return date.toISOString() === value
	} catch {
		return false
	}
}

/**
 * タイムスタンプが期待する範囲内にあるかを検証
 */
export function isReasonableTimestamp(timestamp: number): boolean {
	// 2020年以降、2030年以前の範囲で検証
	const minTimestamp = toTimestamp(new Date('2020-01-01'))
	const maxTimestamp = toTimestamp(new Date('2030-01-01'))
	return timestamp >= minTimestamp && timestamp <= maxTimestamp
}

/**
 * テスト用のカテゴリデータを生成（標準化されたタイムスタンプ使用）
 */
export function createMockCategory(
	overrides: Partial<{
		id: number
		name: string
		type: 'income' | 'expense'
		color: string
		createdAt: Date
		updatedAt: Date
	}> = {}
) {
	return {
		id: 1,
		name: 'テストカテゴリ',
		type: 'expense' as const,
		color: '#FF5722',
		createdAt: TEST_DATES.BASE_DATE,
		updatedAt: TEST_DATES.BASE_DATE,
		...overrides,
	}
}

/**
 * テスト用の取引データを生成（標準化されたタイムスタンプ使用）
 */
export function createMockTransaction(
	overrides: Partial<{
		id: number
		amount: number
		type: 'income' | 'expense'
		categoryId: number
		description: string
		date: Date
		createdAt: Date
		updatedAt: Date
	}> = {}
) {
	return {
		id: 1,
		amount: 1000,
		type: 'expense' as const,
		categoryId: 1,
		description: 'テスト取引',
		date: TEST_DATES.TRANSACTION_DATE_1,
		createdAt: TEST_DATES.TRANSACTION_DATE_1,
		updatedAt: TEST_DATES.TRANSACTION_DATE_1,
		...overrides,
	}
}

/**
 * テスト用のサブスクリプションデータを生成（標準化されたタイムスタンプ使用）
 */
export function createMockSubscription(
	overrides: Partial<{
		id: number
		name: string
		amount: number
		billingCycle: 'monthly' | 'yearly'
		nextBillingDate: Date
		categoryId: number
		description: string
		isActive: boolean
		createdAt: Date
		updatedAt: Date
	}> = {}
) {
	return {
		id: 1,
		name: 'テストサブスク',
		amount: 1000,
		billingCycle: 'monthly' as const,
		nextBillingDate: TEST_DATES.SUBSCRIPTION_NEXT_BILLING,
		categoryId: 1,
		description: 'テスト用定期支払い',
		isActive: true,
		createdAt: TEST_DATES.BASE_DATE,
		updatedAt: TEST_DATES.BASE_DATE,
		...overrides,
	}
}

/**
 * API レスポンスの日付フィールドを検証
 * D1から取得されるデータは文字列として返される場合がある
 */
export function validateApiDateField(value: unknown, fieldName: string): void {
	if (typeof value === 'string') {
		// ISO文字列形式の場合
		if (!isISOString(value)) {
			throw new Error(`${fieldName} は有効なISO文字列ではありません: ${value}`)
		}
	} else if (typeof value === 'number') {
		// タイムスタンプ形式の場合
		if (!isTimestamp(value)) {
			throw new Error(`${fieldName} は有効なタイムスタンプではありません: ${value}`)
		}
		if (!isReasonableTimestamp(value)) {
			throw new Error(`${fieldName} のタイムスタンプが範囲外です: ${value}`)
		}
	} else if (value instanceof Date) {
		// Date オブジェクトの場合
		if (!isDate(value)) {
			throw new Error(`${fieldName} は有効なDateオブジェクトではありません: ${value}`)
		}
	} else {
		throw new Error(`${fieldName} は予期しない型です: ${typeof value}`)
	}
}

/**
 * API レスポンスの全日付フィールドを一括検証
 */
export function validateApiResponseDates(
	response: Record<string, unknown>,
	dateFields: string[]
): void {
	for (const field of dateFields) {
		if (response[field] !== undefined && response[field] !== null) {
			validateApiDateField(response[field], field)
		}
	}
}

// テスト実行時の時間測定用タイマー
const testTimers: Map<string, number> = new Map()

/**
 * タイマー開始
 */
export function startTimer(name: string): void {
	testTimers.set(name, performance.now())
}

/**
 * タイマー終了と経過時間取得
 */
export function endTimer(name: string): number {
	const startTime = testTimers.get(name)
	if (!startTime) {
		throw new Error(`Timer '${name}' was not started`)
	}
	const elapsed = performance.now() - startTime
	testTimers.delete(name)
	return elapsed
}

/**
 * 経過時間の期待値検証
 */
export function expectWithinTime(name: string, maxMs: number): number {
	const elapsed = endTimer(name)
	if (elapsed > maxMs) {
		throw new Error(
			`Operation '${name}' took ${elapsed.toFixed(2)}ms, expected less than ${maxMs}ms`
		)
	}
	return elapsed
}

/**
 * 全てのタイマーをクリア
 */
export function clearTimers(): void {
	testTimers.clear()
}
