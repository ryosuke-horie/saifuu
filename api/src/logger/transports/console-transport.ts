/**
 * コンソールトランスポート
 *
 * コンソールへのログ出力を担当するトランスポート
 * 開発環境での即座出力と本番環境での構造化出力を提供
 */

import { LogEntry, LogTransport } from '../types'

/**
 * コンソールトランスポート実装
 *
 * 設計原則：
 * - 環境に応じたフォーマット最適化
 * - エラー時の安全なフォールバック
 * - 高性能な出力処理
 * - 機密情報の保護
 */
export class ConsoleTransport implements LogTransport {
	private isDevelopment: boolean
	private colorEnabled: boolean

	constructor(isDevelopment = false, colorEnabled = true) {
		this.isDevelopment = isDevelopment
		this.colorEnabled = colorEnabled && isDevelopment
	}

	/**
	 * ログエントリの出力処理
	 *
	 * 環境に応じて最適化されたフォーマットで出力
	 * 開発環境では可読性重視、本番環境では構造化重視
	 *
	 * @param entry ログエントリ
	 */
	async write(entry: LogEntry): Promise<void> {
		try {
			if (this.isDevelopment) {
				this.writeFormatted(entry)
			} else {
				this.writeStructured(entry)
			}
		} catch (_error) {
			// フォールバック出力
			this.writeFallback(entry)
		}
	}

	/**
	 * 開発環境向けのフォーマット出力
	 *
	 * 人間が読みやすい形式でログを出力
	 * 色付きの出力で視認性を向上
	 */
	private writeFormatted(entry: LogEntry): void {
		const timestamp = this.formatTimestamp(entry.timestamp)
		const level = this.formatLevel(entry.level)
		const message = entry.message
		const meta = this.formatMeta(entry.meta)

		const logLine = `${timestamp} ${level} [${entry.requestId}] ${message}${meta}`

		// レベルに応じた出力先の選択
		if (entry.level === 'error' || entry.level === 'fatal') {
			console.error(logLine)
		} else if (entry.level === 'warn') {
			console.warn(logLine)
		} else {
			console.log(logLine)
		}
	}

	/**
	 * 本番環境向けの構造化出力
	 *
	 * JSON形式での出力により、ログ集約・分析を容易化
	 * 外部ログサービスとの連携を想定
	 */
	private writeStructured(entry: LogEntry): void {
		const structuredLog = JSON.stringify(entry)

		// レベルに応じた出力先の選択
		if (entry.level === 'error' || entry.level === 'fatal') {
			console.error(structuredLog)
		} else if (entry.level === 'warn') {
			console.warn(structuredLog)
		} else {
			console.log(structuredLog)
		}
	}

	/**
	 * フォールバック出力
	 *
	 * 通常の出力処理が失敗した場合の緊急出力
	 * 最低限の情報を確実に記録
	 */
	private writeFallback(entry: LogEntry): void {
		const fallbackMessage = `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`

		try {
			console.log(fallbackMessage)
		} catch (_error) {
			// 最終的なフォールバック
			console.log(`Log output failed: ${entry.message}`)
		}
	}

	/**
	 * タイムスタンプのフォーマット
	 *
	 * 開発環境での可読性を重視したタイムスタンプ表示
	 *
	 * @param timestamp ISO 8601形式のタイムスタンプ
	 * @returns フォーマットされたタイムスタンプ
	 */
	private formatTimestamp(timestamp: string): string {
		try {
			const date = new Date(timestamp)
			return date.toLocaleString('ja-JP', {
				year: 'numeric',
				month: '2-digit',
				day: '2-digit',
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit',
				fractionalSecondDigits: 3,
			})
		} catch (_error) {
			return timestamp
		}
	}

	/**
	 * ログレベルのフォーマット
	 *
	 * 色付きの出力で視認性を向上
	 * 開発環境での効率的なデバッグを支援
	 *
	 * @param level ログレベル
	 * @returns フォーマットされたレベル文字列
	 */
	private formatLevel(level: string): string {
		const levelUpper = level.toUpperCase().padEnd(5)

		if (!this.colorEnabled) {
			return levelUpper
		}

		// ANSIカラーコードを使用した色付け
		switch (level) {
			case 'debug':
				return `\x1b[36m${levelUpper}\x1b[0m` // シアン
			case 'info':
				return `\x1b[32m${levelUpper}\x1b[0m` // 緑
			case 'warn':
				return `\x1b[33m${levelUpper}\x1b[0m` // 黄
			case 'error':
				return `\x1b[31m${levelUpper}\x1b[0m` // 赤
			case 'fatal':
				return `\x1b[35m${levelUpper}\x1b[0m` // マゼンタ
			default:
				return levelUpper
		}
	}

	/**
	 * メタデータのフォーマット
	 *
	 * 重要な情報のみを抽出して表示
	 * 開発環境での効率的なデバッグを支援
	 *
	 * @param meta メタデータ
	 * @returns フォーマットされたメタデータ文字列
	 */
	private formatMeta(meta: Record<string, unknown>): string {
		if (!meta || Object.keys(meta).length === 0) {
			return ''
		}

		const importantKeys = ['duration', 'statusCode', 'error', 'operationType', 'method', 'path']

		const filteredMeta: Record<string, unknown> = {}
		for (const key of importantKeys) {
			if (meta[key] !== undefined) {
				filteredMeta[key] = meta[key]
			}
		}

		if (Object.keys(filteredMeta).length === 0) {
			return ''
		}

		try {
			return ` ${JSON.stringify(filteredMeta)}`
		} catch (_error) {
			return ' [meta formatting failed]'
		}
	}

	/**
	 * トランスポートのクリーンアップ
	 *
	 * コンソールトランスポートでは特別なクリーンアップは不要
	 * インターフェースの統一性のために実装
	 */
	async close(): Promise<void> {
		// コンソール出力のクリーンアップは不要
	}
}

/**
 * コンソールトランスポートファクトリー
 *
 * 環境に応じた最適化されたトランスポートを作成
 *
 * @param isDevelopment 開発環境かどうか
 * @param colorEnabled 色付き出力を有効にするか
 * @returns コンソールトランスポートインスタンス
 */
export const createConsoleTransport = (
	isDevelopment = false,
	colorEnabled = true
): ConsoleTransport => {
	return new ConsoleTransport(isDevelopment, colorEnabled)
}
