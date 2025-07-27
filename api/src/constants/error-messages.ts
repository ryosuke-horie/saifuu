/**
 * エラーメッセージの定数
 * 一貫性のあるエラーメッセージを提供
 */

export const ERROR_MESSAGES = {
	// バリデーションエラー
	VALIDATION: {
		INVALID_ID: 'IDの形式が無効です',
		INVALID_INPUT: '入力値が不正です',
		REQUIRED_FIELD: '必須項目が入力されていません',
		INVALID_DATE_FORMAT: '日付の形式が正しくありません（YYYY-MM-DD）',
		INVALID_AMOUNT: '金額は0より大きい数値である必要があります',
		INVALID_TYPE: 'タイプはincomeまたはexpenseである必要があります',
	},

	// リソースエラー
	RESOURCE: {
		TRANSACTION_NOT_FOUND: '取引が見つかりません',
		CATEGORY_NOT_FOUND: 'カテゴリが見つかりません',
		RESOURCE_NOT_FOUND: 'リソースが見つかりません',
	},

	// 操作エラー
	OPERATION: {
		CREATE_FAILED: '作成に失敗しました',
		UPDATE_FAILED: '更新に失敗しました',
		DELETE_FAILED: '削除に失敗しました',
		FETCH_FAILED: '取得に失敗しました',
	},

	// データベースエラー
	DATABASE: {
		CONNECTION_FAILED: 'データベース接続に失敗しました',
		QUERY_FAILED: 'クエリの実行に失敗しました',
		TRANSACTION_FAILED: 'トランザクションの実行に失敗しました',
	},

	// 認証・認可エラー
	AUTH: {
		UNAUTHORIZED: '認証が必要です',
		FORBIDDEN: 'アクセス権限がありません',
		TOKEN_EXPIRED: 'トークンの有効期限が切れています',
	},

	// システムエラー
	SYSTEM: {
		INTERNAL_ERROR: 'システムエラーが発生しました',
		SERVICE_UNAVAILABLE: 'サービスが一時的に利用できません',
		TIMEOUT: 'リクエストがタイムアウトしました',
	},
} as const

/**
 * 動的なエラーメッセージを生成するヘルパー関数
 */
export const createErrorMessage = {
	notFound: (resourceType: string, id: number | string) => 
		`${resourceType}（ID: ${id}）が見つかりません`,
	
	validationFailed: (fieldName: string, reason: string) =>
		`${fieldName}の検証に失敗しました: ${reason}`,
	
	operationFailed: (operation: string, resourceType: string) =>
		`${resourceType}の${operation}に失敗しました`,
	
	duplicateEntry: (fieldName: string, value: string) =>
		`${fieldName}「${value}」は既に存在します`,
	
	outOfRange: (fieldName: string, min: number, max: number) =>
		`${fieldName}は${min}から${max}の範囲で入力してください`,
} as const

/**
 * HTTPステータスコードとエラーメッセージのマッピング
 */
export const HTTP_ERROR_MESSAGES: Record<number, string> = {
	400: 'リクエストが不正です',
	401: '認証が必要です',
	403: 'アクセスが拒否されました',
	404: 'リソースが見つかりません',
	409: 'データの競合が発生しました',
	422: '処理できないエンティティです',
	429: 'リクエストが多すぎます',
	500: 'サーバーエラーが発生しました',
	502: 'ゲートウェイエラーが発生しました',
	503: 'サービスが一時的に利用できません',
	504: 'ゲートウェイタイムアウトが発生しました',
} as const