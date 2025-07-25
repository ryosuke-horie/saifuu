/**
 * 共有型定義
 */

/**
 * 日付形式のオプション
 */
export interface DateFormatOptions {
	/** 区切り文字（デフォルト: '/'） */
	separator?: '/' | '-'
	/** タイムゾーン（デフォルト: システムのタイムゾーン） */
	timeZone?: string
}

/**
 * 金額フォーマットのオプション
 */
export interface CurrencyFormatOptions {
	/** 通貨記号を表示するか（デフォルト: true） */
	showSymbol?: boolean
	/** 小数点以下の桁数（デフォルト: 0） */
	decimals?: number
}
