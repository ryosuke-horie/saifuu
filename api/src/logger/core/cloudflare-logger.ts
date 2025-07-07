/**
 * Cloudflare Workers最適化ロガー
 *
 * Cloudflare Workers環境の制約に対応した高性能ロガー実装
 * バッファリングと非同期処理によりパフォーマンスを最適化
 * CPU時間制限（50ms-30s）内での効率的な動作を実現
 */

import { shouldLog } from '../config'
import { LogEntry, Logger, LoggerConfig, LogLevel, LogMeta } from '../types'

/**
 * Cloudflare Workers環境向けロガー実装
 *
 * 設計原則：
 * - バッファリングによるパフォーマンス最適化
 * - 非同期処理でメインスレッドへの影響を最小化
 * - 環境別の最適化（開発：即座出力、本番：バッファリング）
 * - エラー時のフォールバック機能
 */
export class CloudflareLogger implements Logger {
	private config: LoggerConfig
	private buffer: LogEntry[] = []
	private flushTimer: NodeJS.Timeout | null = null
	private isDestroyed = false

	constructor(config: LoggerConfig) {
		this.config = config
		this.setupPeriodicFlush()
	}

	/**
	 * DEBUGレベルのログを出力
	 *
	 * 詳細なデバッグ情報を記録
	 * 開発環境でのみ出力される
	 */
	debug(message: string, meta: LogMeta = {}): void {
		this.log('debug', message, meta)
	}

	/**
	 * INFOレベルのログを出力
	 *
	 * 正常な操作の記録
	 * CRUD操作の完了、ヘルスチェック結果等
	 */
	info(message: string, meta: LogMeta = {}): void {
		this.log('info', message, meta)
	}

	/**
	 * WARNレベルのログを出力
	 *
	 * 回復可能なエラー・警告
	 * リトライ処理、パフォーマンス劣化等
	 */
	warn(message: string, meta: LogMeta = {}): void {
		this.log('warn', message, meta)
	}

	/**
	 * ERRORレベルのログを出力
	 *
	 * システムエラー・失敗
	 * データベース接続失敗、認証・認可エラー等
	 */
	error(message: string, meta: LogMeta = {}): void {
		this.log('error', message, meta)
	}

	/**
	 * FATALレベルのログを出力
	 *
	 * 致命的なエラー（システム停止レベル）
	 * 復旧不可能なエラー、重要なシステム障害等
	 */
	fatal(message: string, meta: LogMeta = {}): void {
		this.log('fatal', message, meta)

		// 致命的エラーの場合は即座にフラッシュ
		if (this.config.environment === 'production') {
			this.flushBuffer()
		}
	}

	/**
	 * 内部ログ処理メソッド
	 *
	 * ログレベルチェック、エントリ作成、出力処理を統一的に実行
	 * 環境に応じた最適化を適用
	 */
	private log(level: LogLevel, message: string, meta: LogMeta): void {
		// 破棄済みの場合は処理しない
		if (this.isDestroyed) {
			return
		}

		// ログレベルチェック
		if (!shouldLog(this.config.level, level)) {
			return
		}

		// ログエントリの作成
		const entry: LogEntry = {
			timestamp: new Date().toISOString(),
			level,
			message,
			requestId: meta.requestId || this.generateRequestId(),
			environment: this.config.environment,
			service: 'saifuu-api',
			version: this.config.version,
			meta: this.sanitizeMeta(meta),
		}

		// 環境に応じた出力処理
		if (this.config.environment === 'development') {
			// 開発環境では即座にコンソール出力
			this.outputToConsole(entry)
		} else {
			// 本番環境ではバッファリング
			this.addToBuffer(entry)
		}
	}

	/**
	 * バッファにログエントリを追加
	 *
	 * バッファサイズが上限に達した場合は即座にフラッシュ
	 * Cloudflare Workersのメモリ制限を考慮した設計
	 */
	private addToBuffer(entry: LogEntry): void {
		this.buffer.push(entry)

		// バッファサイズが上限に達したら即座にフラッシュ
		if (this.buffer.length >= this.config.bufferSize) {
			this.flushBuffer()
		}
	}

