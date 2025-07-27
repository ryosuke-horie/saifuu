/**
 * テスト用定数定義
 * マジックストリングやハードコードされた値を定数として管理
 */

// カテゴリID関連
export const TEST_CATEGORY_IDS = {
  ENTERTAINMENT: 'entertainment',
  BUSINESS: 'business',
  SYSTEM_FEE: 'system_fee',
  INVALID: 99999,
  MIN_VALID: 0,
  NEGATIVE: -1,
} as const

// テストデータの名前
export const TEST_SUBSCRIPTION_NAMES = {
  GITHUB_PRO: 'GitHub Pro',
  GITHUB_TEAM: 'GitHub Team',
  GITHUB_ENTERPRISE: 'GitHub Enterprise',
  YOUTUBE_PREMIUM: 'YouTube Premium',
  NO_CATEGORY: 'No Category Subscription',
  TEST_SUBSCRIPTION: 'Test Subscription',
} as const

// テストデータの説明
export const TEST_DESCRIPTIONS = {
  NETFLIX_PAYMENT: 'Netflix subscription payment',
  INVALID_CATEGORY_TX: 'Transaction with invalid category',
} as const

// 金額関連の定数
export const TEST_AMOUNTS = {
  NETFLIX: 1500,
  SPOTIFY: 980,
  YOUTUBE: 1180,
  DEFAULT: 1000,
  GITHUB_BASE: 400, // GitHubの基本金額（400円は$4相当の日本円換算）
} as const

// 集計値の期待値
export const EXPECTED_TOTALS = {
  STREAMING_SERVICES: 3660, // 1500 + 980 + 1180
} as const

// HTTPステータスコード
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const

// バリデーションメッセージ
export const VALIDATION_MESSAGES = {
  CATEGORY_ID_REQUIRED: 'Category ID must be a positive integer',
  INVALID_CATEGORY_ID: 'Invalid category ID',
} as const