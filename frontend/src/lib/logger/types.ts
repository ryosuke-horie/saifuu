/**
 * ログレベルの定義
 * debug: 詳細なデバッグ情報（開発環境のみ）
 * info: 正常な操作の記録
 * warn: 回復可能なエラー・警告
 * error: システムエラー・失敗
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/**
 * フロントエンド環境の定義
 * development: 開発環境
 * production: 本番環境
 * storybook: Storybook環境
 */
export type FrontendEnvironment = 'development' | 'production' | 'storybook'

/**
 * ブラウザ固有のイベントタイプ
 * フロントエンドで発生する主要なイベントを定義
 */
export type BrowserEventType = 
  | 'pageview'           // ページビュー
  | 'click'              // クリック操作
  | 'form_submit'        // フォーム送信
  | 'navigation'         // ナビゲーション
  | 'error'              // エラー発生
  | 'performance'        // パフォーマンス関連
  | 'visibility_change'  // ページ表示状態変更
  | 'beforeunload'       // ページ離脱前
  | 'network_change'     // ネットワーク状態変更
  | 'storage_change'     // ストレージ変更
  | 'component_mount'    // コンポーネントマウント
  | 'component_unmount'  // コンポーネントアンマウント
  | 'api_call'           // API呼び出し
  | 'user_interaction'   // ユーザーインタラクション

/**
 * フロントエンド用ログメタデータの型定義
 * ブラウザ環境特有の情報を含む追加メタデータ
 */
export interface FrontendLogMeta {
  // API logger との互換性を保つ基本フィールド
  requestId?: string
  userId?: string
  operationType?: 'read' | 'write' | 'delete'
  duration?: number
  path?: string
  method?: string
  statusCode?: number
  data?: Record<string, unknown>
  error?: string
  stack?: string

  // フロントエンド固有のメタデータ
  component?: string              // コンポーネント名
  action?: string                 // 実行されたアクション
  pageUrl?: string                // 現在のページURL
  referrer?: string               // リファラー
  userAgent?: string              // ユーザーエージェント
  sessionId?: string              // セッションID
  eventType?: BrowserEventType    // イベントタイプ
  
  // パフォーマンス関連
  loadTime?: number               // ページロード時間
  renderTime?: number             // レンダリング時間
  memoryUsage?: number            // メモリ使用量
  
  // ユーザー操作関連
  elementId?: string              // 操作対象要素ID
  elementText?: string            // 操作対象要素テキスト
  clickPosition?: { x: number; y: number }  // クリック位置
  
  // ネットワーク関連
  networkType?: string            // ネットワークタイプ
  isOnline?: boolean              // オンライン状態
  
  // ページ状態関連
  isVisible?: boolean             // ページ表示状態
  scrollPosition?: number         // スクロール位置
  viewportSize?: { width: number; height: number }  // ビューポートサイズ
  
  // Storybook固有
  storyId?: string                // ストーリーID
  storyName?: string              // ストーリー名
  
  // 拡張可能な追加フィールド
  [key: string]: unknown
}

/**
 * フロントエンド用ログエントリの構造定義
 * 全てのフロントエンドログが従う統一フォーマット
 */
export interface FrontendLogEntry {
  timestamp: string
  level: LogLevel
  message: string
  requestId: string
  environment: FrontendEnvironment
  service: 'saifuu-frontend'
  version: string
  meta: FrontendLogMeta
  
  // フロントエンド固有の追加フィールド
  url: string                     // 現在のページURL
  sessionId: string               // セッションID
  userId?: string                 // ユーザーID（ログイン時のみ）
  deviceInfo?: {
    platform: string
    screenSize: { width: number; height: number }
    colorDepth: number
    pixelRatio: number
  }
}

/**
 * ブラウザ固有のロガー設定
 * 基本のLoggerConfigを拡張してブラウザ環境に対応
 */
export interface BrowserLoggerConfig {
  environment: FrontendEnvironment
  level: LogLevel
  bufferSize: number
  flushInterval: number
  version: string
  
  // ブラウザ固有の設定
  maxRetries: number              // リトライ回数
  retryDelay: number              // リトライ間隔
  enablePerformanceTracking: boolean  // パフォーマンス追跡有効化
  enableUserTracking: boolean     // ユーザー追跡有効化
  enableNetworkTracking: boolean  // ネットワーク追跡有効化
  enableErrorBoundary: boolean    // エラーバウンダリ有効化
  enableNavigationTracking: boolean // ナビゲーション追跡有効化
  enableVisibilityTracking: boolean // ページ表示状態追跡有効化
  enableStorageTracking: boolean  // ストレージ変更追跡有効化
  
  // ローカルストレージ設定
  enableLocalStorage: boolean     // ローカルストレージ使用可否
  localStorageKey: string         // ローカルストレージキー
  maxLocalStorageSize: number     // ローカルストレージ最大サイズ
  
  // 送信設定
  endpoint?: string               // ログ送信先エンドポイント
  headers?: Record<string, string>  // 送信時のヘッダー
  enableBeaconAPI: boolean        // Beacon API使用可否
  
  // デバッグ設定
  enableConsoleOutput: boolean    // コンソール出力有効化
  enableDebugMode: boolean        // デバッグモード有効化
  
  // パフォーマンス設定
  throttleInterval: number        // スロットリング間隔
  maxLogSize: number              // 最大ログサイズ
  
  // セッション設定
  sessionTimeout: number          // セッションタイムアウト
  enableSessionPersistence: boolean // セッション永続化有効化
}

/**
 * フロントエンド用ロガーインターフェース
 * 全てのフロントエンドロガー実装が従う共通インターフェース
 */
