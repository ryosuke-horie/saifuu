/**
 * サブスクリプションAPI用のデータ変換ユーティリティ
 *
 * データベース型とAPI型の間の変換を行う
 * 型安全性を保ちながら、IDの変換や日付フォーマットの変更を処理
 */

import type { Category } from '../db/schema'
import type {
	ApiCategory,
	ApiSubscription,
	CreateSubscriptionDbInput,
	CreateSubscriptionRequest,
	DbSubscriptionWithCategory,
	UpdateSubscriptionDbInput,
	UpdateSubscriptionRequest,
} from './subscription'

// =============================================================================
// カテゴリ変換関数
// =============================================================================

/**
 * データベースカテゴリをAPI形式に変換
 *
 * @param category - データベースから取得したカテゴリ
 * @returns API形式のカテゴリ
 */
export function transformCategoryDbToApi(category: Category): ApiCategory {
	return {
		id: category.id.toString(),
		name: category.name,
		type: category.type,
		color: category.color,
		createdAt: category.createdAt.toISOString(),
		updatedAt: category.updatedAt.toISOString(),
	}
}

// =============================================================================
// サブスクリプション変換関数
// =============================================================================

/**
 * データベースサブスクリプション（カテゴリ付き）をAPI形式に変換
 *
 * データベースから取得したJOIN結果をフロントエンド期待形式に変換
 * - integer ID → string ID
 * - Date → ISO string
 * - categoryId参照 → ネストされたcategoryオブジェクト
 *
 * @param dbSubscription - データベースから取得したサブスクリプション（カテゴリ付き）
 * @returns API形式のサブスクリプション
 */
export function transformSubscriptionDbToApi(
	dbSubscription: DbSubscriptionWithCategory
): ApiSubscription {
	return {
		id: dbSubscription.id.toString(),
		name: dbSubscription.name,
		amount: dbSubscription.amount,
		billingCycle: dbSubscription.billingCycle,
		nextBillingDate: dbSubscription.nextBillingDate.toISOString(),
		description: dbSubscription.description,
		isActive: dbSubscription.isActive,
		category: dbSubscription.category ? transformCategoryDbToApi(dbSubscription.category) : null,
		createdAt: dbSubscription.createdAt.toISOString(),
		updatedAt: dbSubscription.updatedAt.toISOString(),
	}
}

/**
 * 作成リクエストをデータベース挿入用形式に変換
 *
 * フロントエンドからの作成リクエストをデータベース挿入可能な形式に変換
 * - string categoryId → integer categoryId
 * - ISO string → Date
 * - デフォルト値の設定
 *
 * @param request - フロントエンドからの作成リクエスト
 * @returns データベース挿入用のデータ
 */
export function transformCreateSubscriptionApiToDb(
	request: CreateSubscriptionRequest
): CreateSubscriptionDbInput {
	const now = new Date()

	return {
		name: request.name,
		amount: request.amount,
		billingCycle: request.billingCycle,
		nextBillingDate: new Date(request.nextBillingDate),
		categoryId: request.categoryId ? Number.parseInt(request.categoryId) : null,
		description: request.description || null,
		isActive: request.isActive ?? true,
		createdAt: now,
		updatedAt: now,
	}
}

/**
 * 更新リクエストをデータベース更新用形式に変換
 *
 * フロントエンドからの更新リクエストをデータベース更新可能な形式に変換
 * - string categoryId → integer categoryId
 * - ISO string → Date
 * - undefined値の適切な処理
 *
 * @param request - フロントエンドからの更新リクエスト
 * @returns データベース更新用のデータ
 */
export function transformUpdateSubscriptionApiToDb(
	request: UpdateSubscriptionRequest
): UpdateSubscriptionDbInput {
	const result: UpdateSubscriptionDbInput = {
		updatedAt: new Date(),
	}

	// undefined値は含めない（部分更新のため）
	if (request.name !== undefined) {
		result.name = request.name
	}

	if (request.amount !== undefined) {
		result.amount = request.amount
	}

	if (request.billingCycle !== undefined) {
		result.billingCycle = request.billingCycle
	}

	if (request.nextBillingDate !== undefined) {
		result.nextBillingDate = new Date(request.nextBillingDate)
	}

	if (request.categoryId !== undefined) {
		result.categoryId = request.categoryId ? Number.parseInt(request.categoryId) : null
	}

	if (request.description !== undefined) {
		result.description = request.description
	}

	if (request.isActive !== undefined) {
		result.isActive = request.isActive
	}

	return result
}

// =============================================================================
// バリデーション関数
// =============================================================================

/**
 * 作成リクエストの基本バリデーション
 *
 * @param request - 検証対象のリクエスト
 * @returns バリデーション結果
 */
