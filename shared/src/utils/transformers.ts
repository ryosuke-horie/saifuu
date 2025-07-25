/**
 * データ変換ユーティリティ
 *
 * API/Frontend間で共通して使用されるデータ変換処理を提供
 * 日付フォーマット、金額フォーマット、データ正規化などの変換ロジックを集約
 *
 * 設計方針:
 * - 単一責任の原則: 各関数は1つの変換処理に特化
 * - 純粋関数: 副作用なし、同じ入力に対して常に同じ出力
 * - 型安全性: TypeScriptの型システムを活用
 * - エラーハンドリング: 不正な入力に対して明確なエラーメッセージ
 */

// 定数定義
const LOCALE_JP = 'ja-JP' as const
const DATE_SEPARATORS = /[/.\s]/g
const TIMEZONE_JP = 'Asia/Tokyo' as const

/**
 * 金額を日本円形式でフォーマット
 * @param amount フォーマットする金額
 * @param isNegative 負の値として表示するか（支出表示用）
 */
export function formatCurrency(amount: number, isNegative = false): string {
	const absAmount = Math.abs(amount)
	const rounded = Math.round(absAmount)
	const formatted = `¥${rounded.toLocaleString(LOCALE_JP)}`

	return amount < 0 || isNegative ? `-${formatted}` : formatted
}

/**
 * 日付を日本語形式でフォーマット（YYYY/MM/DD）
 * @param dateString ISO日付文字列またはYYYY-MM-DD形式
 */
export function formatDate(dateString: string): string {
	const date = new Date(dateString)

	if (Number.isNaN(date.getTime())) {
		throw new Error(`Invalid date format: ${dateString}`)
	}

	return date.toLocaleDateString(LOCALE_JP, {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		timeZone: TIMEZONE_JP, // 明示的にJSTを指定
	})
}

/**
 * YYYY-MM-DD形式の日付文字列をISO 8601形式に変換
 * @param dateString YYYY-MM-DD形式の日付文字列
 */
export function formatDateToISO(dateString: string): string {
	const date = new Date(dateString)

	if (Number.isNaN(date.getTime())) {
		throw new Error(`Invalid date format: ${dateString}`)
	}

	return date.toISOString()
}

/**
 * ISO 8601日付文字列をYYYY-MM-DD形式に変換
 * @param isoDate ISO 8601形式の日付文字列
 */
export function formatDateToYYYYMMDD(isoDate: string): string {
	const date = new Date(isoDate)

	if (Number.isNaN(date.getTime())) {
		throw new Error(`Invalid date format: ${isoDate}`)
	}

	return date.toISOString().split('T')[0]
}

/**
 * パーセンテージをフォーマット（前月比等に使用）
 * @param percentage パーセンテージ値
 * @param decimals 小数点以下の桁数（デフォルト: 1）
 */
export function formatPercentage(percentage: number, decimals = 1): string {
	const sign = percentage >= 0 ? '+' : ''
	return `${sign}${percentage.toFixed(decimals)}%`
}

/**
 * 様々な日付形式をYYYY-MM-DD形式に正規化
 * @param dateString 日付文字列
 */
export function normalizeDate(dateString: string): string {
	// 様々な区切り文字を統一
	const normalized = dateString.replace(DATE_SEPARATORS, '-')

	// YYYY-M-D形式をYYYY-MM-DD形式に正規化
	const parts = normalized.split('-')
	if (parts.length === 3) {
		const [year, month, day] = parts

		// 基本的なバリデーション
		if (
			!year ||
			!month ||
			!day ||
			Number.isNaN(Number(year)) ||
			Number.isNaN(Number(month)) ||
			Number.isNaN(Number(day))
		) {
			throw new Error(`Invalid date format: ${dateString}`)
		}

		return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
	}

	throw new Error(`Invalid date format: ${dateString}`)
}

/**
 * 文字列の金額を数値に変換
 * @param amountString 金額文字列
 */
export function parseAmount(amountString: string): number {
	// カンマ、円記号、半角円記号を除去
	const cleaned = amountString.replace(/[,¥￥]/g, '')
	return Number.parseFloat(cleaned)
}

/**
 * テキストから不要な空白を削除し、正規化
 * @param text 対象テキスト
 * @param maxLength 最大長（オプショナル）
 */
export function sanitizeText(
	text: string | null | undefined,
	maxLength?: number,
): string {
	if (!text) return ''

	// エスケープシーケンスを実際の文字に変換
	const unescaped = text.replace(/\\n/g, '\n').replace(/\\t/g, '\t')

	// 連続する空白、改行、タブを単一のスペースに置換
	const sanitized = unescaped.trim().replace(/\s+/g, ' ')

	if (maxLength && sanitized.length > maxLength) {
		return sanitized.substring(0, maxLength)
	}

	return sanitized
}

/**
 * API日付（ISO形式）をフロントエンド形式（YYYY-MM-DD）に変換
 * @param apiDate API形式の日付
 */
export function transformApiDateToFrontend(apiDate: string): string {
	return formatDateToYYYYMMDD(apiDate)
}

/**
 * フロントエンド日付（YYYY-MM-DD）をAPI形式（ISO）に変換
 * @param frontendDate フロントエンド形式の日付
 */
export function transformFrontendDateToApi(frontendDate: string): string {
	return formatDateToISO(frontendDate)
}