export interface FrontendLogger {
  // 基本ログメソッド
  debug(message: string, meta?: FrontendLogMeta): void
  info(message: string, meta?: FrontendLogMeta): void
  warn(message: string, meta?: FrontendLogMeta): void
  error(message: string, meta?: FrontendLogMeta): void
  
  // フロントエンド固有メソッド
  track(eventType: BrowserEventType, message: string, meta?: FrontendLogMeta): void
  pageview(url: string, meta?: FrontendLogMeta): void
  userInteraction(element: string, action: string, meta?: FrontendLogMeta): void
  apiCall(url: string, method: string, duration: number, statusCode: number, meta?: FrontendLogMeta): void
  performance(metric: string, value: number, meta?: FrontendLogMeta): void
  
  // セッション管理
  startSession(userId?: string): void
  endSession(): void
  setUserId(userId: string): void
  clearUserId(): void
  
  // バッファ管理
  flush(): Promise<void>
  clear(): void
  
  // 設定管理
  setLevel(level: LogLevel): void
  getLevel(): LogLevel
  isEnabled(level: LogLevel): boolean
  
  // ユーティリティ
  getSessionId(): string
  getDeviceInfo(): FrontendLogEntry['deviceInfo']
  
  // リスナー管理
  addEventListeners(): void
  removeEventListeners(): void
  
  // 破棄
  destroy(): void
}

/**
 * ログバッファエントリ
 * メモリ内でログを一時保存するためのエントリ
 */
export interface LogBufferEntry {
  entry: FrontendLogEntry
  timestamp: number
  retryCount: number
}

/**
 * エラーバウンダリ用エラー情報
 */
export interface ErrorBoundaryError {
  error: Error
  errorInfo: {
    componentStack: string
  }
  meta?: FrontendLogMeta
}

/**
 * パフォーマンス測定結果
 */
export interface PerformanceMetric {
  name: string
  value: number
  unit: 'ms' | 'bytes' | 'count'
  timestamp: number
  meta?: FrontendLogMeta
}

/**
 * ネットワーク状態情報
 */
export interface NetworkStatus {
  isOnline: boolean
  effectiveType?: string
  downlink?: number
  rtt?: number
  saveData?: boolean
}

/**
 * ページ表示状態
 */
export interface VisibilityState {
  isVisible: boolean
  hiddenTime?: number
  visibleTime?: number
}

/**
 * ストレージ変更情報
 */
export interface StorageChange {
  key: string
  oldValue: string | null
  newValue: string | null
  storageArea: 'localStorage' | 'sessionStorage'
}

/**
 * ユーザーインタラクション情報
 */
export interface UserInteraction {
  type: 'click' | 'scroll' | 'keyboard' | 'touch'
  target: string
  timestamp: number
  details?: Record<string, unknown>
}

/**
 * 環境別設定の型定義
 */
export interface EnvironmentConfig {
  development: Partial<BrowserLoggerConfig>
  production: Partial<BrowserLoggerConfig>
  storybook: Partial<BrowserLoggerConfig>
}

/**
 * デフォルト設定
 */
export const DEFAULT_CONFIG: BrowserLoggerConfig = {
  environment: 'development',
  level: 'debug',
  bufferSize: 10,
  flushInterval: 1000,
  version: '1.0.0',
  maxRetries: 3,
  retryDelay: 1000,
  enablePerformanceTracking: true,
  enableUserTracking: true,
  enableNetworkTracking: true,
  enableErrorBoundary: true,
  enableNavigationTracking: true,
  enableVisibilityTracking: true,
  enableStorageTracking: false,
  enableLocalStorage: true,
  localStorageKey: 'saifuu-logs',
  maxLocalStorageSize: 1024 * 1024, // 1MB
  enableBeaconAPI: true,
  enableConsoleOutput: true,
  enableDebugMode: false,
  throttleInterval: 100,
  maxLogSize: 10 * 1024, // 10KB
  sessionTimeout: 30 * 60 * 1000, // 30分
  enableSessionPersistence: true,
}

/**
 * 環境別のデフォルト設定
 */
export const ENVIRONMENT_CONFIGS: EnvironmentConfig = {
  development: {
    level: 'debug',
    bufferSize: 10,
    flushInterval: 1000,
    enableConsoleOutput: true,
    enableDebugMode: true,
    enablePerformanceTracking: true,
    enableUserTracking: false,
    enableNetworkTracking: true,
    enableErrorBoundary: true,
    enableNavigationTracking: true,
    enableVisibilityTracking: true,
    enableStorageTracking: false,
    enableLocalStorage: true,
    maxRetries: 1,
    retryDelay: 500,
  },
  production: {
    level: 'info',
    bufferSize: 50,
    flushInterval: 5000,
    enableConsoleOutput: false,
    enableDebugMode: false,
    enablePerformanceTracking: true,
    enableUserTracking: true,
    enableNetworkTracking: true,
    enableErrorBoundary: true,
    enableNavigationTracking: true,
    enableVisibilityTracking: true,
    enableStorageTracking: true,
    enableLocalStorage: true,
    maxRetries: 3,
    retryDelay: 1000,
  },
  storybook: {
    level: 'debug',
    bufferSize: 5,
    flushInterval: 500,
    enableConsoleOutput: true,
    enableDebugMode: true,
    enablePerformanceTracking: false,
    enableUserTracking: false,
    enableNetworkTracking: false,
    enableErrorBoundary: false,
    enableNavigationTracking: false,
    enableVisibilityTracking: false,
    enableStorageTracking: false,
    enableLocalStorage: false,
    maxRetries: 0,
    retryDelay: 0,
  },
}