	/**
	 * コンソールへの出力
	 *
	 * 開発環境での可読性を重視したフォーマット
	 * JSONとして出力することで構造化ログを維持
	 */
	private outputToConsole(entry: LogEntry): void {
		try {
			// 開発環境では見やすい形式で出力
			console.log(JSON.stringify(entry, null, 2))
		} catch (_error) {
			// JSON化に失敗した場合のフォールバック
			console.log(`[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`)
		}
	}

	/**
	 * 定期的なフラッシュの設定
	 *
	 * 本番環境でのみ有効
	 * バッファに蓄積されたログを定期的に出力
	 */
	private setupPeriodicFlush(): void {
		if (this.config.environment === 'production') {
			this.flushTimer = setInterval(() => {
				this.flushBuffer()
			}, this.config.flushInterval)
		}
	}

	/**
	 * バッファの内容を出力
	 *
	 * 蓄積されたログエントリを一括で出力
	 * エラー時のフォールバック機能を内蔵
	 */
	private async flushBuffer(): Promise<void> {
		if (this.buffer.length === 0) return

		// バッファをコピーして即座にクリア
		const entries = [...this.buffer]
		this.buffer = []

		try {
			// 本番環境では適切なログ出力先へ送信
			// 現在はコンソール出力（将来的に外部ログサービスへ拡張可能）
			await this.outputEntries(entries)
		} catch (_error) {
			console.error('Failed to flush logs:', _error)
			// エラー時は標準出力にフォールバック
			this.fallbackOutput(entries)
		}
	}

	/**
	 * ログエントリの出力処理
	 *
	 * 将来的な外部サービス連携を考慮した拡張可能な設計
	 * 現在はコンソール出力のみ
	 */
	private async outputEntries(entries: LogEntry[]): Promise<void> {
		entries.forEach((entry) => {
			console.log(JSON.stringify(entry))
		})
	}

	/**
	 * フォールバック出力
	 *
	 * 通常の出力処理が失敗した場合の緊急出力
	 * 最低限の情報を確実に記録
	 */
	private fallbackOutput(entries: LogEntry[]): void {
		entries.forEach((entry) => {
			try {
				console.log(`[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`)
			} catch (_error) {
				// 最終的なフォールバック
				console.log(`Log output failed: ${entry.message}`)
			}
		})
	}

	/**
	 * メタデータのサニタイズ
	 *
	 * 機密情報の除去と循環参照の回避
	 * ログ出力時のエラーを防ぐ
	 */
	private sanitizeMeta(meta: LogMeta): LogMeta {
		const sanitized: LogMeta = {}

		// 機密情報が含まれる可能性のあるキーを除外
		const sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth']

		for (const [key, value] of Object.entries(meta)) {
			if (sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))) {
				sanitized[key] = '[REDACTED]'
			} else if (typeof value === 'object' && value !== null) {
				// 循環参照の回避
				try {
					sanitized[key] = JSON.parse(JSON.stringify(value))
				} catch (_error) {
					sanitized[key] = '[CIRCULAR_REFERENCE]'
				}
			} else {
				sanitized[key] = value
			}
		}

		return sanitized
	}

	/**
	 * リクエストIDの生成
	 *
	 * ユニークなリクエストIDを生成
	 * トレーシングとデバッグに使用
	 */
	private generateRequestId(): string {
		// Cloudflare Workers環境でのcrypto.randomUUID()の使用
		if (typeof crypto !== 'undefined' && crypto.randomUUID) {
			return crypto.randomUUID()
		}

		// フォールバック：簡易的なID生成
		return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
	}

	/**
	 * リソースのクリーンアップ
	 *
	 * タイマーの停止とバッファの最終フラッシュ
	 * メモリリークの防止
	 */
	destroy(): void {
		this.isDestroyed = true

		// タイマーの停止
		if (this.flushTimer) {
			clearInterval(this.flushTimer)
			this.flushTimer = null
		}

		// 残りのバッファをフラッシュ
		this.flushBuffer()
	}

	/**
	 * 現在のバッファ状況を取得
	 *
	 * デバッグ・監視目的で使用
	 * 本番環境での動作確認に有用
	 */
	getBufferStatus(): { size: number; maxSize: number } {
		return {
			size: this.buffer.length,
			maxSize: this.config.bufferSize,
		}
	}
}