export function validateCreateSubscriptionRequest(request: CreateSubscriptionRequest): {
	isValid: boolean
	errors: string[]
} {
	const errors: string[] = []

	// 必須フィールドの検証
	if (!request.name || request.name.trim() === '') {
		errors.push('name is required')
	}

	if (typeof request.amount !== 'number' || request.amount <= 0) {
		errors.push('amount must be a positive number')
	}

	if (!['monthly', 'yearly', 'weekly'].includes(request.billingCycle)) {
		errors.push('billingCycle must be one of: monthly, yearly, weekly')
	}

	// 日付の検証
	try {
		const date = new Date(request.nextBillingDate)
		if (Number.isNaN(date.getTime())) {
			errors.push('nextBillingDate must be a valid date')
		}
	} catch {
		errors.push('nextBillingDate must be a valid date')
	}

	// categoryIdの検証（指定されている場合）
	if (request.categoryId !== undefined && request.categoryId !== null) {
		const categoryIdNum = Number.parseInt(request.categoryId)
		if (Number.isNaN(categoryIdNum) || categoryIdNum <= 0) {
			errors.push('categoryId must be a valid positive integer')
		}
	}

	return {
		isValid: errors.length === 0,
		errors,
	}
}

/**
 * 更新リクエストの基本バリデーション
 *
 * @param request - 検証対象のリクエスト
 * @returns バリデーション結果
 */
export function validateUpdateSubscriptionRequest(request: UpdateSubscriptionRequest): {
	isValid: boolean
	errors: string[]
} {
	const errors: string[] = []

	// 少なくとも1つのフィールドが更新されている必要がある
	const hasUpdates = Object.keys(request).some(
		(key) => request[key as keyof UpdateSubscriptionRequest] !== undefined
	)

	if (!hasUpdates) {
		errors.push('At least one field must be provided for update')
	}

	// 各フィールドの検証（指定されている場合のみ）
	if (request.name !== undefined) {
		if (!request.name || request.name.trim() === '') {
			errors.push('name cannot be empty')
		}
	}

	if (request.amount !== undefined) {
		if (typeof request.amount !== 'number' || request.amount <= 0) {
			errors.push('amount must be a positive number')
		}
	}

	if (request.billingCycle !== undefined) {
		if (!['monthly', 'yearly', 'weekly'].includes(request.billingCycle)) {
			errors.push('billingCycle must be one of: monthly, yearly, weekly')
		}
	}

	if (request.nextBillingDate !== undefined) {
		try {
			const date = new Date(request.nextBillingDate)
			if (Number.isNaN(date.getTime())) {
				errors.push('nextBillingDate must be a valid date')
			}
		} catch {
			errors.push('nextBillingDate must be a valid date')
		}
	}

	if (request.categoryId !== undefined && request.categoryId !== null) {
		const categoryIdNum = Number.parseInt(request.categoryId)
		if (Number.isNaN(categoryIdNum) || categoryIdNum <= 0) {
			errors.push('categoryId must be a valid positive integer')
		}
	}

	return {
		isValid: errors.length === 0,
		errors,
	}
}

// =============================================================================
// IDパーサー関数
// =============================================================================

/**
 * パラメーターからIDを安全に解析
 *
 * @param idParam - URLパラメーターのID
 * @returns 解析されたID（数値）、または無効な場合はnull
 */
export function parseIdParam(idParam: string): number | null {
	const id = Number.parseInt(idParam)
	return Number.isNaN(id) || id <= 0 ? null : id
}

/**
 * クエリパラメーターを安全に解析
 *
 * @param queryParam - クエリパラメーター
 * @param defaultValue - デフォルト値
 * @returns 解析された値
 */
export function parseQueryParam(queryParam: string | undefined, defaultValue: string): string {
	return queryParam && queryParam.trim() !== '' ? queryParam : defaultValue
}

/**
 * 数値クエリパラメーターを安全に解析
 *
 * @param queryParam - クエリパラメーター
 * @param defaultValue - デフォルト値
 * @param min - 最小値
 * @param max - 最大値
 * @returns 解析された値
 */
export function parseNumberQueryParam(
	queryParam: string | undefined,
	defaultValue: number,
	min = 1,
	max = 1000
): number {
	if (!queryParam) return defaultValue

	const parsed = Number.parseInt(queryParam)
	if (Number.isNaN(parsed)) return defaultValue

	return Math.max(min, Math.min(max, parsed))
}

/**
 * ブール値クエリパラメーターを安全に解析
 *
 * @param queryParam - クエリパラメーター
 * @returns 解析された値、または無効な場合はundefined
 */
export function parseBooleanQueryParam(queryParam: string | undefined): boolean | undefined {
	if (!queryParam) return undefined

	const lower = queryParam.toLowerCase()
	if (lower === 'true' || lower === '1') return true
	if (lower === 'false' || lower === '0') return false

	return undefined
}
