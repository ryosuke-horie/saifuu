/**
 * クエリパラメータの型安全な解析ユーティリティ
 */

/**
 * 文字列を数値に安全に変換する
 * @param value - 変換する値
 * @returns 変換された数値、または変換できない場合はundefined
 */
export function parseNumberParam(value: string | undefined): number | undefined {
	if (!value || value.trim() === '') {
		return undefined
	}

	const parsed = Number(value)

	// NaN、Infinity、-Infinityをチェック
	if (!Number.isFinite(parsed)) {
		return undefined
	}

	return parsed
}

/**
 * 文字列を整数に安全に変換する
 * @param value - 変換する値
 * @returns 変換された整数、または変換できない場合はundefined
 */
export function parseIntParam(value: string | undefined): number | undefined {
	const parsed = parseNumberParam(value)

	if (parsed === undefined) {
		return undefined
	}

	// 整数かどうかチェック
	if (!Number.isInteger(parsed)) {
		return undefined
	}

	return parsed
}

/**
 * 文字列を正の整数に安全に変換する
 * @param value - 変換する値
 * @returns 変換された正の整数、または変換できない場合はundefined
 */
export function parsePositiveIntParam(value: string | undefined): number | undefined {
	const parsed = parseIntParam(value)

	if (parsed === undefined || parsed <= 0) {
		return undefined
	}

	return parsed
}

/**
 * 取引タイプの検証
 * @param value - 検証する値
 * @returns 有効な取引タイプ、または無効な場合はundefined
 */
export function parseTransactionType(value: string | undefined): 'income' | 'expense' | undefined {
	if (value === 'income' || value === 'expense') {
		return value
	}
	return undefined
}
