import { shouldLog } from './config'
import { LogEntry, Logger, LoggerConfig, LogLevel, LogMeta } from './types'

/**
 * Cloudflare Workers環境向けに最適化されたロガー
 * バッファリングと非同期処理によりパフォーマンスを最適化
 */
export class CloudflareLogger implements Logger {
	private config: LoggerConfig
	private buffer: LogEntry[] = []
	private flushTimer: NodeJS.Timeout | null = null

	constructor(config: LoggerConfig) {
		this.config = config
		this.setupPeriodicFlush()
	}

	/**
	 * DEBUGレベルのログを出力
	 */
	debug(message: string, meta: LogMeta = {}): void {
		this.log('debug', message, meta)
	}

	/**
	 * INFOレベルのログを出力
	 */
	info(message: string, meta: LogMeta = {}): void {
		this.log('info', message, meta)
	}

	/**
	 * WARNレベルのログを出力
	 */
	warn(message: string, meta: LogMeta = {}): void {
		this.log('warn', message, meta)
	}

	/**
	 * ERRORレベルのログを出力
	 */
	error(message: string, meta: LogMeta = {}): void {
		this.log('error', message, meta)
	}

	/**
	 * 内部ログ処理メソッド
	 */
	private log(level: LogLevel, message: string, meta: LogMeta): void {
		// ログレベルチェック
		if (!shouldLog(this.config.level, level)) {
			return
		}

		const entry: LogEntry = {
			timestamp: new Date().toISOString(),
			level,
			message,
			requestId: meta.requestId || crypto.randomUUID(),
			environment: this.config.environment,
			service: 'saifuu-api',
			version: this.config.version,
			meta,
		}

		if (this.config.environment === 'development') {
			// 開発環境では即座にコンソール出力
			console.log(JSON.stringify(entry, null, 2))
		} else {
			// 本番環境ではバッファリング
			this.buffer.push(entry)

			// バッファサイズが上限に達したら即座にフラッシュ
			if (this.buffer.length >= this.config.bufferSize) {
				this.flushBuffer()
			}
		}
	}

	/**
	 * 定期的なフラッシュの設定
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
	 */
	private async flushBuffer(): Promise<void> {
		if (this.buffer.length === 0) return

		const entries = [...this.buffer]
		this.buffer = []

		try {
			// 本番環境では適切なログ出力先へ送信
			// 現在はコンソール出力（将来的に外部ログサービスへ拡張可能）
			entries.forEach((entry) => {
				console.log(JSON.stringify(entry))
			})
		} catch (error) {
			console.error('Failed to flush logs:', error)
			// エラー時は標準出力にフォールバック
			entries.forEach((entry) => console.log(JSON.stringify(entry)))
		}
	}

	/**
	 * リソースのクリーンアップ
	 */
	destroy(): void {
		if (this.flushTimer) {
			clearInterval(this.flushTimer)
			this.flushTimer = null
		}
		this.flushBuffer()
	}
}
